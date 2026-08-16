'use client';

import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { generateSub } from '@repo/lib/ws';
import { useChainId } from '@/common/chainClient';
import {
  CONTRACT_USD_MULTIPLIER,
  getUsdPriceSymbolAliases,
  normalizeUsdPriceSymbol,
} from '@/common/constants';
import type { Coin, Inst } from '@/common/services/rest/inst';
import { usePriceStore, useInstStore } from '@/common/stores';
import { getBoundedTokenPricesFromAggregatePrice } from '@/common/stores/priceStore';
import type { PriceTickerStoreItem } from '@/common/stores/priceStore';
import { throttle } from '@/lib/runtime/timing';
import { ws } from './instance';

export const priceTickerChannel = 'priceTicker';

export type PriceTickerResType = {
  t: number; // second
  s: string; // instId
  p: string; // price
  minPrice?: string;
  maxPrice?: string;
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

function formatContractUsdPrice(price: bigint) {
  return calc(price.toString()).div(CONTRACT_USD_MULTIPLIER).toFixed();
}

function shouldSkipTickerUpdate(
  cachedData: PriceTickerResType[] | undefined,
  nextItem: PriceTickerResType,
) {
  const cachedItem = cachedData?.[0];
  if (!cachedItem?.t) return false;

  // REST bootstrap prices use Date.now() milliseconds and have an empty source.
  // WS tickers use second timestamps and should not be blocked by REST cache.
  if (!cachedItem.i) return false;

  return cachedItem.t >= nextItem.t;
}

function updatePriceTickerStore({
  symbol,
  symbolData,
  coins,
  insts,
  chainId,
}: {
  symbol: string;
  symbolData: ExtendPriceTickerResType[];
  coins: Record<string, Coin | undefined>;
  insts: Inst[];
  chainId?: number;
}) {
  const item = symbolData[0];
  if (!item?.t) return;

  const cachedData = usePriceStore.getState().priceTickers[symbol] as
    | PriceTickerResType[]
    | undefined;

  if (shouldSkipTickerUpdate(cachedData, item)) {
    return;
  }

  const price = BigInt(calc(item.p).times(CONTRACT_USD_MULTIPLIER).toFixed(0));
  const newPrice = getBoundedTokenPricesFromAggregatePrice(price);
  usePriceStore.getState().setPriceTicker(symbol, [
    {
      ...item,
      minPrice: formatContractUsdPrice(newPrice.minPrice),
      maxPrice: formatContractUsdPrice(newPrice.maxPrice),
    },
  ]);

  // if there is token address, use address to find token
  const coinSymbol = symbol.replace(/(\/USD$|^USD\/)/, '');
  const coin = coins[coinSymbol];
  if (!coin) return;

  usePriceStore
    .getState()
    .setSymbolPrice(symbol, newPrice, { chainId, insts, coins });
}

/**
 * ws ticker hook
 */
export function usePriceTickerStream(
  symbol?: string,
  options?: { throttleWait?: number },
): { data: ExtendPriceTickerResType[] };
export function usePriceTickerStream(
  symbols: string[],
  options?: { throttleWait?: number },
): { data: ExtendPriceTickerResType[][] };
export function usePriceTickerStream(
  symbols?: string | string[],
  { throttleWait = 0 } = {},
) {
  const chainId = useChainId();
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInstsArr());
  const priceSymbolAliases = useMemo(
    () => getUsdPriceSymbolAliases({ chainId, coins }),
    [chainId, coins],
  );
  const rawSymbolsArr = symbols
    ? symbols instanceof Array
      ? symbols.filter((v) => v)
      : [symbols]
    : [];
  const symbolsKey = rawSymbolsArr
    .map((symbol) => normalizeUsdPriceSymbol(symbol, priceSymbolAliases))
    .join();
  const symbolsArr = useMemo(() => {
    // Depend on a primitive key so callers that pass a fresh array each render
    // do not resubscribe/recompute unless the actual symbol list changes.
    return symbolsKey ? symbolsKey.split(',').filter((v) => v) : [];
  }, [symbolsKey]);

  useEffect(() => {
    if (!symbolsArr.length) return undefined;

    const throttledUpdates: Array<
      ((data: PriceTickerResType[]) => void) & {
        cancel?: () => void;
      }
    > = [];
    const unsubscribe = subPriceTicker(
      symbolsArr.map((symbol) => {
        const update = (newData: PriceTickerResType[]) => {
          const item = newData[0];
          if (!item?.t) return;

          const prevData = usePriceStore.getState().priceTickers[symbol] as
            | PriceTickerResType[]
            | undefined;
          const prevLast = prevData?.[0]?.p || '';
          const last = calc(item.p);
          const symbolData = [
            {
              ...item,
              prevLast,
              isLiveUp: last.gt(prevLast),
              isLiveDown: last.lt(prevLast),
            },
          ];

          updatePriceTickerStore({
            symbol,
            symbolData,
            coins,
            insts,
            chainId,
          });
        };
        const throttledUpdate: typeof update & { cancel?: () => void } =
          throttleWait ? throttle(update, throttleWait) : update;
        throttledUpdates.push(throttledUpdate);

        return {
          instId: symbol.replace('/', '').toLowerCase(),
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
  }, [chainId, coins, insts, symbolsArr, throttleWait]);

  const data = usePriceStore(
    useShallow((state) =>
      symbolsArr.map(
        (symbol) => state.priceTickers[symbol] ?? EMPTY_TICKER_STREAM_DATA,
      ),
    ),
  );

  return symbols instanceof Array
    ? ({ data } as {
        data: ExtendPriceTickerResType[][];
      })
    : { data: data[0] ?? EMPTY_TICKER_STREAM_DATA };
}

// get ticker from cache
export const getCachedPriceTickerData = (symbol?: string) => {
  if (!symbol) return undefined;
  return usePriceStore.getState().priceTickers[
    normalizeUsdPriceSymbol(symbol)
  ] as PriceTickerStoreItem[] | undefined;
};
