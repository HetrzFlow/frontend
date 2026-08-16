import { useEffect, useMemo } from 'react';
import throttle from 'lodash-es/throttle';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { generateSub } from '@repo/lib/ws';
import { usePriceStore } from '@/common/stores';
import { ws } from './instance';

const priceTickerChannel = 'priceTicker';
export type PriceTickerResType = {
  t: number; // second
  s: string; // instId
  p: string; // price
  n: string; // volume
  d: 'buy' | 'sell'; // trade direction: buy/sell
  i: 'trade' | 'oracle'; // price source: oracle/trade
};

export type PriceTickerParamType = {
  instId: string;
};
export const [subPriceTicker, unsubPriceTicker] = generateSub<
  PriceTickerParamType,
  PriceTickerResType[]
>(ws, priceTickerChannel, ['instId']);

// price ticker
export type ExtendPriceTickerResType = PriceTickerResType & {
  // prev price
  prevLast: string;
  isLiveUp: boolean;
  isLiveDown: boolean;
};

const EMPTY_TICKER_STREAM_DATA: PriceTickerResType[] = [];

function shouldSkipTickerUpdate(
  cachedData: PriceTickerResType[] | undefined,
  nextItem: PriceTickerResType,
) {
  const cachedItem = cachedData?.[0];
  if (!cachedItem?.t) return false;
  if (!cachedItem.i) return false;
  return cachedItem.t >= nextItem.t;
}

function updatePriceTickerStore({
  instId,
  symbolData,
}: {
  instId: string;
  symbolData: ExtendPriceTickerResType[];
}) {
  const item = symbolData[0];
  if (!item?.t) return;

  const cachedData =
    usePriceStore.getState().priceTickers[instId] as
      | PriceTickerResType[]
      | undefined;

  if (shouldSkipTickerUpdate(cachedData, item)) {
    return;
  }

  usePriceStore.getState().setPriceTicker(instId, symbolData);
}

/**
 * ws ticker hook
 */
export function usePriceTickerStream(
  instId?: string,
  options?: { throttleWait?: number },
): { data: ExtendPriceTickerResType[] };
export function usePriceTickerStream(
  instIds: string[],
  options?: { throttleWait?: number },
): { data: ExtendPriceTickerResType[][] };
export function usePriceTickerStream(
  instIds?: string | string[],
  { throttleWait = 0 } = {},
) {
  const instIdsKey =
    instIds instanceof Array ? instIds.filter((v) => v).join() : instIds || '';

  const instIdsArr = useMemo(() => {
    return instIdsKey ? instIdsKey.split(',').filter((v) => v) : [];
  }, [instIdsKey]);

  useEffect(() => {
    if (!instIdsArr.length) return undefined;

    const throttledUpdates: Array<
      ((data: PriceTickerResType[]) => void) & {
        cancel?: () => void;
      }
    > = [];
    const unsubscribe = subPriceTicker(
      instIdsArr.map((instId) => {
        const update = (newData: PriceTickerResType[]) => {
          const item = newData[0];
          if (!item?.t) return;

          const prevData =
            usePriceStore.getState().priceTickers[instId] as
              | PriceTickerResType[]
              | undefined;
          const prevLast = prevData?.[0]?.p || '';
          const last = calc(item.p);
          const symbolData = [
            {
              ...item,
              prevLast,
              isLiveUp: last.gt(prevLast || 0),
              isLiveDown: last.lt(prevLast || 0),
            },
          ];

          updatePriceTickerStore({ instId, symbolData });
        };
        const throttledUpdate: typeof update & { cancel?: () => void } =
          throttleWait ? throttle(update, throttleWait) : update;
        throttledUpdates.push(throttledUpdate);

        return {
          instId: instId.replace('/', '').toLowerCase(),
          callback: (res) => {
            throttledUpdate(res.data);
          },
        };
      }),
    );

    return () => {
      throttledUpdates.forEach((update) => update.cancel?.());
      unsubscribe();
    };
  }, [instIdsArr, throttleWait]);

  const data = usePriceStore(
    useShallow((state) =>
      instIdsArr.map(
        (instId) =>
          state.priceTickers[instId] ??
          EMPTY_TICKER_STREAM_DATA,
      ),
    ),
  );

  return instIds instanceof Array
    ? ({ data } as {
        data: ExtendPriceTickerResType[][];
      })
    : { data: data[0] ?? EMPTY_TICKER_STREAM_DATA };
}

// get ticker from cache
export const getCachedPriceTickerData = (instId?: string) => {
  if (!instId) return undefined;
  return usePriceStore.getState().priceTickers[instId] as
    | PriceTickerResType[]
    | undefined;
};
