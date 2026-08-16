import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import {
  hlvMaxMarketTokenBalanceAmountKey,
  hlvMaxMarketTokenBalanceUsdKey,
  isHlvDisabledKey,
} from '@hertzflow/sdk-v2/configs/dataStore';
import { getAddress, type Address, zeroAddress } from 'viem';

import type { useHzSdk } from '@/common/chainClient/hooks';
import { hlvTokensKeys } from '@/stores/synthetics/marketTokens/constants';
import type {
  HlvInfo,
  HlvInfoData,
  HlvMarket,
} from '@/stores/synthetics/marketTokens/types';
import { VAULT_MARKETS_CONFIGS_QUERY_KEY } from './types';
import type { ContractsChainId } from '@hertzflow/sdk-v2/configs/chains';
import type {
  MarketConfig,
  Market,
  MarketInfo,
  MarketValues,
  MarketsInfoData,
} from '@hertzflow/sdk-v2/types/markets';
import type {
  TokenPricesData,
  TokensData,
} from '@hertzflow/sdk-v2/types/tokens';
import type { QueryClient } from '@tanstack/react-query';

export type MulticallRequestConfig = Parameters<
  NonNullable<ReturnType<typeof useHzSdk>>['executeMulticall']
>[0];

const VAULT_MARKET_CHUNK_SIZE = 15;

function normalizeAddress(address: string): string {
  try {
    return getAddress(address);
  } catch {
    return address;
  }
}

function getVaultMarketsConfigsCacheKey(chainId?: ContractsChainId) {
  return [...VAULT_MARKETS_CONFIGS_QUERY_KEY, chainId] as const;
}

function getCachedHlvInfoFromData(
  hlvData: HlvInfoData | undefined,
  vaultAddress: Address,
): HlvInfo | undefined {
  if (!hlvData) return undefined;
  const targetAddress = vaultAddress.toLowerCase();
  const directHit = hlvData[vaultAddress] ?? hlvData[targetAddress as Address];
  if (directHit) return directHit;
  const entry = Object.entries(hlvData).find(
    ([address]) => address.toLowerCase() === targetAddress,
  );
  return entry?.[1];
}

function hasCompleteHlvMarkets(
  hlvInfo: HlvInfo | undefined,
  marketAddresses: Address[],
): boolean {
  if (!hlvInfo) return false;
  if (marketAddresses.length === 0) return true;

  const cachedMarkets = new Set(
    hlvInfo.markets.map((market) => market.address.toLowerCase()),
  );

  return marketAddresses.every((marketAddress) =>
    cachedMarkets.has(marketAddress.toLowerCase()),
  );
}

export function getCachedHlvInfo(
  queryClient: QueryClient,
  chainId: number | undefined,
  vaultAddress: Address | undefined,
  marketAddresses: Address[] = [],
): HlvInfo | undefined {
  if (!chainId || !vaultAddress) return undefined;
  const cachedHlvSnapshot = getCachedHlvInfoSnapshot(
    queryClient,
    chainId,
    vaultAddress,
    marketAddresses,
  );

  return cachedHlvSnapshot?.hlvInfo;
}

export function getCachedHlvInfoSnapshot(
  queryClient: QueryClient,
  chainId: number | undefined,
  vaultAddress: Address | undefined,
  marketAddresses: Address[] = [],
): { hlvInfo: HlvInfo; dataUpdatedAt: number } | undefined {
  if (!chainId || !vaultAddress) return undefined;
  const cachedQueries = queryClient.getQueryCache().findAll({
    queryKey: [...hlvTokensKeys.chain(chainId), 'info'],
  });

  for (const cachedQuery of cachedQueries) {
    if (cachedQuery.state.fetchStatus !== 'idle') {
      continue;
    }
    if (cachedQuery.isStale()) {
      continue;
    }
    const cachedHlvInfo = getCachedHlvInfoFromData(
      (cachedQuery.state.data as { hlvData?: HlvInfoData } | undefined)
        ?.hlvData,
      vaultAddress,
    );
    if (
      cachedHlvInfo &&
      hasCompleteHlvMarkets(cachedHlvInfo, marketAddresses)
    ) {
      return {
        hlvInfo: cachedHlvInfo,
        dataUpdatedAt: cachedQuery.state.dataUpdatedAt,
      };
    }
  }

  return undefined;
}

export function pickMarketsInfoSubset(
  marketsInfoData: MarketsInfoData | undefined,
  marketAddresses: Address[],
): MarketsInfoData | undefined {
  if (!marketsInfoData || marketAddresses.length === 0) return undefined;

  const subset: MarketsInfoData = {} as MarketsInfoData;

  for (const marketAddress of marketAddresses) {
    const checksum = getAddress(marketAddress);
    const marketInfo =
      marketsInfoData[checksum] ??
      marketsInfoData[checksum.toLowerCase()] ??
      marketsInfoData[marketAddress] ??
      marketsInfoData[String(marketAddress).toLowerCase()];

    if (!marketInfo) {
      return undefined;
    }

    subset[checksum] = marketInfo as MarketInfo;
  }

  return subset;
}

type VaultMarketsRequest = {
  hlvToken: Address;
  markets: Address[];
};

export async function fetchHlvMarketsForVaults({
  hzSdk,
  chainId,
  vaults,
}: {
  hzSdk: ReturnType<typeof useHzSdk>;
  chainId: ContractsChainId;
  vaults: VaultMarketsRequest[];
}): Promise<Record<Address, HlvMarket[]>> {
  if (!vaults.length) return {};
  const dataStoreAddress = getContract(chainId, 'DataStore');
  const request: MulticallRequestConfig = {};

  for (const { hlvToken, markets } of vaults) {
    for (const market of markets) {
      request[`${hlvToken}-${market}-info`] = {
        contractAddress: dataStoreAddress,
        abiId: 'DataStore',
        calls: {
          hlvMaxMarketTokenBalanceAmount: {
            methodName: 'getUint',
            params: [hlvMaxMarketTokenBalanceAmountKey(hlvToken, market)],
          },
          hlvMaxMarketTokenBalanceUsd: {
            methodName: 'getUint',
            params: [hlvMaxMarketTokenBalanceUsdKey(hlvToken, market)],
          },
          isHlvDisabled: {
            methodName: 'getBool',
            params: [isHlvDisabledKey(hlvToken, market)],
          },
        },
      };

      request[`${hlvToken}-${market}-hzlp-balance`] = {
        contractAddress: hlvToken,
        abiId: 'HlvToken',
        calls: {
          balance: { methodName: 'tokenBalances', params: [market] },
        },
      };
    }
  }

  const result = await hzSdk?.executeMulticall(request);
  const marketsByVault = {} as Record<Address, HlvMarket[]>;

  for (const { hlvToken, markets } of vaults) {
    const hlvMarkets: HlvMarket[] = [];
    for (const market of markets) {
      if (result?.errors?.[`${hlvToken}-${market}-info`]) continue;
      if (result?.errors?.[`${hlvToken}-${market}-hzlp-balance`]) continue;
      const marketData = result?.data[`${hlvToken}-${market}-info`];
      if (!marketData) continue;
      const marketBalance =
        result.data[`${hlvToken}-${market}-hzlp-balance`]?.balance
          ?.returnValues?.[0] ?? 0n;

      hlvMarkets.push({
        address: market,
        isDisabled: marketData.isHlvDisabled?.returnValues?.[0] ?? false,
        hlvMaxMarketTokenBalanceUsd:
          marketData.hlvMaxMarketTokenBalanceUsd?.returnValues?.[0],
        hlvMaxMarketTokenBalanceAmount:
          marketData.hlvMaxMarketTokenBalanceAmount?.returnValues?.[0] ?? 0n,
        hzlpBalance: marketBalance,
      });
    }
    marketsByVault[hlvToken] = hlvMarkets.sort((a, b) =>
      a.hzlpBalance > b.hzlpBalance ? -1 : 1,
    );
  }

  return marketsByVault;
}

export async function fetchHlvMarketsForVault({
  hzSdk,
  chainId,
  hlvToken,
  markets,
}: {
  hzSdk: ReturnType<typeof useHzSdk>;
  chainId: ContractsChainId;
  hlvToken: Address;
  markets: Address[];
}): Promise<HlvMarket[]> {
  if (!markets.length) return [];
  const marketsByVault = await fetchHlvMarketsForVaults({
    hzSdk,
    chainId,
    vaults: [{ hlvToken, markets }],
  });
  return marketsByVault[hlvToken] ?? [];
}

async function fetchMarketsByTokenAddresses({
  hzSdk,
  chainId,
  marketTokenAddresses,
}: {
  hzSdk: ReturnType<typeof useHzSdk>;
  chainId?: ContractsChainId;
  marketTokenAddresses: string[];
}): Promise<Market[]> {
  const normalizedAddresses = Array.from(
    new Set(marketTokenAddresses.map((addr) => normalizeAddress(addr))),
  );
  if (normalizedAddresses.length === 0 || !hzSdk || !chainId) return [];

  const dataStoreAddress = getContract(chainId, 'DataStore');
  const readerAddress = getContract(chainId, 'SyntheticsReader');
  const request: MulticallRequestConfig = {};

  normalizedAddresses.forEach((marketTokenAddress) => {
    request[`market-${marketTokenAddress.toLowerCase()}`] = {
      contractAddress: readerAddress,
      abiId: 'SyntheticsReader',
      calls: {
        market: {
          methodName: 'getMarket',
          params: [dataStoreAddress, marketTokenAddress],
        },
      },
    };
  });

  const result = await hzSdk?.executeMulticall(request);

  const markets: Market[] = [];
  normalizedAddresses.forEach((marketTokenAddress) => {
    const key = `market-${marketTokenAddress.toLowerCase()}`;
    if (result.errors?.[key]) return;
    const returnValues = result.data[key]?.market?.returnValues as
      | {
          marketToken?: string;
          indexToken?: string;
          longToken?: string;
          shortToken?: string;
        }
      | [string, string, string, string]
      | undefined;
    if (!returnValues) return;

    try {
      const marketTokenRaw = Array.isArray(returnValues)
        ? returnValues[0]
        : returnValues.marketToken;
      const indexTokenRaw = Array.isArray(returnValues)
        ? returnValues[1]
        : returnValues.indexToken;
      const longTokenRaw = Array.isArray(returnValues)
        ? returnValues[2]
        : returnValues.longToken;
      const shortTokenRaw = Array.isArray(returnValues)
        ? returnValues[3]
        : returnValues.shortToken;
      const marketToken = normalizeAddress(
        marketTokenRaw ?? marketTokenAddress,
      );
      const indexToken = normalizeAddress(indexTokenRaw ?? zeroAddress);
      const longToken = normalizeAddress(longTokenRaw ?? zeroAddress);
      const shortToken = normalizeAddress(shortTokenRaw ?? zeroAddress);
      if (
        marketToken.toLowerCase() === zeroAddress.toLowerCase() ||
        longToken.toLowerCase() === zeroAddress.toLowerCase() ||
        shortToken.toLowerCase() === zeroAddress.toLowerCase()
      ) {
        return;
      }

      markets.push({
        marketTokenAddress: marketToken,
        indexTokenAddress: indexToken,
        longTokenAddress: longToken,
        shortTokenAddress: shortToken,
        isSameCollaterals: longToken.toLowerCase() === shortToken.toLowerCase(),
        isSpotOnly: indexToken.toLowerCase() === zeroAddress.toLowerCase(),
      });
    } catch {
      // Skip invalid market payloads.
    }
  });

  return markets;
}

export const resolveMarketsInfoData = async (
  hzSdk: ReturnType<typeof useHzSdk>,
  queryClient: QueryClient,
  pricesData?: TokenPricesData,
  marketTokenAddresses?: string[],
): Promise<{
  marketsInfoData: MarketsInfoData;
  pricesData: TokenPricesData;
  tokensData: TokensData;
}> => {
  const marketTokenAddressSet =
    marketTokenAddresses && marketTokenAddresses.length > 0
      ? new Set(
          marketTokenAddresses.map((v) => normalizeAddress(v).toLowerCase()),
        )
      : undefined;
  let allMarkets: Market[];
  if (marketTokenAddressSet) {
    const requestedMarkets = await fetchMarketsByTokenAddresses({
      hzSdk,
      chainId: hzSdk?.chainId,
      marketTokenAddresses: Array.from(marketTokenAddressSet),
    });
    if (requestedMarkets.length < marketTokenAddressSet.size) {
      const marketsFromList = await hzSdk?.markets.getMarkets();
      const marketMap = new Map(
        requestedMarkets.map((m) => [m.marketTokenAddress.toLowerCase(), m]),
      );
      marketsFromList?.forEach((market) => {
        const key = market.marketTokenAddress.toLowerCase();
        if (marketTokenAddressSet.has(key) && !marketMap.has(key)) {
          marketMap.set(key, market);
        }
      });
      allMarkets = Array.from(marketMap.values());
    } else {
      allMarkets = requestedMarkets;
    }
  } else {
    allMarkets = (await hzSdk?.markets.getMarkets()) || [];
  }
  const markets = marketTokenAddressSet
    ? allMarkets?.filter((m) =>
        marketTokenAddressSet.has(m.marketTokenAddress.toLowerCase()),
      )
    : allMarkets;
  const tokensResult = await hzSdk?.tokens.getTokensData();
  const tokensData = tokensResult?.tokensData;
  if (!tokensData || Object.keys(tokensData).length === 0) {
    throw new Error('Failed to resolve vault market tokens data');
  }
  let resolvedPricesData = pricesData;
  if (!resolvedPricesData || Object.keys(resolvedPricesData).length === 0) {
    const pricesResult = await hzSdk?.tokens.getTokenRecentPrices();
    resolvedPricesData = pricesResult?.pricesData ?? {};
  }
  const chunkSize = VAULT_MARKET_CHUNK_SIZE;
  const marketChunks =
    markets.length > chunkSize
      ? Array.from({ length: Math.ceil(markets.length / chunkSize) }, (_, i) =>
          markets.slice(i * chunkSize, i * chunkSize + chunkSize),
        )
      : [markets];

  const chainId = hzSdk?.chainId;
  const vaultMarketsConfigsQuery = queryClient.getQueryCache().find({
    queryKey: getVaultMarketsConfigsCacheKey(chainId),
  });
  const cachedMarketsConfigs =
    vaultMarketsConfigsQuery && !vaultMarketsConfigsQuery.isStale()
      ? (queryClient.getQueryData<Record<string, MarketConfig>>(
          getVaultMarketsConfigsCacheKey(chainId),
        ) ?? {})
      : {};
  const nextCachedMarketsConfigs = { ...cachedMarketsConfigs };
  const marketsConfigs = {} as Record<string, MarketConfig>;
  const missingForConfigs: Market[] = [];
  for (const m of markets) {
    const key = m.marketTokenAddress.toLowerCase();
    const cached = nextCachedMarketsConfigs[key];
    if (cached) {
      marketsConfigs[m.marketTokenAddress] = cached;
    } else {
      missingForConfigs.push(m);
    }
  }
  if (missingForConfigs.length > 0) {
    const missingChunks =
      missingForConfigs.length > chunkSize
        ? Array.from(
            { length: Math.ceil(missingForConfigs.length / chunkSize) },
            (_, i) =>
              missingForConfigs.slice(i * chunkSize, i * chunkSize + chunkSize),
          )
        : [missingForConfigs];
    const configsByChunk = await Promise.all(
      missingChunks.map(async (chunk) => {
        return (await hzSdk?.markets.getMarketsConfigs(chunk)) || {};
      }),
    );

    for (const configs of configsByChunk) {
      Object.entries(configs).forEach(([addr, cfg]) => {
        nextCachedMarketsConfigs[addr.toLowerCase()] = cfg;
        marketsConfigs[addr] = cfg;
      });
    }
    queryClient.setQueryData(
      getVaultMarketsConfigsCacheKey(chainId),
      nextCachedMarketsConfigs,
    );
  }

  const marketsValues = {} as Record<string, MarketValues>;
  const valuesByChunk = await Promise.all(
    marketChunks.map((chunk) =>
      hzSdk?.markets.getMarketsValues({
        prices: resolvedPricesData,
        markets: chunk,
        tokensData,
      }),
    ),
  );
  for (const values of valuesByChunk) {
    Object.assign(marketsValues, values);
  }
  const { marketsInfoData } = hzSdk?.markets.mergeMarketsInfo({
    markets,
    tokensData,
    marketsConfigs,
    marketsValues,
  }) || { marketsInfoData: {} };
  return {
    marketsInfoData,
    pricesData: resolvedPricesData,
    tokensData,
  };
};
