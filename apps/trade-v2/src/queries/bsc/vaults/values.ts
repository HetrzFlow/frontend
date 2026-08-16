import { useCallback, useEffect, useMemo, useRef } from 'react';
import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import { convertToContractTokenPrices } from '@hertzflow/sdk-v2/utils/tokens';
import { getAddress, type Address } from 'viem';
import { useQuery, useQueryClient } from '@repo/lib/queryClient';

import { usePrivy } from '@/common/chainClient';
import { useHzSdk } from '@/common/chainClient/hooks';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { useInstStore } from '@/common/stores/instStore';
import { usePriceStore } from '@/common/stores/priceStore';
import { useMarketsInfoByAddresses } from '@/queries/bsc/pools';
import { useHlvDataSnapshot } from '@/stores/synthetics/marketTokens/selectors';
import type { HlvInfo } from '@/stores/synthetics/marketTokens/types';
import { useHzvConfigs, useHzvConfigByVault } from './configs';
import {
  type MulticallRequestConfig,
  resolveMarketsInfoData,
  fetchHlvMarketsForVault,
  getCachedHlvInfo,
  getCachedHlvInfoSnapshot,
  pickMarketsInfoSubset,
} from './helpers';
import {
  hzvValueQueryKey,
  hzvValuesQueryKey,
  invalidateHzvValuesIfNeeded,
  normalizeAddressSet,
} from './queryKeys';
import type { HzvValues } from './types';
import type { MarketsInfoData } from '@hertzflow/sdk-v2/types/markets';
import type {
  TokenPricesData,
  TokensData,
} from '@hertzflow/sdk-v2/types/tokens';

function getCachedHzvValues(
  hlvInfo: HlvInfo | undefined,
):
  | Pick<
      HzvValues,
      | 'hlvValue'
      | 'hlvValueMin'
      | 'hlvValueMax'
      | 'hlvTokenPrice'
      | 'hlvTokenPriceMin'
      | 'hlvTokenPriceMax'
      | 'hlvTotalSupply'
      | 'hlvMarkets'
    >
  | undefined {
  if (!hlvInfo) return undefined;

  const hlvTokenPriceMin = hlvInfo.hlvToken.prices?.minPrice;
  const hlvTokenPriceMax = hlvInfo.hlvToken.prices?.maxPrice;
  const hlvValueMin = hlvInfo.poolValueMin;
  const hlvValueMax = hlvInfo.poolValueMax;
  const hlvTotalSupply = hlvInfo.hlvToken.totalSupply;

  if (
    hlvValueMin === undefined ||
    hlvValueMax === undefined ||
    hlvTokenPriceMin === undefined ||
    hlvTokenPriceMax === undefined ||
    hlvTotalSupply === undefined
  ) {
    return undefined;
  }

  return {
    hlvValue: hlvValueMin,
    hlvValueMin,
    hlvValueMax,
    hlvTokenPrice: hlvTokenPriceMin,
    hlvTokenPriceMin,
    hlvTokenPriceMax,
    hlvTotalSupply,
    hlvMarkets: hlvInfo.markets,
  };
}

async function resolveVaultMarketsContext({
  hzSdk,
  queryClient,
  pricesData,
  marketAddresses,
  storeMarketsInfoData,
}: {
  hzSdk: NonNullable<ReturnType<typeof useHzSdk>>;
  queryClient: ReturnType<typeof useQueryClient>;
  pricesData: TokenPricesData;
  marketAddresses: Address[];
  storeMarketsInfoData: MarketsInfoData | undefined;
}): Promise<{
  marketsInfoData: MarketsInfoData;
  pricesData: TokenPricesData;
  tokensData: TokensData;
}> {
  const cachedMarketsInfoData = pickMarketsInfoSubset(
    storeMarketsInfoData,
    marketAddresses,
  );

  if (cachedMarketsInfoData) {
    const tokensResult = await hzSdk.tokens.getTokensData();
    const tokensData = tokensResult?.tokensData ?? {};

    if (Object.keys(tokensData).length === 0) {
      throw new Error('Failed to resolve HZV tokens data');
    }

    let resolvedPricesData = pricesData;
    if (Object.keys(resolvedPricesData).length === 0) {
      const pricesResult = await hzSdk.tokens.getTokenRecentPrices();
      resolvedPricesData = pricesResult?.pricesData ?? {};
    }

    return {
      marketsInfoData: cachedMarketsInfoData,
      pricesData: resolvedPricesData,
      tokensData,
    };
  }

  return resolveMarketsInfoData(
    hzSdk,
    queryClient,
    pricesData,
    marketAddresses,
  );
}

function areStoreMarketsInfoQueriesFresh({
  queryClient,
  chainId,
  marketAddressesKey,
  marketTokenAddresses,
}: {
  queryClient: ReturnType<typeof useQueryClient>;
  chainId: number | undefined;
  marketAddressesKey: string;
  marketTokenAddresses: string[];
}): boolean {
  if (!chainId || !marketAddressesKey || marketTokenAddresses.length === 0) {
    return false;
  }

  const marketsValuesQuery = queryClient.getQueryCache().find({
    queryKey: ['rest', 'marketsValues', chainId, marketAddressesKey],
  });
  const marketsConfigsQuery = queryClient.getQueryCache().find({
    queryKey: ['rest', 'marketsConfigs', chainId, marketTokenAddresses],
  });

  return Boolean(
    marketsValuesQuery &&
      marketsValuesQuery.state.fetchStatus === 'idle' &&
      !marketsValuesQuery.isStale() &&
      marketsConfigsQuery &&
      marketsConfigsQuery.state.fetchStatus === 'idle' &&
      !marketsConfigsQuery.isStale(),
  );
}

export const useHzvValues = (options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
  pricesData?: TokenPricesData;
  marketAddresses?: Address[];
  vaultAddresses?: Address[];
}) => {
  const hzSdk = useHzSdk();
  const queryClient = useQueryClient();
  const { ready } = usePrivy();
  const enabled = options?.enabled ?? true;
  const { data: hzvConfigs, isLoading: isConfigsLoading } = useHzvConfigs({
    enabled,
  });
  const chainId = hzSdk?.chainId;
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const scopedHzvConfigs = useMemo(() => {
    if (!hzvConfigs) return undefined;
    if (options?.vaultAddresses === undefined) return hzvConfigs;

    const allowedVaults = new Set(
      normalizeAddressSet(options.vaultAddresses).map((address) =>
        address.toLowerCase(),
      ),
    );
    return Object.fromEntries(
      Object.entries(hzvConfigs).filter(([vaultAddress]) =>
        allowedVaults.has(vaultAddress.toLowerCase()),
      ),
    );
  }, [hzvConfigs, options?.vaultAddresses]);
  const hzvConfigAddresses = useMemo(
    () => Object.keys(scopedHzvConfigs ?? {}) as Address[],
    [scopedHzvConfigs],
  );
  const hzvMarketAddresses = useMemo(
    () =>
      normalizeAddressSet([
        ...(options?.marketAddresses ?? []),
        ...Object.values(scopedHzvConfigs ?? {}).flatMap(
          (config) => config.markets ?? [],
        ),
      ]),
    [options?.marketAddresses, scopedHzvConfigs],
  );
  const {
    hlvData,
    hlvDataUpdatedAt,
    hlvIsFetching,
    hlvIsError,
    marketTokensData,
    marketTokensDataUpdatedAt,
    marketTokensIsFetching,
    marketTokensIsError,
  } = useHlvDataSnapshot({
    enabled,
    marketAddresses: hzvMarketAddresses,
    vaultAddresses: hzvConfigAddresses,
  });
  const {
    data: marketsInfoDataFromQuery,
    dataUpdatedAt: marketsInfoDataUpdatedAt,
    isFetching: marketsInfoIsFetching,
    isError: marketsInfoIsError,
  } = useMarketsInfoByAddresses(hzvMarketAddresses, {
    enabled: enabled && hzvMarketAddresses.length > 0,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const marketAddressesKey = useMemo(
    () =>
      hzvMarketAddresses.slice().sort().join(','),
    [hzvMarketAddresses],
  );
  const marketTokenAddresses = useMemo(
    () => hzvMarketAddresses.slice().sort(),
    [hzvMarketAddresses],
  );
  const refetchInterval = options?.refetchInterval ?? DYNAMIC_DATA_CACHE_TIME;
  const staleTime =
    typeof refetchInterval === 'number'
      ? refetchInterval
      : DYNAMIC_DATA_CACHE_TIME;
  const hasMarketTokensData =
    !!marketTokensData && Object.keys(marketTokensData).length > 0;
  const hasHlvData = !!hlvData && Object.keys(hlvData).length > 0;
  const isHzvValuesQueryEnabled =
    enabled &&
    ready &&
    !!hzSdk &&
    !!chainId &&
    !isConfigsLoading &&
    !!scopedHzvConfigs &&
    hzvConfigAddresses.length > 0 &&
    hasMarketTokensData &&
    hasHlvData;

  const queryKey = useMemo(
    () => hzvValuesQueryKey(hzSdk?.chainId, hzvConfigAddresses),
    [hzSdk?.chainId, hzvConfigAddresses],
  );
  const query = useQuery<Record<string, HzvValues>>({
    queryKey,
    enabled: isHzvValuesQueryEnabled,
    retry: false,
    queryFn: async () => {
      if (!hzSdk || !scopedHzvConfigs || !chainId) return {};
      const dataStoreAddress = getContract(chainId, 'DataStore');
      const hlvReaderAddress = getContract(chainId, 'HlvReader');
      const pricesData: TokenPricesData =
        options?.pricesData ?? pricesMap ?? {};
      const neededMarketAddresses = Array.from(
        new Set(
          Object.values(scopedHzvConfigs).flatMap((c) =>
            (c.markets ?? []).map((m) => getAddress(m)),
          ),
        ),
      );
      const {
        marketsInfoData,
        pricesData: resolvedPricesData,
        tokensData,
      } = await resolveVaultMarketsContext({
        hzSdk,
        queryClient,
        pricesData,
        marketAddresses: neededMarketAddresses,
        storeMarketsInfoData: areStoreMarketsInfoQueriesFresh({
          queryClient,
          chainId,
          marketAddressesKey,
          marketTokenAddresses,
        })
          ? marketsInfoDataFromQuery
          : undefined,
      });
      const result: Record<string, HzvValues> = {};
      const preparedRequests: Array<{
        hlvAddress: string;
        markets: Address[];
        hlvMarkets: NonNullable<HzvValues['hlvMarkets']>;
        indexTokenPrices: Array<{ min: bigint; max: bigint }>;
        longTokenPrice: { min: bigint; max: bigint };
        shortTokenPrice: { min: bigint; max: bigint };
      }> = [];

      const preparedHzvRequests = await Promise.all(
        Object.entries(scopedHzvConfigs).map(async ([hlvAddress, config]) => {
          const { markets, longToken, shortToken } = config;
          if (!markets || markets.length === 0) return null;
          const normalizedMarkets = markets.map((market) => getAddress(market));
          const indexTokenPrices: Array<{ min: bigint; max: bigint }> = [];
          const freshCachedHlvInfoSnapshot = getCachedHlvInfoSnapshot(
            queryClient,
            chainId,
            getAddress(hlvAddress) as Address,
            normalizedMarkets,
          );
          const freshCachedHlvInfo = freshCachedHlvInfoSnapshot?.hlvInfo;
          const hlvMarkets =
            freshCachedHlvInfo?.markets ??
            (await fetchHlvMarketsForVault({
              hzSdk,
              chainId,
              hlvToken: getAddress(hlvAddress) as Address,
              markets: normalizedMarkets,
            }));
          const hlvMarketsMap = new Map(
            hlvMarkets.map((market) => [getAddress(market.address), market]),
          );
          const hasCompleteCachedHlvMarkets = normalizedMarkets.every(
            (market) => hlvMarketsMap.has(market),
          );
          const latestMarketInputsUpdatedAt = Math.max(
            marketTokensDataUpdatedAt ?? 0,
            marketsInfoDataUpdatedAt ?? 0,
          );
          const canReuseCachedHzvValues =
            hasCompleteCachedHlvMarkets &&
            !!freshCachedHlvInfoSnapshot &&
            freshCachedHlvInfoSnapshot.dataUpdatedAt >=
              latestMarketInputsUpdatedAt;
          const cachedHzvValues = canReuseCachedHzvValues
            ? getCachedHzvValues(freshCachedHlvInfo)
            : undefined;
          for (const marketAddress of normalizedMarkets) {
            const checksumMarket = marketAddress;
            const marketInfo = marketsInfoData[checksumMarket];
            if (!marketInfo) return null;
            const indexTokenAddress = marketInfo.indexTokenAddress;
            const priceData = resolvedPricesData[indexTokenAddress];
            if (!priceData) return null;
            const contractPrices = convertToContractTokenPrices(
              priceData,
              marketInfo.indexToken.decimals,
            );
            indexTokenPrices.push(contractPrices);
          }
          const longTokenData = tokensData[longToken];
          const shortTokenData = tokensData[shortToken];
          const longPriceData = resolvedPricesData[longToken];
          const shortPriceData = resolvedPricesData[shortToken];
          if (!longPriceData || !shortPriceData) return null;
          const longDecimals = longTokenData?.decimals;
          const shortDecimals = shortTokenData?.decimals;
          if (
            typeof longDecimals !== 'number' ||
            typeof shortDecimals !== 'number'
          ) {
            return null;
          }
          const longTokenPrice = convertToContractTokenPrices(
            longPriceData,
            longDecimals,
          );
          const shortTokenPrice = convertToContractTokenPrices(
            shortPriceData,
            shortDecimals,
          );
          if (cachedHzvValues) {
            return {
              type: 'cached' as const,
              hlvAddress,
              values: cachedHzvValues,
            };
          }
          return {
            type: 'request' as const,
            request: {
              hlvAddress,
              markets: normalizedMarkets as Address[],
              hlvMarkets,
              indexTokenPrices,
              longTokenPrice,
              shortTokenPrice,
            },
          };
        }),
      );

      preparedHzvRequests.forEach((prepared) => {
        if (!prepared) return;
        if (prepared.type === 'cached') {
          result[prepared.hlvAddress] = prepared.values;
          return;
        }
        preparedRequests.push(prepared.request);
      });

      if (preparedRequests.length === 0) return result;

      const multicallRequest: MulticallRequestConfig = {};
      preparedRequests.forEach((request) => {
        const paramsMin = [
          dataStoreAddress as `0x${string}`,
          request.markets as `0x${string}`[],
          request.indexTokenPrices,
          request.longTokenPrice,
          request.shortTokenPrice,
          request.hlvAddress as `0x${string}`,
          false,
        ];
        const paramsMax = [
          dataStoreAddress as `0x${string}`,
          request.markets as `0x${string}`[],
          request.indexTokenPrices,
          request.longTokenPrice,
          request.shortTokenPrice,
          request.hlvAddress as `0x${string}`,
          true,
        ];
        multicallRequest[`${request.hlvAddress}-values`] = {
          contractAddress: hlvReaderAddress as `0x${string}`,
          abiId: 'HlvReader',
          calls: {
            hlvValueMin: {
              methodName: 'getHlvValue',
              params: paramsMin,
            },
            hlvValueMax: {
              methodName: 'getHlvValue',
              params: paramsMax,
            },
            hlvTokenPriceMin: {
              methodName: 'getHlvTokenPrice',
              params: paramsMin,
            },
            hlvTokenPriceMax: {
              methodName: 'getHlvTokenPrice',
              params: paramsMax,
            },
          },
        };
      });

      const multicallResult = await hzSdk?.executeMulticall(multicallRequest);

      preparedRequests.forEach((request) => {
        const key = `${request.hlvAddress}-values`;
        if (multicallResult.errors?.[key]) return;
        const valuesData = multicallResult.data[key];
        if (!valuesData) return;
        const hlvValueMin = valuesData.hlvValueMin?.returnValues?.[0] as
          | bigint
          | undefined;
        const hlvValueMax = valuesData.hlvValueMax?.returnValues?.[0] as
          | bigint
          | undefined;
        const hlvTokenPriceMinResult = valuesData.hlvTokenPriceMin
          ?.returnValues as [bigint, bigint, bigint] | undefined;
        const hlvTokenPriceMaxResult = valuesData.hlvTokenPriceMax
          ?.returnValues as [bigint, bigint, bigint] | undefined;
        if (
          !hlvTokenPriceMinResult ||
          !hlvTokenPriceMaxResult ||
          hlvValueMin === undefined ||
          hlvValueMax === undefined
        ) {
          return;
        }
        const hlvTokenPriceMin = hlvTokenPriceMinResult[0];
        const hlvTokenPriceMax = hlvTokenPriceMaxResult[0];
        const supply = hlvTokenPriceMinResult[2] ?? hlvTokenPriceMaxResult[2];
        if (
          hlvTokenPriceMin === undefined ||
          hlvTokenPriceMax === undefined ||
          supply === undefined
        ) {
          return;
        }
        result[request.hlvAddress] = {
          hlvValue: hlvValueMin,
          hlvValueMin,
          hlvValueMax,
          hlvTokenPrice: hlvTokenPriceMin,
          hlvTokenPriceMin,
          hlvTokenPriceMax,
          hlvTotalSupply: supply,
          hlvMarkets: request.hlvMarkets,
        };
      });

      return result;
    },
    placeholderData: (prev) => prev,
    staleTime,
    refetchInterval,
  });

  useEffect(() => {
    if (!enabled || refetchInterval !== false || !query.dataUpdatedAt) return;

    const inputsUpdatedAt = Math.max(
      hlvDataUpdatedAt ?? 0,
      marketsInfoDataUpdatedAt ?? 0,
    );
    void invalidateHzvValuesIfNeeded({
      queryClient,
      queryKey,
      inputsAreFetching:
        hlvIsFetching || marketTokensIsFetching || marketsInfoIsFetching,
      inputsHaveError: hlvIsError || marketTokensIsError || marketsInfoIsError,
      inputsUpdatedAt,
      queryUpdatedAt: query.dataUpdatedAt,
    });
  }, [
    enabled,
    hlvDataUpdatedAt,
    hlvIsFetching,
    hlvIsError,
    marketTokensIsError,
    marketTokensIsFetching,
    marketsInfoDataUpdatedAt,
    marketsInfoIsFetching,
    marketsInfoIsError,
    query.dataUpdatedAt,
    queryClient,
    queryKey,
    refetchInterval,
  ]);

  return {
    data: query.data,
    isLoading: !isHzvValuesQueryEnabled || query.isLoading,
    isFetching: query.isFetching,
    isPending: query.isPending,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useHzvValueByVault = (
  vaultAddress: string | undefined,
  options?: {
    staleTime?: number;
    refetchInterval?: number | false;
    pricesData?: TokenPricesData;
  },
) => {
  const hzSdk = useHzSdk();
  const queryClient = useQueryClient();
  const { ready } = usePrivy();
  const { data: hzvConfig, isLoading: isConfigLoading } =
    useHzvConfigByVault(vaultAddress);
  const tokensData = useInstStore((state) => state.getCoins());
  const chainId = hzSdk?.chainId;
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const neededMarketAddresses = useMemo(() => {
    if (!hzvConfig?.markets?.length) return [];
    return normalizeAddressSet(hzvConfig.markets);
  }, [hzvConfig?.markets]);
  const staleTime = options?.staleTime ?? DYNAMIC_DATA_CACHE_TIME;
  const refetchInterval = options?.refetchInterval ?? DYNAMIC_DATA_CACHE_TIME;
  const {
    data: scopedMarketsInfoData,
    isFetching: scopedMarketsInfoIsFetching,
    isError: scopedMarketsInfoIsError,
    error: scopedMarketsInfoError,
    refetch: refetchScopedMarketsInfo,
  } = useMarketsInfoByAddresses(neededMarketAddresses, {
    enabled: neededMarketAddresses.length > 0,
    refreshInterval: refetchInterval,
  });
  const scopedMarketsInfoRef = useRef(scopedMarketsInfoData);
  scopedMarketsInfoRef.current = scopedMarketsInfoData;
  const hasCompleteScopedMarketsInfoData = useCallback(
    (marketsInfoData: typeof scopedMarketsInfoData) => {
      if (!marketsInfoData) return false;
      const marketInfoAddresses = new Set(
        Object.keys(marketsInfoData).map((address) => address.toLowerCase()),
      );
      return neededMarketAddresses.every((address) =>
        marketInfoAddresses.has(address.toLowerCase()),
      );
    },
    [neededMarketAddresses],
  );
  const hasCompleteScopedMarketsInfo = hasCompleteScopedMarketsInfoData(
    scopedMarketsInfoData,
  );
  const checksumVault = vaultAddress ? getAddress(vaultAddress) : undefined;
  const isHzvValueQueryEnabled =
    ready &&
    !!hzSdk &&
    !!chainId &&
    !isConfigLoading &&
    !!hzvConfig &&
    !!checksumVault &&
    !scopedMarketsInfoIsFetching &&
    !scopedMarketsInfoIsError &&
    hasCompleteScopedMarketsInfo;

  const query = useQuery<HzvValues>({
    queryKey: hzvValueQueryKey(
      hzSdk?.chainId,
      checksumVault,
      neededMarketAddresses,
    ),
    enabled: isHzvValueQueryEnabled,
    retry: false,
    queryFn: async () => {
      if (!hzSdk || !hzvConfig || !checksumVault || !chainId) {
        throw new Error('HZV value query executed before prerequisites loaded');
      }
      const dataStoreAddress = getContract(chainId, 'DataStore');
      const hlvReaderAddress = getContract(chainId, 'HlvReader');
      const pricesData: TokenPricesData =
        options?.pricesData ?? pricesMap ?? {};
      if (!neededMarketAddresses.length) {
        throw new Error('HZV value query requires at least one market');
      }
      const marketsInfoData = scopedMarketsInfoRef.current;
      if (
        !marketsInfoData ||
        !hasCompleteScopedMarketsInfoData(marketsInfoData)
      ) {
        throw new Error('Incomplete scoped HZV market info');
      }
      const resolvedPricesData = pricesData;

      const hlvAddress = checksumVault;
      const markets = neededMarketAddresses;
      const { longToken, shortToken } = hzvConfig;
      const indexTokenPrices: Array<{ min: bigint; max: bigint }> = [];
      const cachedHlvInfo = getCachedHlvInfo(
        queryClient,
        chainId,
        hlvAddress as Address,
        markets,
      );
      const hlvMarkets =
        cachedHlvInfo?.markets ??
        (await fetchHlvMarketsForVault({
          hzSdk,
          chainId,
          hlvToken: hlvAddress as Address,
          markets: markets.map((m) => getAddress(m)),
        }));
      for (const marketAddress of markets) {
        const checksumMarket = getAddress(marketAddress);
        const marketInfo = marketsInfoData[checksumMarket];
        if (!marketInfo) {
          throw new Error(`Missing HZV market info for ${checksumMarket}`);
        }
        const indexTokenAddress = marketInfo.indexTokenAddress;
        const priceData = resolvedPricesData[indexTokenAddress];
        if (!priceData) {
          throw new Error(`Missing HZV index price for ${indexTokenAddress}`);
        }
        const contractPrices = convertToContractTokenPrices(
          priceData,
          marketInfo.indexToken.decimals,
        );
        indexTokenPrices.push(contractPrices);
      }
      const longTokenData = tokensData[longToken];
      const shortTokenData = tokensData[shortToken];
      const longPriceData = resolvedPricesData[longToken];
      const shortPriceData = resolvedPricesData[shortToken];
      if (!longPriceData || !shortPriceData) {
        throw new Error('Failed to resolve HZV collateral token prices');
      }
      const longDecimals = longTokenData?.decimals;
      const shortDecimals = shortTokenData?.decimals;
      if (
        typeof longDecimals !== 'number' ||
        typeof shortDecimals !== 'number'
      ) {
        throw new Error('Failed to resolve HZV collateral token decimals');
      }
      const longTokenPrice = convertToContractTokenPrices(
        longPriceData,
        longDecimals,
      );
      const shortTokenPrice = convertToContractTokenPrices(
        shortPriceData,
        shortDecimals,
      );

      const hlvMulticallKey = `${hlvAddress}-values`;
      const hlvMulticallResult = await hzSdk.executeMulticall({
        [hlvMulticallKey]: {
          contractAddress: hlvReaderAddress as `0x${string}`,
          abiId: 'HlvReader',
          calls: {
            hlvValue: {
              methodName: 'getHlvValue',
              params: [
                dataStoreAddress as `0x${string}`,
                markets as `0x${string}`[],
                indexTokenPrices,
                longTokenPrice,
                shortTokenPrice,
                hlvAddress as `0x${string}`,
                false,
              ],
            },
            hlvValueMax: {
              methodName: 'getHlvValue',
              params: [
                dataStoreAddress as `0x${string}`,
                markets as `0x${string}`[],
                indexTokenPrices,
                longTokenPrice,
                shortTokenPrice,
                hlvAddress as `0x${string}`,
                true,
              ],
            },
            hlvTokenPriceMin: {
              methodName: 'getHlvTokenPrice',
              params: [
                dataStoreAddress as `0x${string}`,
                markets as `0x${string}`[],
                indexTokenPrices,
                longTokenPrice,
                shortTokenPrice,
                hlvAddress as `0x${string}`,
                false,
              ],
            },
            hlvTokenPriceMax: {
              methodName: 'getHlvTokenPrice',
              params: [
                dataStoreAddress as `0x${string}`,
                markets as `0x${string}`[],
                indexTokenPrices,
                longTokenPrice,
                shortTokenPrice,
                hlvAddress as `0x${string}`,
                true,
              ],
            },
          },
        },
      });
      if (hlvMulticallResult.errors?.[hlvMulticallKey]) {
        throw new Error('Failed to fetch HZV value from HlvReader');
      }
      const hlvValuesData = hlvMulticallResult.data[hlvMulticallKey];
      const hlvValue = hlvValuesData?.hlvValue?.returnValues?.[0] as
        | bigint
        | undefined;
      const hlvValueMax = hlvValuesData?.hlvValueMax?.returnValues?.[0] as
        | bigint
        | undefined;
      const hlvTokenPriceMinResult = hlvValuesData?.hlvTokenPriceMin
        ?.returnValues as [bigint, bigint, bigint] | undefined;
      const hlvTokenPriceMaxResult = hlvValuesData?.hlvTokenPriceMax
        ?.returnValues as [bigint, bigint, bigint] | undefined;
      if (
        hlvValue === undefined ||
        hlvValueMax === undefined ||
        !hlvTokenPriceMinResult ||
        !hlvTokenPriceMaxResult
      ) {
        throw new Error('Incomplete HZV value response from HlvReader');
      }

      const hlvTokenPriceMin = hlvTokenPriceMinResult[0];
      const hlvTokenPriceMax = hlvTokenPriceMaxResult[0];
      const supply =
        hlvTokenPriceMinResult[2] ?? hlvTokenPriceMaxResult[2] ?? 0n;

      return {
        hlvValue,
        hlvValueMin: hlvValue,
        hlvValueMax,
        hlvTokenPrice: hlvTokenPriceMin,
        hlvTokenPriceMin,
        hlvTokenPriceMax,
        hlvTotalSupply: supply,
        hlvMarkets,
      };
    },
    placeholderData: (prev) => prev,
    staleTime,
    refetchInterval,
  });
  const refetchHzvValue = query.refetch;
  const refetch = useCallback(async () => {
    const marketsInfoResult = await refetchScopedMarketsInfo();
    if (marketsInfoResult.isError) {
      return marketsInfoResult;
    }
    scopedMarketsInfoRef.current = marketsInfoResult.data;
    return refetchHzvValue();
  }, [refetchHzvValue, refetchScopedMarketsInfo]);
  return {
    data: query.data,
    isLoading:
      !scopedMarketsInfoIsError &&
      (!isHzvValueQueryEnabled || query.isLoading) &&
      query.data === undefined,
    isFetching: scopedMarketsInfoIsFetching || query.isFetching,
    isPending: !scopedMarketsInfoIsError && query.isPending,
    isError: scopedMarketsInfoIsError || query.isError,
    isSuccess: !scopedMarketsInfoIsError && query.isSuccess,
    error: scopedMarketsInfoError ?? query.error,
    refetch,
  };
};
