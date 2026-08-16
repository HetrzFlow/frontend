import { useMemo } from 'react';
import { getAddress, type Address } from 'viem';
import { useInstStore } from '@/common/stores/instStore';
import { usePoolsList, usePoolsOverview } from '@/queries/bsc/pools';
import {
  APY_PERIOD,
  CATEGORY,
  DEFAULT_POOLS_LIST_PAGE_SIZE,
  type PoolsListSortBy,
  type PoolsListSortOrder,
  type fetchPoolsOverview,
  type fetchPoolsList,
} from '@/services/rest/pools';
import type { PoolsListItem } from '@/stores/synthetics/marketTokens/selectors';
import { getByAddress, parseRawValue } from './shared';

function toAddress(address: string | undefined): Address | undefined {
  if (!address) return undefined;
  try {
    return getAddress(address) as Address;
  } catch {
    return address as Address;
  }
}

type PoolsListInitialData = Awaited<ReturnType<typeof fetchPoolsList>>;
type PoolsOverviewInitialData = Awaited<ReturnType<typeof fetchPoolsOverview>>;

type PoolsListRowsParams = {
  initialData?: PoolsListInitialData;
  category?: CATEGORY;
  period?: APY_PERIOD | string;
  sortBy?: PoolsListSortBy;
  sortOrder?: PoolsListSortOrder;
  search?: string;
  inWallet?: boolean;
  favorites?: string[];
  page?: number;
  pageSize?: number;
  enabled?: boolean;
};

function usePoolsListDerivedData({
  initialData,
  category = CATEGORY.all,
  period,
  sortBy,
  sortOrder,
  search,
  inWallet,
  favorites,
  page = 1,
  pageSize = DEFAULT_POOLS_LIST_PAGE_SIZE,
  enabled = true,
}: PoolsListRowsParams = {}) {
  const poolsListQuery = usePoolsList({
    category,
    period,
    sortBy,
    sortOrder,
    search,
    inWallet,
    favorites,
    page,
    pageSize,
    enabled,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    isView: true,
    initialData,
  });

  return useMemo(() => {
    return {
      poolsListData: poolsListQuery.data,
      isLoading: poolsListQuery.isPending || poolsListQuery.isLoading,
      isError: poolsListQuery.isError,
    };
  }, [
    poolsListQuery.data,
    poolsListQuery.isError,
    poolsListQuery.isLoading,
    poolsListQuery.isPending,
  ]);
}

export function useOverviewYourDepositsUsd({
  refetchInterval = false,
}: {
  refetchInterval?: number | false;
} = {}): bigint | undefined {
  const { data } = usePoolsOverview({
    refetchInterval,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => parseRawValue(data?.your_deposits), [data?.your_deposits]);
}

export function usePoolsOverviewFields(initialData?: PoolsOverviewInitialData): {
  totalTvl: bigint | undefined;
  totalEarnedFees: bigint | undefined;
  yourDeposits: bigint | undefined;
  yourEarnedFees: bigint | undefined;
} {
  const { data } = usePoolsOverview({
    initialData,
    refetchOnWindowFocus: false,
  });

  const totalTvl = useMemo(() => parseRawValue(data?.total_tvl), [data?.total_tvl]);
  const totalEarnedFees = useMemo(
    () => parseRawValue(data?.total_earned_fees_usd),
    [data?.total_earned_fees_usd],
  );
  const yourDeposits = useMemo(
    () => parseRawValue(data?.your_deposits),
    [data?.your_deposits],
  );
  const yourEarnedFees = useMemo(
    () => parseRawValue(data?.your_earnings),
    [data?.your_earnings],
  );

  return { totalTvl, totalEarnedFees, yourDeposits, yourEarnedFees };
}

export function usePoolsListRows(params: PoolsListRowsParams = {}): {
  data: PoolsListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
} {
  const instsMap = useInstStore((state) => state.getInsts());
  const {
    poolsListData,
    isLoading: isPoolsListLoading,
    isError: isPoolsListError,
  } = usePoolsListDerivedData(params);

  const rows = useMemo((): PoolsListItem[] => {
    if (!poolsListData?.pools?.length) return [];

    return poolsListData.pools.map((pool) => {
      const marketAddress = toAddress(pool.market_address);
      const inst = marketAddress
        ? getByAddress(instsMap, marketAddress)
        : undefined;

      return {
        category: pool.category,
        displayName: pool.display_name,
        symbol: pool.symbol,
        inst,
        isDisabled: pool.is_disabled,
        isClosed: inst?.is_closed,
        marketAddress,
        indexTokenAddress:
          toAddress(pool.index_token_address) ??
          (inst?.indexTokenAddress as Address | undefined),
        longTokenAddress:
          toAddress(pool.long_token_address) ??
          (inst?.longTokenAddress as Address | undefined),
        shortTokenAddress:
          toAddress(pool.short_token_address) ??
          (inst?.shortTokenAddress as Address | undefined),
        tvl: parseRawValue(pool.tvl_usd),
        supply: parseRawValue(pool.lp_supply),
        feeApy: pool.fee_apy,
        aprHistory: pool.fee_apr_history,
      };
    });
  }, [instsMap, poolsListData?.pools]);

  return {
    data: rows,
    totalCount: poolsListData?.total_count ?? rows.length,
    page: poolsListData?.page ?? params.page ?? 1,
    pageSize:
      poolsListData?.page_size ??
      params.pageSize ??
      DEFAULT_POOLS_LIST_PAGE_SIZE,
    isLoading: isPoolsListLoading || isPoolsListError,
  };
}
