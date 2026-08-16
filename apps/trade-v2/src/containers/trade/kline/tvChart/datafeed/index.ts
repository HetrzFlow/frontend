import { msg } from '@lingui/core/macro';
import { i18n } from '@repo/i18n/client';
import { NET_ERR_CODE } from '@repo/lib/rest';
import type { Inst } from '@/common';
import type {
  ErrorCallback,
  HistoryCallback,
  IBasicDataFeed,
  LibrarySymbolInfo,
  OnReadyCallback,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  // SearchSymbolsCallback,
  SubscribeBarsCallback,
  // SymbolResolveExtension,
  Timezone,
} from '@/lib/charting_library/charting_library';

import { CREDIT_CATEGORY } from '@/lib/credit/creditMarkets';
import { parseSchedule } from '@/lib/market/dateConverter';
import {
  CandleDataType,
  getBars,
  stocksSupportedResolutions,
} from '@/services/rest/kline';
import {
  DEFAULT_TIME_AXIS_SCALE,
  useKlineStore,
} from '@/stores/trade/kline';
import {
  resolutionIntervalMap,
  resolutionMap,
  supportedResolutions,
} from '../const';

import {
  subscribeBars,
  unsubscribeBars,
  lastBarCacheFromRest,
} from './streaming';

const MAX_INITIAL_BARS = 1000;

export const createDatafeed = ({
  insts,
}: {
  insts: Record<string, Inst>;
}): IBasicDataFeed => {
  const instBySymbol = new Map<string, Inst>();

  Object.values(insts).forEach((inst) => {
    if (inst.category !== CREDIT_CATEGORY || !instBySymbol.get(inst.symbol)) {
      instBySymbol.set(inst.symbol, inst);
    }
  });

  return {
    // getMarks?(symbolInfo: LibrarySymbolInfo, from: number, to: number, onDataCallback: GetMarksCallback<Mark>, resolution: ResolutionString): void;
    // getTimescaleMarks?(symbolInfo: LibrarySymbolInfo, from: number, to: number, onDataCallback: GetMarksCallback<TimescaleMark>, resolution: ResolutionString): void;
    // getServerTime?(callback: ServerTimeCallback): void;
    searchSymbols() {
      // userInput: string,
      // exchange: string,
      // symbolType: string,
      // onResult: SearchSymbolsCallback,
    },
    async resolveSymbol(
      symbolName: string,
      onResolve: ResolveCallback,
      // onError: ErrorCallback,
      // extension?: SymbolResolveExtension,
    ) {
      const inst = instBySymbol.get(symbolName);
      const category = inst?.category;
      const pxDispDecimal = inst?.pxDispDecimal ?? 2;
      const name = inst?.name || symbolName;
      const isCrypto = ['crypto', 'memes'].includes(category!);

      //`resolveSymbol` should return result asynchronously. Use `setTimeout` with 0 interval to execute the callback function.
      setTimeout(() => {
        const { session, timezone } = parseSchedule(inst?.schedule);
        onResolve({
          ticker: symbolName,
          name: `${name.replace('/', '')}`,
          full_name: `${name}`,
          description: `${name.replace('/', '')}`,
          type: 'Perp',
          session: session,
          exchange: 'hz',
          listed_exchange: '',
          timezone: timezone as Timezone,
          /**
           * Prices format: "price" or "volume"
           */
          format: 'price',
          /**
           * Code (Tick)
           * @example 8/16/.../256 (1/8/100 1/16/100 ... 1/256/100) or 1/10/.../10000000 (1 0.1 ... 0.0000001)
           */
          pricescale: Math.pow(10, pxDispDecimal),
          /**
           * The number of units that make up one tick.
           * @example For example, U.S. equities are quotes in decimals, and tick in decimals, and can go up +/- .01. So the tick increment is 1. But the e-mini S&P futures contract, though quoted in decimals, goes up in .25 increments, so the tick increment is 25. (see also Tick Size)
           */
          minmov: 1,
          supported_resolutions: isCrypto
            ? supportedResolutions
            : stocksSupportedResolutions,
          // support minutes data
          has_intraday: true,
          // support seconds data
          has_seconds: true,
        });
      }, 0);
    },
    async getBars(
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      periodParams: PeriodParams,
      onResult: HistoryCallback,
      onError: ErrorCallback,
    ) {
      useKlineStore.setState({ dataIsFetching: true });
      // supported resolution
      if (resolutionMap[resolution] && resolutionIntervalMap[resolution]) {
        const inst = instBySymbol.get(symbolInfo.ticker || '');
        const category = inst?.category;
        const isCrypto = ['crypto', 'memes'].includes(category!);
        const launchTime = inst?.launchTime;

        const { countBack, from, to, firstDataRequest } = periodParams;
        const timeAxisScale = useKlineStore.getState().timeAxisScale;
        const scaleBasedCount =
          Number.isFinite(timeAxisScale) && timeAxisScale > 0
            ? Math.ceil(
                (countBack * DEFAULT_TIME_AXIS_SCALE) / timeAxisScale,
              )
            : countBack;
        const rangeBasedCount = Math.ceil(
          Math.max(0, Math.min(to, Math.floor(Date.now() / 1000)) - from) /
            resolutionIntervalMap[resolution],
        );
        const initialRequestCount = firstDataRequest
          ? Math.min(
              MAX_INITIAL_BARS,
              Math.max(
                countBack,
                scaleBasedCount,
                rangeBasedCount,
              ),
            )
          : countBack;
        try {
          const realTo = Math.min(
            Math.floor(Date.now() / 1000),
            periodParams.to,
          );

          const data: CandleDataType[] = await new Promise(
            (resolve, reject) => {
              const attempt = (count: number) => {
                getBars({
                  launchTime,
                  to: realTo,
                  count: initialRequestCount,
                  resolution,
                  instId: symbolInfo.ticker as string,
                  minLimit: isCrypto ? 300 : 1000,
                })
                  .then(resolve)
                  .catch((err) => {
                    // 4xx is non-retryable — request range is invalid
                    const status = (err as { status?: number })?.status;
                    if (
                      (err as { code?: string })?.code ===
                        NET_ERR_CODE.HttpError &&
                      status &&
                      status >= 400 &&
                      status < 500
                    ) {
                      reject(err);
                      return;
                    }
                    if (count === 0) {
                      reject(err);
                    } else {
                      setTimeout(() => attempt(count - 1), 2000);
                    }
                  });
              };
              attempt(5);
            },
          );

          // no data
          if (!data.length) {
            onResult([], {
              noData: true,
            });
            return;
          }

          const result = data.reduce<
            {
              time: number;
              open: number;
              high: number;
              low: number;
              close: number;
              volume: number;
            }[]
          >((bars, rawData) => {
            const open = +rawData.open;
            const high = +rawData.high;
            const low = +rawData.low;
            const close = +rawData.close;

            if (!open || !high || !low || !close) {
              return bars;
            }

            bars.push({
              time: rawData.timestamp * 1000,
              open,
              high,
              low,
              close,
              volume: +rawData.volume || 0,
            });

            return bars;
          }, []);
          if (result[result.length - 1]) {
            const cache = lastBarCacheFromRest.get(
              `${symbolInfo.ticker}_${resolution}`,
            );
            if (!cache || cache.time < result[result.length - 1]!.time) {
              lastBarCacheFromRest.set(`${symbolInfo.ticker}_${resolution}`, {
                // tv will modify origin object, so create new object
                ...result[result.length - 1]!,
              });
            }
          }

          onResult(result, {
            noData: !result.length,
          });
        } catch {
          onError(i18n._(msg`Failed to load history candlestick data.`));
        } finally {
          useKlineStore.setState({ dataIsFetching: false });
        }
      } else {
        onError(i18n._(msg`Unsupported interval: ${resolution}`));
        useKlineStore.setState({ dataIsFetching: false });
      }
    },
    subscribeBars(
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      onTick: SubscribeBarsCallback,
      listenerGuid: string,
      onResetCacheNeededCallback: () => void,
    ) {
      subscribeBars(
        symbolInfo,
        resolution,
        onTick,
        listenerGuid,
        onResetCacheNeededCallback,
      );
    },
    unsubscribeBars(listenerGuid: string) {
      unsubscribeBars(listenerGuid);
    },

    // subscribeDepth?(symbol: string, callback: DOMCallback): string;
    // unsubscribeDepth?(subscriberUID: string): void;
    // getVolumeProfileResolutionForPeriod?(currentResolution: ResolutionString, from: number, to: number, symbolInfo: LibrarySymbolInfo): ResolutionString;

    onReady(callback: OnReadyCallback) {
      setTimeout(() => {
        callback({
          supported_resolutions: supportedResolutions,
        });
      });
    },
  };
};
