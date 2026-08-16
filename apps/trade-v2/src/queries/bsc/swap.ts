'use client';

import { useInfiniteQuery, useQuery } from '@repo/lib/queryClient';
import {
  fetchRecommendedSwapTokens,
  fetchSwapPrices,
  fetchSwapHistory,
  normalizeSwapPriceAddresses,
  SWAP_HISTORY_PAGE_SIZE,
} from '@/services/rest/swap';

const RECOMMENDED_TOKENS_CACHE_TIME = 5 * 60_000;

export const swapQueryKeys = {
  all: ['bsc-data-query', 'swap'] as const,
  recommendedTokens: () =>
    [...swapQueryKeys.all, 'recommended-tokens'] as const,
  prices: (addresses: readonly string[]) =>
    [
      ...swapQueryKeys.all,
      'prices',
      ...normalizeSwapPriceAddresses(addresses),
    ] as const,
  histories: () => [...swapQueryKeys.all, 'user-history'] as const,
  history: (account: string) =>
    [
      ...swapQueryKeys.histories(),
      account.toLowerCase(),
      SWAP_HISTORY_PAGE_SIZE,
    ] as const,
};

export const useSwapPricesQuery = (
  addresses: readonly string[],
  enabled = true,
) => {
  const normalizedAddresses = normalizeSwapPriceAddresses(addresses);

  return useQuery({
    queryKey: swapQueryKeys.prices(normalizedAddresses),
    enabled: enabled && normalizedAddresses.length > 0,
    queryFn: ({ signal }) => fetchSwapPrices(normalizedAddresses, signal),
    staleTime: 10_000,
    gcTime: 60_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useRecommendedSwapTokensQuery = () =>
  useQuery({
    queryKey: swapQueryKeys.recommendedTokens(),
    queryFn: ({ signal }) => fetchRecommendedSwapTokens(signal),
    staleTime: RECOMMENDED_TOKENS_CACHE_TIME,
    gcTime: RECOMMENDED_TOKENS_CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });

export const useSwapHistoryQuery = (account: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: swapQueryKeys.history(account),
    enabled: enabled && !!account,
    queryFn: ({ pageParam, signal }) =>
      fetchSwapHistory({
        account,
        page: pageParam,
        limit: SWAP_HISTORY_PAGE_SIZE,
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
