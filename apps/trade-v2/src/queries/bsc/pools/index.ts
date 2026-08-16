import { useCallback, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { getAddress, type Address } from 'viem';
import { useInfiniteQuery, useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { useInstStore } from '@/common';
import {
  useConnectionStatus,
  useCurrentAccountAddress,
  useHzSdk,
} from '@/common/chainClient/hooks';
import {
  DYNAMIC_DATA_CACHE_TIME,
  STATIC_CONFIG_CACHE_TIME,
} from '@/common/constants/timeConstants';
import {
  useMarketsConfigs,
  useMarketsValues,
} from '@/common/services/rest/market';
import { usePriceStore } from '@/common/stores/priceStore';
import { toLowerAddressParam } from '@/lib/address';
import {
  APY_PERIOD,
  CATEGORY,
  CHART_TYPE,
  DEFAULT_POOLS_LIST_PAGE_SIZE,
  fetchPoolApyData,
  fetchPoolChartData,
  fetchPoolDetailData,
  fetchPoolHistoryData,
  fetchPoolsOverview,
  fetchPoolsList,
  getHistoryNextPageParam,
} from '@/services/rest/pools';
import type {
  HistoryAction,
  PoolsListSortBy,
  PoolsListSortOrder,
} from '@/services/rest/pools';
import type {
  Market,
  MarketConfig,
  MarketInfo,
  MarketValues,
} from '@hertzflow/sdk-v2/types/markets';
import type { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';

type PoolDetailResponse = Awaited<ReturnType<typeof fetchPoolDetailData>>;
type PoolsListData = Awaited<ReturnType<typeof fetchPoolsList>>;
type PoolsOverviewData = Awaited<ReturnType<typeof fetchPoolsOverview>>;

type PoolDetailQueryItem = Partial<PoolDetailResponse['pool']> &
  Pick<PoolDetailResponse['pool'], 'market_address'>;

export type PoolDetailQueryData = {
  pool: PoolDetailQueryItem;
};

export const usePoolsList = ({
  category,
  period,
  sortBy,
  sortOrder,
  search,
  inWallet = false,
  isView = true,
  favorites,
  page = 1,
  pageSize = DEFAULT_POOLS_LIST_PAGE_SIZE,
  enabled = true,
  refetchInterval = STATIC_CONFIG_CACHE_TIME,
  refetchOnWindowFocus = false,
  refetchOnMount,
  initialData,
}: {
  category: CATEGORY;
  period?: APY_PERIOD | string;
  sortBy?: PoolsListSortBy;
  sortOrder?: PoolsListSortOrder;
  search?: string;
  inWallet?: boolean;
  isView?: boolean;
  favorites?: string[];
  page?: number;
  pageSize?: number;
  enabled?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | 'always';
  initialData?: PoolsListData;
}) => {
  const connectionStatus = useConnectionStatus();
  const walletAddress = useCurrentAccountAddress() || undefined;
  const walletAddressParam =
    connectionStatus === 'connected'
      ? toLowerAddressParam(walletAddress)
      : undefined;
  const favoritesKey = favorites
    ?.map((address) => address.toLowerCase())
    .join(',');
  const hasRequiredWallet = !inWallet || !!walletAddressParam;
  return useQuery({
    queryKey: [
      'usePoolsList',
      category,
      walletAddressParam,
      period,
      sortBy,
      sortOrder,
      search,
      inWallet,
      isView,
      favoritesKey,
      page,
      pageSize,
    ],
    enabled: enabled && hasRequiredWallet,
    initialData: walletAddressParam || !initialData ? undefined : initialData,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      return fetchPoolsList({
        category,
        period,
        sort_by: sortBy,
        sort_order: sortOrder,
        search,
        in_wallet: inWallet,
        is_view: isView,
        favorites,
        page,
        page_size: pageSize,
        wallet_address: walletAddressParam,
      });
    },
    refetchInterval,
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchOnWindowFocus,
    refetchOnMount,
  });
};

export const usePoolsOverview = ({
  enabled = true,
  refetchInterval = STATIC_CONFIG_CACHE_TIME,
  refetchOnWindowFocus = false,
  initialData,
}: {
  enabled?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  initialData?: PoolsOverviewData;
} = {}) => {
  const connectionStatus = useConnectionStatus();
  const walletAddress = useCurrentAccountAddress() || undefined;
  const walletAddressParam =
    connectionStatus === 'connected'
      ? toLowerAddressParam(walletAddress)
      : undefined;

  return useQuery({
    queryKey: ['usePoolsOverview', walletAddressParam],
    enabled,
    initialData: walletAddressParam || !initialData ? undefined : initialData,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      return fetchPoolsOverview({
        wallet_address: walletAddressParam,
      });
    },
    refetchInterval,
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchOnWindowFocus,
  });
};

export const usePoolDetail = (
  marketAddress: string,
  options?: {
    staleTime?: number;
    refetchInterval?: number | false;
    initialData?: PoolDetailQueryData;
    showErrorToast?: boolean;
  },
) => {
  const { t } = useLingui();
  const wallet_address = useCurrentAccountAddress() || undefined;
  const walletAddressParam = toLowerAddressParam(wallet_address);
  const marketAddressParam = toLowerAddressParam(marketAddress) ?? '';
  const staleTime = options?.staleTime ?? STATIC_CONFIG_CACHE_TIME;
  const refetchInterval = options?.refetchInterval ?? STATIC_CONFIG_CACHE_TIME;
  const query = useQuery<PoolDetailQueryData>({
    queryKey: ['usePoolDetail', marketAddressParam, walletAddressParam],
    enabled: !!marketAddress,
    initialData: wallet_address ? undefined : options?.initialData,
    queryFn: async () => {
      try {
        const data = await fetchPoolDetailData({
          market_address: marketAddress,
          wallet_address,
        });
        return data;
      } catch (error) {
        if (options?.showErrorToast) {
          toast.error(t`Failed to load pool details. Please try again.`, {
            id: `pool-detail-error-${marketAddress}`,
          });
        }
        throw error;
      }
    },
    placeholderData: (prev) => prev,
    staleTime,
    refetchInterval,
    refetchOnWindowFocus: false,
  });

  return query;
};

export const usePoolApyData = ({
  marketAddress,
  period,
  enabled = true,
  refetchInterval = STATIC_CONFIG_CACHE_TIME,
  initialData,
}: {
  marketAddress: string;
  period: APY_PERIOD;
  enabled?: boolean;
  refetchInterval?: number | false;
  initialData?: Awaited<ReturnType<typeof fetchPoolApyData>>;
}) => {
  return useQuery({
    queryKey: ['bsc-data-query', 'pool-apy', marketAddress.toLowerCase(), period],
    enabled: !!marketAddress && enabled,
    initialData,
    queryFn: async () => {
      const data = await fetchPoolApyData({
        market_address: marketAddress,
        period,
      });
      return data;
    },
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};

export const usePoolChartData = ({
  marketAddress,
  chartType,
  period,
  enabled = true,
  refetchInterval = STATIC_CONFIG_CACHE_TIME,
  initialData,
}: {
  marketAddress: string;
  chartType: CHART_TYPE;
  period: APY_PERIOD;
  enabled?: boolean;
  refetchInterval?: number | false;
  initialData?: Awaited<ReturnType<typeof fetchPoolChartData>>;
}) => {
  return useQuery({
    queryKey: [
      'bsc-data-query',
      'pool-chart',
      marketAddress.toLowerCase(),
      chartType,
      period,
    ],
    enabled: !!marketAddress && enabled,
    initialData,
    queryFn: async () => {
      const data = await fetchPoolChartData({
        market_address: marketAddress,
        chart_type: chartType,
        period,
      });
      return data;
    },
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};

export const usePoolHistoryData = ({
  marketAddress,
  limit,
  walletAddress,
  action,
  enabled = true,
  refetchInterval = DYNAMIC_DATA_CACHE_TIME,
}: {
  marketAddress: string;
  limit?: number;
  walletAddress?: string;
  action?: HistoryAction;
  enabled?: boolean;
  refetchInterval?: number | false;
}) => {
  const walletAddressParam = toLowerAddressParam(walletAddress);
  const marketAddressParam = toLowerAddressParam(marketAddress) ?? '';
  return useInfiniteQuery({
    queryKey: [
      'bsc-data-query',
      'pool-history',
      marketAddressParam,
      limit,
      walletAddressParam,
      action,
    ],
    enabled: !!marketAddress && enabled,
    queryFn: async ({ pageParam }) => {
      const data = await fetchPoolHistoryData({
        market_address: marketAddress,
        cursor: pageParam,
        limit,
        wallet_address: walletAddressParam,
        action,
      });
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getHistoryNextPageParam,
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};

export type MarketInfoWithPrices = MarketInfo & {
  shortTokenPrice: TokenPrices | null;
  longTokenPrice: TokenPrices | null;
};

const hasCompleteMarketData = <T>(
  data: Record<string, T> | undefined,
  markets: Market[],
) => {
  if (!data || markets.length === 0) return false;
  const dataAddresses = new Set(
    Object.keys(data).map((address) => address.toLowerCase()),
  );
  return markets.every((market) =>
    dataAddresses.has(market.marketTokenAddress.toLowerCase()),
  );
};

export const useMarketsInfoByAddresses = (
  marketAddresses: string[] | undefined,
  options?: {
    refreshInterval?: number | false;
    enabled?: boolean;
  },
) => {
  const hzSdk = useHzSdk();
  const chainId = hzSdk?.chainId;
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const allInsts = useInstStore((state) => state.getInstsArr());
  const coins = useInstStore((state) => state.getCoins());
  const refreshInterval = options?.refreshInterval ?? DYNAMIC_DATA_CACHE_TIME;

  const normalizedAddresses = useMemo(() => {
    if (!marketAddresses?.length) return [];
    const set = new Set<Address>();
    for (const raw of marketAddresses) {
      if (!raw) continue;
      try {
        set.add(getAddress(raw) as Address);
      } catch {
        set.add(raw as Address);
      }
    }
    return Array.from(set);
  }, [marketAddresses]);

  const sortedAddresses = useMemo(() => {
    if (!normalizedAddresses.length) return [];
    return normalizedAddresses.slice().sort();
  }, [normalizedAddresses]);

  const insts = useMemo(() => {
    if (!sortedAddresses.length) return [];
    const allInstsMap = new Map(
      allInsts.map((inst) => [inst.marketTokenAddress.toLowerCase(), inst]),
    );
    const list: Market[] = [];
    for (const addr of sortedAddresses) {
      const inst = allInstsMap.get(addr.toLowerCase());
      if (inst) list.push(inst);
    }
    return list;
  }, [allInsts, sortedAddresses]);

  const hasPrices = Object.keys(pricesMap).length > 0;
  const hasCoins = Object.keys(coins).length > 0;
  const enabled = options?.enabled ?? true;
  const hasCompleteInsts =
    sortedAddresses.length > 0 && insts.length === sortedAddresses.length;
  const shouldQuery =
    enabled &&
    !!hzSdk &&
    !!chainId &&
    hasCompleteInsts &&
    hasPrices &&
    hasCoins;
  const configsQuery = useMarketsConfigs({
    additionalMarketInsts: insts,
    scopeToAdditionalMarketInsts: true,
    markets: insts,
    enabled: shouldQuery,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    refreshPriority: 'active',
  });
  const valuesQuery = useMarketsValues(refreshInterval, {
    additionalMarketInsts: insts,
    scopeToAdditionalMarketInsts: true,
    markets: insts,
    enabled: shouldQuery,
    refreshPriority: 'active',
  });

  const hasCompleteConfigs =
    hasCompleteInsts && hasCompleteMarketData(configsQuery.data, insts);
  const hasCompleteValues =
    hasCompleteInsts && hasCompleteMarketData(valuesQuery.data, insts);
  const buildMarketsInfoData = useCallback(
    (
      marketsConfigs: Record<string, MarketConfig>,
      marketsValues: Record<string, MarketValues>,
    ) => {
      if (!hzSdk) return undefined;
      const { marketsInfoData } = hzSdk.markets.mergeMarketsInfo({
        markets: insts,
        tokensData: coins,
        marketsConfigs,
        marketsValues,
      });
      const result: Record<Address, MarketInfoWithPrices> = {};
      for (const [address, info] of Object.entries(marketsInfoData ?? {})) {
        const checksumAddress = getAddress(address) as Address;
        result[checksumAddress] = {
          ...info,
          shortTokenPrice:
            (pricesMap[info.shortTokenAddress] as TokenPrices) ?? null,
          longTokenPrice:
            (pricesMap[info.longTokenAddress] as TokenPrices) ?? null,
        };
      }
      return hasCompleteMarketData(result, insts) ? result : undefined;
    },
    [coins, hzSdk, insts, pricesMap],
  );
  const data = useMemo<
    Record<Address, MarketInfoWithPrices> | undefined
  >(() => {
    if (
      !hasCompleteConfigs ||
      !hasCompleteValues ||
      !configsQuery.data ||
      !valuesQuery.data
    ) {
      return undefined;
    }
    return buildMarketsInfoData(configsQuery.data, valuesQuery.data);
  }, [
    buildMarketsInfoData,
    configsQuery.data,
    hasCompleteConfigs,
    hasCompleteValues,
    valuesQuery.data,
  ]);
  const refetchConfigs = configsQuery.refetch;
  const refetchValues = valuesQuery.refetch;
  const refetch = useCallback(async () => {
    let refreshedConfigs = configsQuery.data;
    if (!hasCompleteConfigs) {
      const configsResult = await refetchConfigs();
      refreshedConfigs = configsResult.data;
      if (!hasCompleteMarketData(refreshedConfigs, insts)) {
        return {
          isError: true,
          error:
            configsResult.error ??
            new Error('Incomplete scoped market configs response'),
        };
      }
    }

    const valuesResult = await refetchValues();
    const refreshedData =
      refreshedConfigs && valuesResult.data
        ? buildMarketsInfoData(refreshedConfigs, valuesResult.data)
        : undefined;
    if (!refreshedData) {
      return {
        isError: true,
        error:
          valuesResult.error ??
          new Error('Incomplete scoped market values response'),
      };
    }

    return { data: refreshedData, isError: false, error: null };
  }, [
    buildMarketsInfoData,
    configsQuery.data,
    hasCompleteConfigs,
    insts,
    refetchConfigs,
    refetchValues,
  ]);
  const configsIsError = configsQuery.isError && !hasCompleteConfigs;
  const valuesIsError = valuesQuery.isError && !hasCompleteValues;
  const isError = configsIsError || valuesIsError;
  const isLoading =
    shouldQuery &&
    !data &&
    !isError &&
    (configsQuery.isLoading ||
      valuesQuery.isLoading ||
      !hasCompleteConfigs ||
      !hasCompleteValues);

  return {
    data,
    dataUpdatedAt: Math.max(
      configsQuery.dataUpdatedAt ?? 0,
      valuesQuery.dataUpdatedAt ?? 0,
    ),
    isLoading,
    isFetching: configsQuery.isFetching || valuesQuery.isFetching,
    isError,
    error: configsIsError
      ? configsQuery.error
      : valuesIsError
        ? valuesQuery.error
        : null,
    refetch,
  };
};

export const useMarketInfoByAddress = (
  marketAddress: string,
  options?: {
    refreshInterval?: number | false;
    enabled?: boolean;
  },
) => {
  const checksumAddress = useMemo(() => {
    if (!marketAddress) return undefined;
    try {
      return getAddress(marketAddress) as Address;
    } catch {
      return marketAddress as Address;
    }
  }, [marketAddress]);
  const marketAddresses = useMemo(
    () => (checksumAddress ? [checksumAddress] : []),
    [checksumAddress],
  );

  const query = useMarketsInfoByAddresses(marketAddresses, options);

  const marketInfo = useMemo(() => {
    if (!checksumAddress) return null;
    const data = query.data ?? undefined;
    if (!data) return null;
    return (
      data[checksumAddress] ??
      (data as Record<string, MarketInfoWithPrices>)[marketAddress] ??
      null
    );
  }, [checksumAddress, marketAddress, query.data]);

  return {
    data: marketInfo,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
