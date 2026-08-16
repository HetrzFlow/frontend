'use client';

import { useEffect } from 'react';

import { calc } from '@repo/lib/calc';
import { useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';

import { useHzSdk } from '@/common/chainClient';
import { CONTRACT_USD_MULTIPLIER } from '@/common/constants';
import { useInstStore, usePriceStore } from '@/common/stores';
import {
  getAggregatePriceFromTokenPrices,
  getBoundedTokenPricesFromAggregatePrice,
} from '@/common/stores/priceStore';
import type { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';

export type PriceType = {
  symbol: string;
  price: string;
  timestamp: number;
};

function updatePriceInWsCache({
  symbol,
  prices,
  timestamp,
}: {
  symbol: string;
  prices: TokenPrices;
  timestamp: number;
}) {
  if (usePriceStore.getState().priceTickers[symbol]) return;

  const aggregatePrice = getAggregatePriceFromTokenPrices(prices) ?? 0n;
  const boundedPrices = getBoundedTokenPricesFromAggregatePrice(aggregatePrice);

  usePriceStore.getState().setPriceTicker(symbol, [
    {
      t: timestamp,
      s: symbol,
      p: calc(aggregatePrice.toString()).div(CONTRACT_USD_MULTIPLIER).toFixed(),
      minPrice: calc(boundedPrices.minPrice.toString())
        .div(CONTRACT_USD_MULTIPLIER)
        .toFixed(),
      maxPrice: calc(boundedPrices.maxPrice.toString())
        .div(CONTRACT_USD_MULTIPLIER)
        .toFixed(),
      n: '',
      d: '',
      i: '',
    },
  ]);
}

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000;

export const usePrices = (options?: { enabled?: boolean }) => {
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInstsArr());
  const coinsReady = Object.keys(coins).length > 0;
  const enabled = !!hzSdk && coinsReady && (options?.enabled ?? true);
  const result = useQuery({
    queryKey: ['rest', 'prices', hzSdk?.chainId],
    queryFn: async () => {
      const { pricesData = {} } = await hzSdk!.tokens.getTokenRecentPrices();

      Object.entries(pricesData).forEach(([address, v]) => {
        if (coins[address] && v.symbol) {
          updatePriceInWsCache({
            symbol: v.symbol,
            timestamp: Date.now(),
            prices: v,
          });
        }
      });

      return pricesData;
    },
    retry: MAX_RETRY_COUNT,
    retryDelay: (attemptIndex) =>
      Math.min(RETRY_DELAY_MS * 2 ** attemptIndex, 30000),
    enabled,
    meta: {
      onError: (error: Error) => {
        toast.error(error.message, { id: 'rest-prices' });
        throw error;
      },
    },
  });

  useEffect(() => {
    if (!hzSdk || !result.data) return;

    usePriceStore.getState().setAggregatedPricesMap(result.data, {
      chainId: hzSdk.chainId,
      insts,
      coins,
    });
  }, [coins, hzSdk, insts, result.data]);

  return result;
};
