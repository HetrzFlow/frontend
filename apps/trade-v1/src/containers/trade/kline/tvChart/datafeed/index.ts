import { msg } from '@lingui/core/macro';
import { i18n } from '@repo/i18n/client';
import type { Coin, Inst } from '@/common';
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

import { CandleDataType, getBars } from '@/services/rest/kline';
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

export const createDatafeed = ({
  insts,
  coins,
}: {
  insts: Record<string, Inst>;
  coins: Record<string, Coin>;
}): IBasicDataFeed => {
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
      const pxDispDecimal =
        coins[insts[symbolName]?.coinType || '']?.pxDispDecimal ?? 2;
      //`resolveSymbol` should return result asynchronously. Use `setTimeout` with 0 interval to execute the callback function.
      setTimeout(() => {
        onResolve({
          ticker: symbolName,
          name: `${symbolName.replace('/', '')}`,
          full_name: `${symbolName}`,
          description: `${symbolName.replace('/', '')}`,
          type: 'Perp',
          session: '24x7',
          exchange: 'hz',
          listed_exchange: '',
          timezone: Intl.DateTimeFormat().resolvedOptions()
            .timeZone as Timezone,
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
          supported_resolutions: supportedResolutions,
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
      // supported resolution
      if (resolutionMap[resolution] && resolutionIntervalMap[resolution]) {
        const launchTime =
          coins[insts[symbolInfo.ticker || '']?.coinType || '']?.launchTime;

        const { countBack } = periodParams;
        try {
          const interval = resolutionIntervalMap[resolution];
          const realTo = Math.min(
            Math.floor(Date.now() / 1000),
            periodParams.to,
          );

          const to = Math.floor(realTo / interval) * interval;

          const data: CandleDataType[] = await new Promise(
            (resolve, reject) => {
              const attempt = (count: number) => {
                getBars({
                  launchTime,
                  to: realTo,
                  count: countBack,
                  resolution,
                  instId: symbolInfo.ticker as string,
                })
                  .then(resolve)
                  .catch((err) => {
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
          }

          // handle empty data
          const dataObj = Object.fromEntries(data.map((v) => [v.timestamp, v]));

          const result = [];
          let prevBar: CandleDataType = data[0]!;

          for (let t = prevBar.timestamp; t <= to; t += interval) {
            const rawData = dataObj[t];
            const prevClose = prevBar.close || NaN;
            if (rawData) {
              // use close price of prev bar to set empty bar
              if (
                !rawData.high ||
                !rawData.low ||
                !rawData.open ||
                !rawData.close
              ) {
                result.push({
                  time: t * 1000,
                  open: +prevClose,
                  high: +prevClose,
                  low: +prevClose,
                  close: +prevClose,
                  volume: 0,
                });
              } else {
                result.push({
                  time: t * 1000,
                  open: +rawData.open,
                  high: +rawData.high,
                  low: +rawData.low,
                  close: +rawData.close,
                  volume: 0,
                });
                prevBar = rawData;
              }
            } else {
              result.push({
                time: t * 1000,
                open: +prevClose,
                high: +prevClose,
                low: +prevClose,
                close: +prevClose,
                volume: 0,
              });
            }
          }
          if (result[result.length - 1]) {
            const cache = lastBarCacheFromRest.get(symbolInfo.ticker as string);
            if (!cache || cache.time < result[result.length - 1]!.time) {
              lastBarCacheFromRest.set(symbolInfo.ticker as string, {
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
        }
      } else {
        onError(i18n._(msg`Unsupported interval: ${resolution}`));
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
