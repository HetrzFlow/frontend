import { useCallback, useMemo } from 'react';
import { calc } from '@repo/lib/calc';
import {
  type InfiniteData,
  queryClient,
  useInfiniteQuery,
  useQuery,
} from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import {
  PAGE_LIMIT,
  useCurrentAccountAddress,
  useHzSdk,
  useInstStore,
  usePositionConstants,
} from '@/common';
import { normalizeClaimStats } from '@/common/services/rest/claimStats';
import {
  fetchStatsClaimHistory,
  fetchStatsClaims,
} from '@/common/services/rest/stats';
import type { ClaimHistoryPageDataType } from '@/containers/trade/order/Claim/type';
import type { Address } from 'viem';

export const claimableFundingFeesQueryKey = (
  chainId: number | undefined,
  userAddress: string | undefined,
) => ['rest', 'claimableData', chainId, userAddress];

// get claimable funding fees and price impact rebates
export const useClaimableFundingFees = (
  options: { enabled?: boolean } = {},
) => {
  const hzSdk = useHzSdk();
  const userAddress = useCurrentAccountAddress();
  const insts = useInstStore((state) => state.getViewInstsArr());

  return useQuery({
    queryKey: [
      claimableFundingFeesQueryKey(hzSdk?.chainId, userAddress),
      insts.map((v) => v.marketTokenAddress).sort(),
    ],
    enabled:
      options.enabled !== false &&
      !!hzSdk &&
      !!userAddress &&
      !!insts.length,
    staleTime: 10_000,
    queryFn: async () => {
      try {
        const data = await hzSdk!.claim.getClaimableFundingData(insts);
        return Object.entries(data)
          .map(([marketAddress, v]) => {
            return {
              marketAddress,
              longTokenAddress: v.longTokenAddress,
              shortTokenAddress: v.shortTokenAddress,
              claimableFundingAmountLong:
                v.claimableFundingAmountLong.toString(),
              claimableFundingAmountShort:
                v.claimableFundingAmountShort.toString(),
            };
          })
          .filter(
            (v) =>
              (v.claimableFundingAmountLong &&
                v.claimableFundingAmountLong !== '0') ||
              (v.claimableFundingAmountShort &&
                v.claimableFundingAmountShort !== '0'),
          );
      } catch (error) {
        toast.error((error as Error).message, {
          id: 'rest-claimableCollaterals',
        });
        throw error;
      }
    },
  });
};

// get claimable price impact rebates and claimed usd
export const useClaimStats = (
  optimistic?: {
    claimedPriceImpactKeys: Set<string>;
    optimisticTotalClaimedUsd: string | null;
  },
  options: {
    enabled?: boolean;
    refetchInterval?: number | false;
  } = {},
) => {
  const hzSdk = useHzSdk();
  const userAddress = useCurrentAccountAddress();
  const { data: positionsConstants } = usePositionConstants();
  const canFetchClaimStats =
    options.enabled !== false &&
    !!hzSdk &&
    !!userAddress &&
    !!positionsConstants;

  const { data: rawData, ...rest } = useQuery({
    queryKey: claimableFundingFeesQueryKey(hzSdk?.chainId, userAddress),
    enabled: canFetchClaimStats,
    refetchInterval: options.refetchInterval ?? false,
    staleTime: 10_000,
    queryFn: async () => {
      if (!hzSdk || !userAddress || !positionsConstants) {
        return;
      }

      try {
        const claims = await fetchStatsClaims(userAddress);
        return normalizeClaimStats(claims, positionsConstants);
      } catch (error) {
        toast.error((error as Error).message, {
          id: 'rest-claimableCollaterals',
        });
        throw error;
      }
    },
  });

  const data =
    rawData && optimistic
      ? {
          ...rawData,
          claimablePriceImpact: rawData.claimablePriceImpact.filter(
            (v) =>
              !optimistic.claimedPriceImpactKeys.has(
                `${v.market_address}-${v.token_address}-${v.time_key}`,
              ),
          ),
          totalClaimedUsd:
            optimistic.optimisticTotalClaimedUsd &&
            calc(optimistic.optimisticTotalClaimedUsd).gt(
              rawData.totalClaimedUsd,
            )
              ? optimistic.optimisticTotalClaimedUsd
              : rawData.totalClaimedUsd,
        }
      : rawData;

  const rawPriceImpactKeys = useMemo(
    () =>
      rawData
        ? rawData.claimablePriceImpact.map(
            (v) => `${v.market_address}-${v.token_address}-${v.time_key}`,
          )
        : undefined,
    [rawData],
  );

  return {
    data,
    rawTotalClaimedUsd: rawData?.totalClaimedUsd,
    rawPriceImpactKeys,
    ...rest,
  };
};

// get claim history
export const useClaimHistory = () => {
  const hzSdk = useHzSdk();
  const userAddress = useCurrentAccountAddress();
  const queryKey = useMemo(
    () => ['rest', 'useClaimHistory ', hzSdk?.chainId, userAddress],
    [hzSdk?.chainId, userAddress],
  );

  const result = useInfiniteQuery({
    queryKey,
    enabled: !!hzSdk && !!userAddress,
    queryFn: async ({ pageParam }) => {
      try {
        const data = await fetchStatsClaimHistory({
          user_address: userAddress! as Address,
          flat: false,
          limit: PAGE_LIMIT,
          cursor: pageParam,
        });
        return data as ClaimHistoryPageDataType;
      } catch (error) {
        toast.error((error as Error).message, {
          id: 'rest-useClaimHistory',
        });
        throw error;
      }
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => {
      return lastPage.next_cursor;
    },
    refetchInterval: 5_000,
    staleTime: 5_000,
  });
  const refetch = result.refetch;

  const refetchFirstPage = useCallback(() => {
    queryClient.setQueryData<InfiniteData<ClaimHistoryPageDataType>>(
      queryKey,
      (data) => {
        if (!data || data.pages.length <= 1) return data;
        return {
          pages: data.pages.slice(0, 1),
          pageParams: data.pageParams.slice(0, 1),
        };
      },
    );
    return refetch();
  }, [queryKey, refetch]);

  return { query: result, refetchFirstPage };
};
