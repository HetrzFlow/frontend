'use client';

import { useEffect } from 'react';
import debounce from 'lodash-es/debounce';
import { useQuery, queryClient } from '@repo/lib/queryClient';
import { get } from '@repo/lib/rest';
import { HZLP_CONSTANTS, isHzlpPricePair } from '../../constants/common';
import { ORACLE_API_BASE_URL } from './const';
import { useHzLPDetail } from './hzlp';

const cachedInstsKey = ['prices', 'instIds'];
const pricesKey = ['rest', 'prices'];

export type PriceType = {
  symbol: string;
  price: string;
  timestamp: number;
};

interface PricessResp {
  data: {
    prices: PriceType[] | null;
  };
}

// fetch prices
const pricesFetcher = debounce(async () => {
  const cachedInsts =
    queryClient.getQueryData<Record<string, number>>(cachedInstsKey) || {};
  if (!Object.keys(cachedInsts).length) {
    queryClient.setQueryData([...pricesKey, 'isFetching'], false);
    return {};
  }
  const { data } = await get<PricessResp>(
    `${ORACLE_API_BASE_URL}/v1/latestPrice`,
    Object.keys(cachedInsts).map((v) => ['symbols[]', v]),
  );
  const result =
    (data?.prices?.reduce((acc, cur) => {
      queryClient.setQueryData([...pricesKey, cur.symbol], cur);
      return { ...acc, [cur.symbol]: cur };
    }, {}) as Record<string, PriceType>) || {};
  const coinPrices =
    queryClient.getQueryData<Record<string, PriceType>>(pricesKey) || {};
  queryClient.setQueryData(pricesKey, { ...coinPrices, ...result });

  queryClient.setQueryData([...pricesKey, 'isFetching'], false);
}, 300);

// get coin prices
export const useCoinPrices = (instIds: string[]) => {
  // filter HZLP
  const filterInstIds = instIds.filter((v) => !isHzlpPricePair(v));
  const { data: isFetching } = useQuery({
    queryKey: [...pricesKey, 'isFetching'],
    queryFn: () => false,
  });

  useHZLPPrice(instIds.some((instId) => isHzlpPricePair(instId)));

  useEffect(() => {
    const cachedInsts =
      queryClient.getQueryData<Record<string, number>>(cachedInstsKey) || {};
    let needRefetch = false;
    filterInstIds.forEach((instId) => {
      cachedInsts[instId] = (cachedInsts[instId] || 0) + 1;
      queryClient.setQueryData(cachedInstsKey, cachedInsts);
      if (cachedInsts[instId] === 1) {
        needRefetch = true;
      }
    });

    // trigger fetch
    if (needRefetch) {
      queryClient.invalidateQueries({
        queryKey: pricesKey,
      });
    }

    return () => {
      const cachedInsts =
        queryClient.getQueryData<Record<string, number>>(cachedInstsKey) || {};
      filterInstIds.forEach((instId) => {
        cachedInsts[instId] = (cachedInsts[instId] || 0) + 1;
        queryClient.setQueryData(cachedInstsKey, cachedInsts);
        cachedInsts[instId] = Math.max((cachedInsts[instId] || 0) - 1, 0);

        if (!cachedInsts[instId]) {
          delete cachedInsts[instId];
        }
      });
      queryClient.setQueryData(cachedInstsKey, cachedInsts);
    };
  }, [filterInstIds]);

  const { data, refetch } = useQuery({
    queryKey: pricesKey,
    initialData: {},
    queryFn: async () => {
      const cachedPrices =
        queryClient.getQueryData<Record<string, PriceType>>(pricesKey);
      queryClient.setQueryData([...pricesKey, 'isFetching'], true);
      pricesFetcher();

      return cachedPrices;
    },
  });

  return { data, isFetching, refetch };
};

// HZLP price
export const useHZLPPrice = (isHzlp: boolean = true) => {
  const { data: hzlpDetail } = useHzLPDetail(isHzlp);

  useEffect(() => {
    if (!isHzlp || !hzlpDetail?.hzlp_price) return;

    const px = hzlpDetail.hzlp_price.toString();

    const priceData = {
      price: px,
      timestamp: Date.now(),
    } as PriceType;

    const keys = HZLP_CONSTANTS.PRICE_PAIRS;

    keys.forEach((key) => {
      queryClient.setQueryData([...pricesKey, key], priceData);
    });

    const coinPrices =
      queryClient.getQueryData<Record<string, PriceType>>(pricesKey);
    if (coinPrices) {
      keys.forEach((key) => {
        coinPrices[key] = {
          symbol: key,
          price: px,
          timestamp: Date.now(),
        } as PriceType;
      });
      queryClient.setQueryData(pricesKey, { ...coinPrices });
    }
  }, [hzlpDetail?.hzlp_price, isHzlp]);

  return hzlpDetail?.hzlp_price.toString();
};
