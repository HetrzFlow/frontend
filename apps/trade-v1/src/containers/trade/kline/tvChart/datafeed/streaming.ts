import { EVENT_NAMES } from '@repo/lib/ws';
import { subPriceTicker } from '@/common';
import type {
  LibrarySymbolInfo,
  ResolutionString,
  SubscribeBarsCallback,
} from '@/lib/charting_library/charting_library';

import { addWsListener } from '@/services/ws';
import { inSamePeriod } from '../utils';

export const lastBarCacheFromRest = new Map<
  string,
  {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volumn?: number;
  }
>();

const subscritionMap = new Map<
  string,
  {
    // record last bar
    lastBar?: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volumn?: number;
    };
    // cancel bar subscribe
    unsub?: () => void;
  }
>();

const wsSubscribe = (
  symbolInfo: LibrarySymbolInfo,
  resolution: ResolutionString,
  onTick: SubscribeBarsCallback,
  listenerGuid: string,
  onResetCacheNeededCallback: () => void,
) => {
  const subObj = subscritionMap.get(listenerGuid);
  if (!subObj || !symbolInfo.ticker) {
    return () => {};
  }

  const unsub = subPriceTicker({
    // BTC/USD -> btcusd
    instId: symbolInfo.ticker.replace('/', '').toLowerCase(),
    callback: ({ data }) => {
      if (!data[0]) return;
      const { t, p, n } = data[0];
      const numPx = +p;

      const lastBarCache = lastBarCacheFromRest.get(
        symbolInfo.ticker as string,
      );
      if (lastBarCache && !subObj.lastBar) {
        subObj.lastBar = lastBarCache;
      }

      if (
        !subObj.lastBar ||
        !inSamePeriod(resolution, subObj.lastBar.time / 1000, t)
      ) {
        // create new bar
        subObj.lastBar = {
          time: t * 1000,
          open: numPx,
          high: numPx,
          low: numPx,
          close: numPx,
          volumn: +n || 0,
        };
      } else {
        // update bar
        subObj.lastBar.close = numPx;
        subObj.lastBar.high = Math.max(numPx, subObj.lastBar.high);
        subObj.lastBar.low = Math.min(numPx, subObj.lastBar.low);
      }
      // tv will modify origin object, so create new object
      onTick({ ...subObj.lastBar });
    },
  });

  const removeListener = addWsListener(EVENT_NAMES.CLOSE, () => {
    onResetCacheNeededCallback();
  });

  return () => {
    unsub();
    removeListener();
  };
};

const subscribeFn = (
  symbolInfo: LibrarySymbolInfo,
  resolution: ResolutionString,
  onTick: SubscribeBarsCallback,
  listenerGuid: string,
  onResetCacheNeededCallback: () => void,
) => {
  const unsubscribe = wsSubscribe(
    symbolInfo,
    resolution,
    onTick,
    listenerGuid,
    onResetCacheNeededCallback,
  );

  return unsubscribe;
};

// subscribe bar data
export const subscribeBars = (
  symbolInfo: LibrarySymbolInfo,
  resolution: ResolutionString,
  onTick: SubscribeBarsCallback,
  listenerGuid: string,
  onResetCacheNeededCallback: () => void,
) => {
  const subObj: { unsub?: () => void } = {};
  subscritionMap.set(listenerGuid, subObj);

  const unsubscribe = subscribeFn(
    symbolInfo,
    resolution,
    onTick,
    listenerGuid,
    onResetCacheNeededCallback,
  );

  subObj.unsub = unsubscribe;
};

// unsubscribe bar data
export const unsubscribeBars = (listenerGuid: string) => {
  const { unsub } = subscritionMap.get(listenerGuid) || {};

  if (unsub) {
    unsub();
  }

  subscritionMap.delete(listenerGuid);
};
