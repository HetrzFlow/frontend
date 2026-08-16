import { useEffect, useMemo } from 'react';
import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import {
  hlvShiftLastExecutedAtKey,
  hlvShiftMinIntervalKey,
  hlvMaxMarketTokenBalanceAmountKey,
  hlvMaxMarketTokenBalanceUsdKey,
  isHlvDisabledKey,
} from '@hertzflow/sdk-v2/configs/dataStore';
import { convertToContractTokenPrices } from '@hertzflow/sdk-v2/utils/tokens';
import { useQuery } from '@repo/lib/queryClient';
import { useHzSdk } from '@/common/chainClient/hooks';
import { STATIC_CONFIG_CACHE_TIME } from '@/common/constants/timeConstants';
import type { Coin } from '@/common/services/rest/inst';
import { useInstStore } from '@/common/stores/instStore';
import { usePriceStore } from '@/common/stores/priceStore';
import {
  hlvTokensKeys,
  HLV_REFRESH_INTERVAL,
  HLV_STALE_TIME,
  HLV_GC_TIME,
} from '../constants';
import { HLV_TOKEN_CONFIG } from '../types';
import { selectScopedHlvs } from './hlvScope';
import type {
  HlvInfoData,
  HlvList,
  HlvListItem,
  HlvMarket,
  HlvTokenData,
  HlvCollateralToken,
} from '../types';
import type { Address } from 'viem';

interface HlvMarketsQueryParams {
  account?: Address;
  enabled?: boolean;
  refreshInterval?: number;
  vaultAddresses?: Address[];
}

interface HlvListQueryResult {
  hlvList: HlvList;
}

export function useHlvListQuery({
  enabled = true,
}: Pick<HlvMarketsQueryParams, 'enabled'>) {
  const hzSdk = useHzSdk();
  const chainId = hzSdk?.chainId;
  const hasChainId = !!chainId;

  return useQuery<HlvListQueryResult | null>({
    queryKey: hlvTokensKeys.list(chainId),
    enabled: enabled && hasChainId,
    retry: 1,
    retryDelay: 1_000,
    queryFn: async () => {
      if (!hasChainId) return null;
      const dataStoreAddress = getContract(chainId, 'DataStore');
      const hlvReaderAddress = getContract(chainId, 'HlvReader');

      const result = await hzSdk.executeMulticall({
        hlvs: {
          contractAddress: hlvReaderAddress,
          abiId: 'HlvReader',
          calls: {
            list: {
              methodName: 'getHlvInfoList',
              params: [dataStoreAddress, 0, 100],
            },
          },
        },
      });

      const hlvs = result.data.hlvs?.list?.returnValues as HlvList | undefined;
      if (!hlvs || hlvs.length === 0) return null;

      return { hlvList: hlvs };
    },
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    refetchOnWindowFocus: false,
  });
}

interface HlvMarketsInfoQueryParams extends HlvMarketsQueryParams {
  hlvList: HlvListItem[] | undefined;
  marketsInfoData: Record<Address, unknown> | undefined;
}

interface HlvMarketsInfoQueryResult {
  hlvData: HlvInfoData;
}

export function useHzvMarketsInfoQuery({
  hlvList,
  marketsInfoData,
  account,
  enabled = true,
  refreshInterval = HLV_REFRESH_INTERVAL,
  vaultAddresses,
}: HlvMarketsInfoQueryParams) {
  const hzSdk = useHzSdk();
  const chainId = hzSdk?.chainId;
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const instsMap = useInstStore((state) => state.insts.map);
  const coinsMap = useInstStore((state) => state.getCoins());
  const requestInsts = useInstStore((state) => state.getInsts);
  const requestCoins = useInstStore((state) => state.getCoins);
  const hasChainId = !!chainId;

  useEffect(() => {
    requestInsts();
    requestCoins();
  }, [requestInsts, requestCoins]);

  const hasPrices = Object.keys(pricesMap).length > 0;
  const hasInsts = Object.keys(instsMap).length > 0;
  const hasCoins = Object.keys(coinsMap).length > 0;

  const filteredHlvs = useMemo(() => {
    if (!hlvList || !marketsInfoData) return undefined;
    return selectScopedHlvs(hlvList, marketsInfoData, vaultAddresses);
  }, [hlvList, marketsInfoData, vaultAddresses]);

  const shouldRequest =
    enabled &&
    hasChainId &&
    hasPrices &&
    hasInsts &&
    hasCoins &&
    filteredHlvs &&
    filteredHlvs.length > 0 &&
    marketsInfoData;

  const hlvAddresses = filteredHlvs?.map(({ hlv }) => hlv.hlvToken) ?? [];
  const hlvMarketsSignature =
    filteredHlvs
      ?.map(
        ({ hlv, markets }) =>
          `${hlv.hlvToken.toLowerCase()}:${markets
            .map((market) => market.toLowerCase())
            .sort()
            .join(',')}`,
      )
      .sort()
      .join('|') ?? 'all-markets';

  return useQuery<HlvMarketsInfoQueryResult | null>({
    queryKey: hlvTokensKeys.info(
      chainId,
      account,
      hlvAddresses as string[],
      hlvMarketsSignature,
    ),
    enabled: Boolean(shouldRequest),
    retry: false,
    queryFn: async () => {
      if (!hasChainId || !filteredHlvs || filteredHlvs.length === 0)
        return null;

      const dataStoreAddress = getContract(chainId, 'DataStore');
      const hlvReaderAddress = getContract(chainId, 'HlvReader');

      return buildHlvMulticallRequest({
        hzSdk,
        chainId,
        filteredHlvs,
        pricesMap,
        instsMap,
        coinsMap,
        account,
        dataStoreAddress,
        hlvReaderAddress,
      });
    },
    staleTime: HLV_STALE_TIME,
    gcTime: HLV_GC_TIME,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
  });
}

// Helper types and functions

interface BuildHlvMulticallParams {
  hzSdk: ReturnType<typeof useHzSdk>;
  chainId: number;
  filteredHlvs: HlvListItem[];
  pricesMap: Record<string, { minPrice: bigint; maxPrice: bigint }>;
  instsMap: Record<
    string,
    {
      indexTokenAddress: string;
      longTokenAddress: string;
      shortTokenAddress: string;
    }
  >;
  coinsMap: Record<string, Coin>;
  account?: Address;
  dataStoreAddress: Address;
  hlvReaderAddress: Address;
}

async function buildHlvMulticallRequest({
  hzSdk,
  chainId,
  filteredHlvs,
  pricesMap,
  instsMap,
  coinsMap,
  account,
  dataStoreAddress,
  hlvReaderAddress,
}: BuildHlvMulticallParams): Promise<HlvMarketsInfoQueryResult | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request: Record<string, any> = {};

  for (const { hlv, markets } of filteredHlvs) {
    // Get token info from coinsMap using HLV's longToken/shortToken addresses
    const longTokenCoin = coinsMap[hlv.longToken];
    const shortTokenCoin = coinsMap[hlv.shortToken];

    const hlvLongTokenPrices = pricesMap[hlv.longToken];
    const hlvShortTokenPrices = pricesMap[hlv.shortToken];

    if (!hlvLongTokenPrices || !hlvShortTokenPrices) continue;

    const longTokenDecimals = longTokenCoin?.decimals ?? 18;
    const shortTokenDecimals = shortTokenCoin?.decimals ?? 18;

    const contractHlvPricesLong = convertToContractTokenPrices(
      hlvLongTokenPrices,
      longTokenDecimals,
    );
    const contractHlvPricesShort = convertToContractTokenPrices(
      hlvShortTokenPrices,
      shortTokenDecimals,
    );

    const marketIndexPrices = markets.map((market) => {
      const inst = instsMap[market];
      if (!inst) return [0n, 0n];
      const indexPrices = pricesMap[inst.indexTokenAddress];
      if (!indexPrices) return [0n, 0n];
      const indexCoin = coinsMap[inst.indexTokenAddress];
      const contractPrices = convertToContractTokenPrices(
        indexPrices,
        indexCoin?.decimals ?? 18,
      );
      return [contractPrices.min, contractPrices.max];
    });

    const hlvPricesQuery = [
      dataStoreAddress,
      markets,
      marketIndexPrices,
      [contractHlvPricesLong.min, contractHlvPricesLong.max],
      [contractHlvPricesShort.min, contractHlvPricesShort.max],
      hlv.hlvToken,
    ];

    request[`${hlv.hlvToken}-prices`] = {
      contractAddress: hlvReaderAddress,
      abiId: 'HlvReader',
      calls: {
        hlvTokenPriceMin: {
          methodName: 'getHlvTokenPrice',
          params: [...hlvPricesQuery, false],
        },
        hlvTokenPriceMax: {
          methodName: 'getHlvTokenPrice',
          params: [...hlvPricesQuery, true],
        },
      },
    };

    request[`${hlv.hlvToken}-hlvValue`] = {
      contractAddress: hlvReaderAddress,
      abiId: 'HlvReader',
      calls: {
        hlvValueMax: {
          methodName: 'getHlvValue',
          params: [...hlvPricesQuery, true],
        },
        hlvValueMin: {
          methodName: 'getHlvValue',
          params: [...hlvPricesQuery, false],
        },
      },
    };

    request[`${hlv.hlvToken}-tokenData`] = {
      contractAddress: hlv.hlvToken,
      abiId: 'Token',
      calls: {
        symbol: { methodName: 'symbol', params: [] },
        name: { methodName: 'name', params: [] },
        ...(account
          ? { balance: { methodName: 'balanceOf', params: [account] } }
          : {}),
      },
    };

    request[`${hlv.hlvToken}-info`] = {
      contractAddress: dataStoreAddress,
      abiId: 'DataStore',
      calls: {
        hlvShiftLastExecutedAt: {
          methodName: 'getUint',
          params: [hlvShiftLastExecutedAtKey(hlv.hlvToken)],
        },
        hlvShiftMinInterval: {
          methodName: 'getUint',
          params: [hlvShiftMinIntervalKey(hlv.hlvToken)],
        },
      },
    };

    for (const market of markets) {
      request[`${hlv.hlvToken}-${market}-info`] = {
        contractAddress: dataStoreAddress,
        abiId: 'DataStore',
        calls: {
          hlvMaxMarketTokenBalanceAmount: {
            methodName: 'getUint',
            params: [hlvMaxMarketTokenBalanceAmountKey(hlv.hlvToken, market)],
          },
          hlvMaxMarketTokenBalanceUsd: {
            methodName: 'getUint',
            params: [hlvMaxMarketTokenBalanceUsdKey(hlv.hlvToken, market)],
          },
          isHlvDisabled: {
            methodName: 'getBool',
            params: [isHlvDisabledKey(hlv.hlvToken, market)],
          },
        },
      };

      request[`${hlv.hlvToken}-${market}-hzlp-balance`] = {
        contractAddress: hlv.hlvToken,
        abiId: 'HlvToken',
        calls: {
          balance: { methodName: 'tokenBalances', params: [market] },
        },
      };
    }
  }

  if (Object.keys(request).length === 0 || !hzSdk) return null;

  const result = await hzSdk.executeMulticall(request);

  return parseHlvMulticallResponse({
    chainId,
    filteredHlvs,
    pricesMap,
    coinsMap,
    result,
  });
}

interface ParseHlvResponseParams {
  chainId: number;
  filteredHlvs: HlvListItem[];
  pricesMap: Record<string, { minPrice: bigint; maxPrice: bigint }>;
  coinsMap: Record<string, Coin>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: { data: Record<string, any>; errors?: Record<string, any> };
}

function parseHlvMulticallResponse({
  filteredHlvs,
  pricesMap,
  coinsMap,
  result,
}: ParseHlvResponseParams): HlvMarketsInfoQueryResult | null {
  const hlvData: HlvInfoData = {};

  for (const { hlv, markets } of filteredHlvs) {
    const pricesData = result.data[`${hlv.hlvToken}-prices`];
    const hlvValueData = result.data[`${hlv.hlvToken}-hlvValue`];
    const tokenData = result.data[`${hlv.hlvToken}-tokenData`];
    const infoData = result.data[`${hlv.hlvToken}-info`];

    if (
      result.errors?.[`${hlv.hlvToken}-prices`] ||
      result.errors?.[`${hlv.hlvToken}-hlvValue`] ||
      !pricesData ||
      !hlvValueData ||
      !tokenData ||
      !infoData
    ) {
      continue;
    }

    const pricesMax = pricesData.hlvTokenPriceMax?.returnValues as
      | [bigint, bigint, bigint]
      | undefined;
    const pricesMin = pricesData.hlvTokenPriceMin?.returnValues as
      | [bigint, bigint, bigint]
      | undefined;
    const [valueMax] = (hlvValueData.hlvValueMax?.returnValues as
      | [bigint, bigint, bigint]
      | undefined) ?? [0n];
    const [valueMin] = (hlvValueData.hlvValueMin?.returnValues as
      | [bigint, bigint, bigint]
      | undefined) ?? [0n];

    if (!pricesMin || !pricesMax) continue;

    const [priceMin, , totalSupply] = pricesMin;
    const [priceMax] = pricesMax;

    const walletBalance: bigint | undefined =
      tokenData.balance?.returnValues?.[0];
    const contractSymbol: string =
      tokenData.symbol?.returnValues?.[0] ?? 'HzLV';
    const contractName: string =
      tokenData.name?.returnValues?.[0] ?? 'HertzFlow Vault';

    // Get token info from coinsMap
    const longTokenCoin = coinsMap[hlv.longToken];
    const shortTokenCoin = coinsMap[hlv.shortToken];
    const hlvLongTokenPrices = pricesMap[hlv.longToken];
    const hlvShortTokenPrices = pricesMap[hlv.shortToken];

    const hlvToken: HlvTokenData = {
      ...HLV_TOKEN_CONFIG,
      address: hlv.hlvToken as Address,
      prices: { minPrice: priceMin, maxPrice: priceMax },
      totalSupply,
      balance: walletBalance,
      contractSymbol,
    };

    const longToken: HlvCollateralToken = {
      name: longTokenCoin?.name ?? 'Long Token',
      symbol: longTokenCoin?.symbol ?? 'LONG',
      decimals: longTokenCoin?.decimals ?? 18,
      address: hlv.longToken as Address,
      icon: longTokenCoin?.icon,
      prices: hlvLongTokenPrices ?? { minPrice: 0n, maxPrice: 0n },
    };

    const shortToken: HlvCollateralToken = {
      name: shortTokenCoin?.name ?? 'Short Token',
      symbol: shortTokenCoin?.symbol ?? 'SHORT',
      decimals: shortTokenCoin?.decimals ?? 18,
      address: hlv.shortToken as Address,
      icon: shortTokenCoin?.icon,
      prices: hlvShortTokenPrices ?? { minPrice: 0n, maxPrice: 0n },
    };

    const hlvMarkets: HlvMarket[] = markets
      .map((market): HlvMarket | null => {
        const marketData = result.data[`${hlv.hlvToken}-${market}-info`];
        const marketBalance =
          result.data[`${hlv.hlvToken}-${market}-hzlp-balance`]?.balance
            ?.returnValues?.[0];

        if (
          !marketData ||
          result.errors?.[`${hlv.hlvToken}-${market}-hzlp-balance`] ||
          marketBalance === undefined
        ) {
          return null;
        }

        const hlvMaxMarketTokenBalanceAmount =
          marketData.hlvMaxMarketTokenBalanceAmount?.returnValues?.[0] ?? 0n;
        const hlvMaxMarketTokenBalanceUsd =
          marketData.hlvMaxMarketTokenBalanceUsd?.returnValues?.[0];

        return {
          address: market as Address,
          isDisabled: marketData.isHlvDisabled?.returnValues?.[0] ?? false,
          hlvMaxMarketTokenBalanceUsd,
          hlvMaxMarketTokenBalanceAmount,
          hzlpBalance: marketBalance,
        };
      })
      .filter((m): m is HlvMarket => m !== null)
      .sort((a, b) => (a.hzlpBalance > b.hzlpBalance ? -1 : 1));

    hlvData[hlv.hlvToken as Address] = {
      hlvToken,
      hlvTokenAddress: hlv.hlvToken as Address,
      longTokenAddress: hlv.longToken as Address,
      shortTokenAddress: hlv.shortToken as Address,
      isSameCollaterals: hlv.longToken === hlv.shortToken,
      isSpotOnly: false,
      name: contractName,
      longToken,
      shortToken,
      markets: hlvMarkets,
      shiftLastExecutedAt:
        infoData.hlvShiftLastExecutedAt?.returnValues?.[0] ?? 0n,
      shiftMinInterval: infoData.hlvShiftMinInterval?.returnValues?.[0] ?? 0n,
      isDisabled:
        hlvMarkets.length === markets.length &&
        hlvMarkets.length > 0 &&
        hlvMarkets.every((m) => m.isDisabled),
      poolValueMax: valueMax,
      poolValueMin: valueMin,
      data: '',
      isHlv: true,
      totalSupply,
      walletBalance,
    };
  }

  return { hlvData };
}
