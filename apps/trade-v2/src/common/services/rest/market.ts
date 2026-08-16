import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import {
  DYNAMIC_DATA_CACHE_TIME,
  STATIC_CONFIG_CACHE_TIME,
} from '@/common/constants/timeConstants';
import { usePriceStore } from '@/common/stores';
import { useHzSdk } from '../../chainClient/hooks';
import { useInstStore } from '../../stores/instStore';
import {
  areMarketsConfigsDemandsCovered,
  getActiveMarketsConfigsDemand,
  getMarketsConfigsDemandVersion,
  markMarketsConfigsDemandVersionCompleted,
  removeMarketsConfigsDemand,
  scheduleMarketsConfigsDemandRefetch,
  selectMarketsConfigsRequestInsts,
  setMarketsConfigsDemand,
  shouldAttemptFullMarketsRefresh,
  shouldRefreshAllMarketsConfigs,
  type MarketsConfigsRefreshPriority,
} from './marketQueryUtils';

import type {
  Market,
  MarketConfig,
  MarketValues,
} from '@hertzflow/sdk-v2/types/markets';

export const MARKET_CHUNK_SIZE = 15; // market size per request chunk
export const MARKETS_CONFIGS_BACKGROUND_REFRESH_INTERVAL = 5 * 60_000;
export const MARKETS_VALUES_BACKGROUND_REFRESH_INTERVAL = 60_000;
type MarketWithViewFlag = Market & { is_view?: boolean; isView?: boolean };
type MarketDependency = Pick<Market, 'marketTokenAddress'>;
const EMPTY_MARKET_INSTS: Market[] = [];

export type CoinDetailItem = {
  coin_name: string;
  coin_type: string;
  coin_amount: number;
  current_weight: number;
  target_weight: number;
  utilization: number;
  apr: {
    '1m': string;
    '24h': string;
    '7d': string;
  };
};
export type PoolDetailResData = {
  total_liquidity: string;
  limit: string;
  coin_details: CoinDetailItem[];
};

export interface PositionLiqPoolDataRes {
  error?: string;
  data?: {
    tokens?: {
      availableLongPosition: string;
      availableShortPosition: string;
      coinDecimals: number;
      coinName: string;
      coinType: string;
      longPositionInterest: string;
      shortPositionInterest: string;
    }[];
  };
}

type MarketQueryOptions = {
  enabled?: boolean;
  additionalMarketInsts?: Market[];
  scopeToAdditionalMarketInsts?: boolean;
  marketAddress?: string;
  markets?: Array<MarketDependency | undefined>;
  refreshPriority?: MarketsConfigsRefreshPriority;
  pollPriority?: number;
  priorityMarketAddress?: string;
  refetchInterval?: number | false;
};

const isViewMarketInst = (inst: MarketWithViewFlag) =>
  inst.is_view !== false && inst.isView !== false;

const mergeMarketInsts = <T extends MarketWithViewFlag>(
  insts: T[],
  additionalMarketInsts: T[] = [],
) => {
  const seen = new Set<string>();

  return [...insts, ...additionalMarketInsts].filter((inst) => {
    if (!isViewMarketInst(inst)) return false;

    const key = inst.marketTokenAddress.toLowerCase();
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const resolveMarketInsts = ({
  allInsts,
  viewInsts,
  marketAddress,
  additionalMarketInsts,
  scopeToAdditionalMarketInsts,
}: {
  allInsts: Market[];
  viewInsts: Market[];
  marketAddress?: string;
  additionalMarketInsts?: Market[];
  scopeToAdditionalMarketInsts?: boolean;
}) => {
  if (marketAddress) {
    const normalizedMarketAddress = marketAddress.toLowerCase();
    const market = allInsts.find(
      (inst) =>
        inst.marketTokenAddress.toLowerCase() === normalizedMarketAddress,
    );
    return market ? [market] : [];
  }

  return scopeToAdditionalMarketInsts
    ? (additionalMarketInsts ?? [])
    : mergeMarketInsts(viewInsts, additionalMarketInsts);
};

const getMarketDataByAddress = <T>(
  data: Record<string, T>,
  marketAddress: string,
) => {
  const directMatch = data[marketAddress];
  if (directMatch !== undefined) return directMatch;

  const normalizedAddress = marketAddress.toLowerCase();
  const matchedAddress = Object.keys(data).find(
    (address) => address.toLowerCase() === normalizedAddress,
  );
  return matchedAddress ? data[matchedAddress] : undefined;
};

export const useMarketsInfos = (
  refetchInterval: number | false = DYNAMIC_DATA_CACHE_TIME,
  options?: MarketQueryOptions,
) => {
  const hzSdk = useHzSdk();
  const viewInsts = useInstStore((state) => state.getViewInstsArr());
  const allInsts = useInstStore((state) =>
    options?.marketAddress ? state.getInstsArr() : EMPTY_MARKET_INSTS,
  );
  const marketAddress = options?.marketAddress;
  const additionalMarketInsts = options?.additionalMarketInsts;
  const scopeToAdditionalMarketInsts =
    options?.scopeToAdditionalMarketInsts;
  const insts = useMemo(
    () =>
      resolveMarketInsts({
        allInsts,
        viewInsts,
        marketAddress,
        additionalMarketInsts,
        scopeToAdditionalMarketInsts,
      }),
    [
      allInsts,
      additionalMarketInsts,
      marketAddress,
      scopeToAdditionalMarketInsts,
      viewInsts,
    ],
  );
  const coins = useInstStore((state) => state.getCoins());
  const {
    data: marketsConfigs,
    isLoading: marketsConfigsIsLoading,
    isFetching: marketsConfigsIsFetching,
    isError: marketsConfigsIsError,
    dataUpdatedAt: marketsConfigsUpdatedAt,
  } = useMarketsConfigs(options);
  const {
    data: marketsValues,
    isLoading: marketsValuesIsLoading,
    isFetching: marketsValuesIsFetching,
    isError: marketsValuesIsError,
    dataUpdatedAt: marketsValuesUpdatedAt,
  } = useMarketsValues(refetchInterval, options);
  const mergedData = useMemo(() => {
    if (!hzSdk || !insts.length || !Object.keys(coins).length) return undefined;
    if (!marketsConfigs || !marketsValues) return undefined;
    return hzSdk.markets.mergeMarketsInfo({
      markets: insts,
      tokensData: coins,
      marketsConfigs,
      marketsValues,
    }).marketsInfoData;
  }, [coins, hzSdk, insts, marketsConfigs, marketsValues]);

  return {
    data: mergedData,
    isLoading: marketsConfigsIsLoading || marketsValuesIsLoading,
    isFetching: marketsConfigsIsFetching || marketsValuesIsFetching,
    isError: marketsConfigsIsError || marketsValuesIsError,
    dataUpdatedAt: Math.max(
      marketsConfigsUpdatedAt ?? 0,
      marketsValuesUpdatedAt ?? 0,
    ),
  };
};

export const buildPrioritizedMarketChunks = <
  T extends Pick<Market, 'marketTokenAddress'>,
>(
  insts: T[],
  chunkSize: number,
  priorityMarketAddress?: string,
) => {
  const chunks: T[][] = [];

  for (let i = 0; i < insts.length; i += chunkSize) {
    chunks.push(insts.slice(i, i + chunkSize));
  }

  if (!priorityMarketAddress) {
    return chunks;
  }

  const priorityChunkIndex = chunks.findIndex((chunk) =>
    chunk.some((inst) => inst.marketTokenAddress === priorityMarketAddress),
  );

  if (priorityChunkIndex <= 0) {
    return chunks;
  }

  const [priorityChunk] = chunks.splice(priorityChunkIndex, 1);
  chunks.unshift(priorityChunk!);

  return chunks;
};

const useMarketsValuesQuery = <TData>(
  refetchInterval: number | false = DYNAMIC_DATA_CACHE_TIME,
  options: MarketQueryOptions | undefined,
  select: (data: Record<string, MarketValues>) => TData,
) => {
  const hzSdk = useHzSdk();
  const chainId = hzSdk?.chainId;
  const viewInsts = useInstStore((state) => state.getViewInstsArr());
  const allInsts = useInstStore((state) =>
    options?.marketAddress ? state.getInstsArr() : EMPTY_MARKET_INSTS,
  );
  const coins = useInstStore((state) => state.getCoins());
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const marketAddress = options?.marketAddress;
  const additionalMarketInsts = options?.additionalMarketInsts;
  const scopeToAdditionalMarketInsts =
    options?.scopeToAdditionalMarketInsts;
  const insts = useMemo(
    () =>
      resolveMarketInsts({
        allInsts,
        viewInsts,
        marketAddress,
        additionalMarketInsts,
        scopeToAdditionalMarketInsts,
      }),
    [
      allInsts,
      additionalMarketInsts,
      marketAddress,
      scopeToAdditionalMarketInsts,
      viewInsts,
    ],
  );

  const marketAddresses = useMemo(
    () =>
      insts
        .map((v) => v.marketTokenAddress)
        .sort()
        .join(','),
    [insts],
  );

  const hasPrices = Object.keys(pricesMap).length > 0;
  const hasCoins = Object.keys(coins).length > 0;
  const enabledOpt = options?.enabled ?? true;
  const hasChainId = !!chainId;
  const queryKey = ['rest', 'marketsValues', hzSdk?.chainId, marketAddresses];
  const demandScopeKey = `values:${hzSdk?.chainId ?? 'unknown'}:${marketAddresses}`;
  const lastFullSnapshotAttemptAtQueryKey = [
    ...queryKey,
    'lastFullSnapshotAttemptAt',
  ];
  const demandedMarketAddresses = (options?.markets ?? [])
    .filter((market): market is MarketDependency => !!market)
    .map((market) => market.marketTokenAddress.toLowerCase());
  const demandedMarketAddressesKey = demandedMarketAddresses.sort().join(',');
  const refreshPriority = options?.refreshPriority ?? 'active';
  const staleTime =
    typeof refetchInterval === 'number'
      ? refetchInterval
      : DYNAMIC_DATA_CACHE_TIME;

  const enabled =
    enabledOpt &&
    !!hzSdk &&
    hasChainId &&
    !!insts.length &&
    hasPrices &&
    hasCoins;

  const result = useQuery<Record<string, MarketValues>, Error, TData>({
    queryKey,
    enabled,
    retry: false,
    placeholderData: (prev) => prev,
    queryFn: async ({ signal, client }) => {
      if (!hasChainId) return {} as Record<string, MarketValues>;
      if (!insts.length) return {} as Record<string, MarketValues>;

      const lastFullSnapshotAttemptAt =
        client.getQueryData<number>(lastFullSnapshotAttemptAtQueryKey) ?? 0;
      const refreshAllMarkets = shouldAttemptFullMarketsRefresh({
        lastFullSnapshotAttemptAt,
        now: Date.now(),
        backgroundRefreshInterval: MARKETS_VALUES_BACKGROUND_REFRESH_INTERVAL,
      });
      const demandVersionAtStart =
        getMarketsConfigsDemandVersion(demandScopeKey);
      const activeDemandsAtStart =
        getActiveMarketsConfigsDemand(demandScopeKey);
      if (refreshPriority === 'active') {
        demandedMarketAddresses.forEach((address) =>
          activeDemandsAtStart.add(address),
        );
      }
      const requestMarketInsts = selectMarketsConfigsRequestInsts(
        insts,
        activeDemandsAtStart,
        refreshAllMarkets,
      );
      const isFullMarketRequest = requestMarketInsts.length === insts.length;

      if (!requestMarketInsts.length) {
        markMarketsConfigsDemandVersionCompleted(
          demandScopeKey,
          demandVersionAtStart,
        );
        return (
          client.getQueryData<Record<string, MarketValues>>(queryKey) ?? {}
        );
      }

      const chunks = buildPrioritizedMarketChunks(
        requestMarketInsts,
        MARKET_CHUNK_SIZE,
        options?.priorityMarketAddress,
      );

      const merged: Record<string, MarketValues> = {};
      const successfulMarketAddresses = new Set<string>();
      let successfulChunks = 0;

      for (let i = 0; i < chunks.length; i++) {
        if (signal?.aborted) break;

        try {
          const res = await hzSdk.markets.getMarketsValues({
            markets: chunks[i]!,
            prices: pricesMap,
            tokensData: coins,
          });
          Object.assign(merged, res);
          successfulChunks += 1;
          Object.keys(res).forEach((address) => {
            successfulMarketAddresses.add(address.toLowerCase());
          });

          // write partial result to cache immediately
          client.setQueryData(
            queryKey,
            (prev: Record<string, MarketValues>) => ({
              ...(prev ?? {}),
              ...merged,
            }),
          );
        } catch (err) {
          console.error('[useMarketsValues] batch failed', {
            error: err,
            message: err instanceof Error ? err.message : String(err),
            chainId: hzSdk.chainId,
            marketAddresses,
            chunkIndex: i,
          });
          toast.error((err as Error)?.message ?? 'marketsValues batch failed', {
            id: `rest-marketsValues`,
          });
        }
      }

      const availableMarketAddresses = new Set(
        insts.map((market) => market.marketTokenAddress.toLowerCase()),
      );
      if (
        refreshAllMarkets &&
        isFullMarketRequest &&
        successfulChunks === chunks.length
      ) {
        client.setQueryData(lastFullSnapshotAttemptAtQueryKey, Date.now());
      }

      const activeDemandsAtStartCovered = areMarketsConfigsDemandsCovered(
        activeDemandsAtStart,
        availableMarketAddresses,
        successfulMarketAddresses,
      );
      if (activeDemandsAtStartCovered) {
        markMarketsConfigsDemandVersionCompleted(
          demandScopeKey,
          demandVersionAtStart,
        );
      }

      const latestDemandVersion =
        getMarketsConfigsDemandVersion(demandScopeKey);
      if (
        latestDemandVersion > demandVersionAtStart &&
        areMarketsConfigsDemandsCovered(
          getActiveMarketsConfigsDemand(demandScopeKey),
          availableMarketAddresses,
          successfulMarketAddresses,
        )
      ) {
        markMarketsConfigsDemandVersionCompleted(
          demandScopeKey,
          latestDemandVersion,
        );
      }

      if (!activeDemandsAtStartCovered) {
        throw new Error(
          '[useMarketsValues] active market values request failed',
        );
      }

      if (Object.keys(merged).length === 0) {
        const cached =
          client.getQueryData<Record<string, MarketValues>>(queryKey);
        if (cached && Object.keys(cached).length > 0) {
          return cached;
        }
        throw new Error(
          '[useMarketsValues] all batches failed and no cache available',
        );
      }

      const cached =
        client.getQueryData<Record<string, MarketValues>>(queryKey) ?? {};
      return { ...cached, ...merged };
    },
    meta: { pollPriority: options?.pollPriority },
    refetchInterval,
    staleTime,
    select,
  });

  const demandSubscriber = useRef(Symbol('marketsValuesDemand'));
  const refetch = result.refetch;
  useEffect(() => {
    if (!enabled || !demandedMarketAddressesKey) return;

    const subscriber = demandSubscriber.current;
    setMarketsConfigsDemand(demandScopeKey, subscriber, {
      addresses: demandedMarketAddressesKey.split(','),
      priority: refreshPriority,
    });

    if (refreshPriority === 'active') {
      scheduleMarketsConfigsDemandRefetch(demandScopeKey, async () => {
        const refetchResult = await refetch({ cancelRefetch: false });
        return refetchResult.isSuccess;
      });
    }

    return () => {
      removeMarketsConfigsDemand(demandScopeKey, subscriber);
    };
  }, [
    demandScopeKey,
    demandedMarketAddressesKey,
    enabled,
    refetch,
    refreshPriority,
  ]);

  return result;
};

export const useMarketsValues = (
  refetchInterval: number | false = DYNAMIC_DATA_CACHE_TIME,
  options?: MarketQueryOptions,
) => useMarketsValuesQuery(refetchInterval, options, (data) => data);

export const useMarketValues = (
  market?: MarketDependency,
  refetchInterval: number | false = DYNAMIC_DATA_CACHE_TIME,
  options?: Omit<MarketQueryOptions, 'marketAddress' | 'markets'>,
) => {
  const marketAddress = market?.marketTokenAddress;
  return useMarketsValuesQuery(
    refetchInterval,
    {
      ...options,
      marketAddress,
      markets: market ? [market] : [],
    },
    (data) =>
      marketAddress ? getMarketDataByAddress(data, marketAddress) : undefined,
  );
};

const useMarketsConfigsQuery = <TData>(
  options: MarketQueryOptions | undefined,
  select: (data: Record<string, MarketConfig>) => TData,
) => {
  const hzSdk = useHzSdk();
  const chainId = hzSdk?.chainId;
  const viewInsts = useInstStore((state) => state.getViewInstsArr());
  const allInsts = useInstStore((state) =>
    options?.marketAddress ? state.getInstsArr() : EMPTY_MARKET_INSTS,
  );
  const marketAddress = options?.marketAddress;
  const additionalMarketInsts = options?.additionalMarketInsts;
  const scopeToAdditionalMarketInsts =
    options?.scopeToAdditionalMarketInsts;
  const marketInsts = useMemo(
    () =>
      resolveMarketInsts({
        allInsts,
        viewInsts,
        marketAddress,
        additionalMarketInsts,
        scopeToAdditionalMarketInsts,
      }),
    [
      allInsts,
      additionalMarketInsts,
      marketAddress,
      scopeToAdditionalMarketInsts,
      viewInsts,
    ],
  );
  const enabledOpt = options?.enabled ?? true;
  const refetchInterval = options?.refetchInterval ?? STATIC_CONFIG_CACHE_TIME;
  const hasChainId = !!chainId;
  const queryKey = [
    'rest',
    'marketsConfigs',
    hzSdk?.chainId,
    marketInsts.map((v) => v.marketTokenAddress).sort(),
  ];
  const marketAddressesKey = marketInsts
    .map((market) => market.marketTokenAddress.toLowerCase())
    .sort()
    .join(',');
  const demandScopeKey = `${hzSdk?.chainId ?? 'unknown'}:${marketAddressesKey}`;
  const fullSnapshotQueryKey = [...queryKey, 'fullSnapshotLoaded'];
  const lastFullSnapshotAtQueryKey = [...queryKey, 'lastFullSnapshotAt'];
  const demandedMarketAddresses = (options?.markets ?? [])
    .filter((market): market is MarketDependency => !!market)
    .map((market) => market.marketTokenAddress.toLowerCase());
  const demandedMarketAddressesKey = demandedMarketAddresses.sort().join(',');
  const refreshPriority = options?.refreshPriority ?? 'active';

  const enabled = enabledOpt && !!hzSdk && hasChainId && !!marketInsts.length;

  const result = useQuery<Record<string, MarketConfig>, Error, TData>({
    queryKey,
    enabled,
    retry: false,
    queryFn: async ({ signal, client }) => {
      if (!hasChainId) return {};
      if (!marketInsts.length) return {};

      const fullSnapshotLoaded =
        client.getQueryData<boolean>(fullSnapshotQueryKey) === true;
      const lastFullSnapshotAt =
        client.getQueryData<number>(lastFullSnapshotAtQueryKey) ?? 0;
      const refreshAllMarkets = shouldRefreshAllMarketsConfigs({
        fullSnapshotLoaded,
        lastFullSnapshotAt,
        now: Date.now(),
        backgroundRefreshInterval: MARKETS_CONFIGS_BACKGROUND_REFRESH_INTERVAL,
      });
      const demandVersionAtStart =
        getMarketsConfigsDemandVersion(demandScopeKey);
      const activeDemandsAtStart =
        getActiveMarketsConfigsDemand(demandScopeKey);
      if (refreshPriority === 'active') {
        demandedMarketAddresses.forEach((address) =>
          activeDemandsAtStart.add(address),
        );
      }
      const requestMarketInsts = selectMarketsConfigsRequestInsts(
        marketInsts,
        activeDemandsAtStart,
        refreshAllMarkets,
      );
      const isFullMarketRequest =
        requestMarketInsts.length === marketInsts.length;

      if (!requestMarketInsts.length) {
        markMarketsConfigsDemandVersionCompleted(
          demandScopeKey,
          demandVersionAtStart,
        );
        return (
          client.getQueryData<Record<string, MarketConfig>>(queryKey) ?? {}
        );
      }

      const chunks = buildPrioritizedMarketChunks(
        requestMarketInsts,
        MARKET_CHUNK_SIZE,
        options?.priorityMarketAddress,
      );

      const merged: Record<string, MarketConfig> = {};
      let successfulChunks = 0;
      const successfulMarketAddresses = new Set<string>();

      for (let i = 0; i < chunks.length; i++) {
        if (signal?.aborted) break;

        try {
          const res = await hzSdk.markets.getMarketsConfigs(chunks[i]!);
          Object.assign(merged, res);
          successfulChunks += 1;
          Object.keys(res).forEach((address) => {
            successfulMarketAddresses.add(address.toLowerCase());
          });

          // write partial result to cache immediately
          client.setQueryData(
            queryKey,
            (prev: Record<string, MarketConfig>) => ({
              ...(prev ?? {}),
              ...merged,
            }),
          );
        } catch (err) {
          console.error('[useMarketsConfigs] batch failed', {
            error: err,
            message: err instanceof Error ? err.message : String(err),
            chainId: hzSdk.chainId,
            instCount: marketInsts.length,
            chunkIndex: i,
          });
          toast.error(
            (err as Error)?.message ?? 'marketsConfigs batch failed',
            {
              id: `rest-marketsConfigs`,
            },
          );
        }
      }

      if (
        refreshAllMarkets &&
        isFullMarketRequest &&
        successfulChunks === chunks.length &&
        requestMarketInsts.every((market) =>
          successfulMarketAddresses.has(
            market.marketTokenAddress.toLowerCase(),
          ),
        )
      ) {
        client.setQueryData(fullSnapshotQueryKey, true);
        client.setQueryData(lastFullSnapshotAtQueryKey, Date.now());
      }

      const availableMarketAddresses = new Set(
        marketInsts.map((market) => market.marketTokenAddress.toLowerCase()),
      );
      const activeDemandsAtStartCovered = areMarketsConfigsDemandsCovered(
        activeDemandsAtStart,
        availableMarketAddresses,
        successfulMarketAddresses,
      );

      if (activeDemandsAtStartCovered) {
        markMarketsConfigsDemandVersionCompleted(
          demandScopeKey,
          demandVersionAtStart,
        );
      }

      const latestDemandVersion =
        getMarketsConfigsDemandVersion(demandScopeKey);
      if (
        latestDemandVersion > demandVersionAtStart &&
        areMarketsConfigsDemandsCovered(
          getActiveMarketsConfigsDemand(demandScopeKey),
          availableMarketAddresses,
          successfulMarketAddresses,
        )
      ) {
        markMarketsConfigsDemandVersionCompleted(
          demandScopeKey,
          latestDemandVersion,
        );
      }

      if (!activeDemandsAtStartCovered) {
        throw new Error(
          '[useMarketsConfigs] active market configs request failed',
        );
      }

      if (Object.keys(merged).length === 0) {
        const cached =
          client.getQueryData<Record<string, MarketConfig>>(queryKey);
        if (cached && Object.keys(cached).length > 0) {
          return cached;
        }
        throw new Error(
          '[useMarketsConfigs] all batches failed and no cache available',
        );
      }

      const cached =
        client.getQueryData<Record<string, MarketConfig>>(queryKey) ?? {};
      return { ...cached, ...merged };
    },
    meta: { pollPriority: options?.pollPriority },
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval,
    refetchOnWindowFocus: false,
    select,
  });

  const demandSubscriber = useRef(Symbol('marketsConfigsDemand'));
  const refetch = result.refetch;
  useEffect(() => {
    if (!enabled || !demandedMarketAddressesKey) return;

    const subscriber = demandSubscriber.current;
    setMarketsConfigsDemand(demandScopeKey, subscriber, {
      addresses: demandedMarketAddressesKey.split(','),
      priority: refreshPriority,
    });

    if (refreshPriority === 'active') {
      scheduleMarketsConfigsDemandRefetch(demandScopeKey, async () => {
        const refetchResult = await refetch({ cancelRefetch: false });
        return refetchResult.isSuccess;
      });
    }

    return () => {
      removeMarketsConfigsDemand(demandScopeKey, subscriber);
    };
  }, [
    demandScopeKey,
    demandedMarketAddressesKey,
    enabled,
    refetch,
    refreshPriority,
  ]);

  return result;
};

export const useMarketsConfigs = (options?: MarketQueryOptions) =>
  useMarketsConfigsQuery(options, (data) => data);

export const useMarketConfigs = (
  market?: MarketDependency,
  options?: Omit<MarketQueryOptions, 'marketAddress' | 'markets'>,
) => {
  const marketAddress = market?.marketTokenAddress;
  return useMarketsConfigsQuery(
    {
      ...options,
      marketAddress,
      markets: market ? [market] : [],
    },
    (data) =>
      marketAddress ? getMarketDataByAddress(data, marketAddress) : undefined,
  );
};

// market isDisabled
export const useMarketIsDisabled = (marketAddress?: string) => {
  const { data: marketConfig } = useMarketConfigs(
    marketAddress ? { marketTokenAddress: marketAddress } : undefined,
  );

  return marketConfig?.isDisabled ?? false;
};

export const useMarketIsPausing = (marketAddress?: string) => {
  const insts = useInstStore((state) => state.getInsts());
  if (!marketAddress) return false;

  return !!insts[marketAddress]?.is_market_pausing;
};

export type CustodyItemType = {
  cumulative_funding_rate: string;
  fee_amount: string;
  global_short_average_price: string;
  global_short_size: string;
  guaranteed_usd: string;
  is_shortable: boolean;
  is_stable: boolean;
  last_funding_time: string;
  max_global_long_size: string;
  max_global_short_size: string;
  max_usd_amount: string;
  metadata: {
    fields: {
      name: string;
    };
  };
  pool_amount: string;
  protocol_fee: string;
  reserved_amount: string;
  weight: string;
  // extend pool_amount - reserved_amount
  available_amount: string;
};
