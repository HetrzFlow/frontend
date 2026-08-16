import { useMemo } from 'react';
import { getAddress, type Address } from 'viem';
import { useQuery, useQueryClient } from '@repo/lib/queryClient';
import { useHzSdk } from '@/common/chainClient/hooks';
import { useInstStore } from '@/common/stores/instStore';
import { usePriceStore } from '@/common/stores/priceStore';
import type { MarketExposureItem } from '@/services/rest/vaults';
import { useMarketTokensByAddresses } from '@/stores/synthetics/marketTokens/hooks';
import { computeVaultRemainingCaps } from './caps';
import { useHzvConfigByVault } from './configs';
import { fetchHlvMarketsForVault, resolveMarketsInfoData } from './helpers';
import { useVaultDetail } from './list';
import { useInternalUsdConfigForToken } from './useInternalUsdConfig';
import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';

const VAULT_CAPS_REFRESH_INTERVAL = 10_000;

function normalizeAddress(address: string): Address {
  try {
    return getAddress(address) as Address;
  } catch {
    return address as Address;
  }
}

export function useVaultRemainingCaps(vaultAddress: string | undefined): {
  remainingDepositCapUsd: bigint | undefined;
  remainingWithdrawalCapUsd: bigint | undefined;
  remainingDepositCapByMarket: Record<Address, bigint>;
  remainingWithdrawalCapByMarket: Record<Address, bigint>;
  marketExposure: MarketExposureItem[] | undefined;
  marketsInfoData: Record<Address, MarketInfo> | undefined;
  isLoading: boolean;
} {
  const hzSdk = useHzSdk();
  const queryClient = useQueryClient();
  const chainId = hzSdk?.chainId;
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInsts());
  const checksumVaultAddress = useMemo(
    () => (vaultAddress ? normalizeAddress(vaultAddress) : undefined),
    [vaultAddress],
  );

  const { data: vaultDetailQuery, isLoading: isVaultDetailLoading } =
    useVaultDetail(vaultAddress ?? '', {
      staleTime: VAULT_CAPS_REFRESH_INTERVAL,
      refetchInterval: VAULT_CAPS_REFRESH_INTERVAL,
      includeWalletAddress: false,
    });
  const vaultDetail = vaultDetailQuery?.data;
  const internalUsdConfigQuery = useInternalUsdConfigForToken(
    vaultDetail?.short_token_address,
  );
  const underlyingTokenAddress = useMemo(() => {
    if (
      !vaultDetail?.short_token_address ||
      !internalUsdConfigQuery.isSuccess
    ) {
      return undefined;
    }

    return (
      internalUsdConfigQuery.data?.underlyingTokenAddress ??
      vaultDetail.short_token_address
    );
  }, [
    internalUsdConfigQuery.data?.underlyingTokenAddress,
    internalUsdConfigQuery.isSuccess,
    vaultDetail?.short_token_address,
  ]);
  const underlyingToken = useMemo(() => {
    if (!underlyingTokenAddress) return undefined;
    return (
      coins[underlyingTokenAddress] ??
      coins[underlyingTokenAddress.toLowerCase()]
    );
  }, [coins, underlyingTokenAddress]);
  const restMarketExposure = useMemo(
    () => vaultDetail?.market_exposure ?? [],
    [vaultDetail?.market_exposure],
  );
  const shouldUseChainExposure =
    vaultDetail !== undefined && restMarketExposure.length === 0;
  const { data: hzvConfig, isLoading: isHzvConfigLoading } =
    useHzvConfigByVault(shouldUseChainExposure ? vaultAddress : undefined);

  const exposureAddresses = useMemo(() => {
    const addressSet = new Set<Address>();
    if (restMarketExposure.length > 0) {
      for (const exposure of restMarketExposure) {
        if (!exposure.market_address) continue;
        addressSet.add(normalizeAddress(exposure.market_address));
      }
    } else {
      for (const marketAddress of hzvConfig?.markets ?? []) {
        addressSet.add(normalizeAddress(marketAddress));
      }
    }
    return Array.from(addressSet);
  }, [hzvConfig?.markets, restMarketExposure]);
  const exposureAddressesKey = useMemo(
    () =>
      exposureAddresses
        .map((address) => address.toLowerCase())
        .sort()
        .join(','),
    [exposureAddresses],
  );

  const marketsContextQuery = useQuery({
    queryKey: [
      'hz-sdk',
      'vault-caps-markets-context',
      chainId,
      exposureAddressesKey,
    ],
    enabled: !!hzSdk && !!chainId && exposureAddresses.length > 0,
    queryFn: async () => {
      if (!hzSdk) {
        throw new Error(
          'Vault caps market context query executed before SDK loaded',
        );
      }
      return resolveMarketsInfoData(
        hzSdk,
        queryClient,
        pricesMap,
        exposureAddresses,
      );
    },
    placeholderData: (prev) => prev,
    staleTime: VAULT_CAPS_REFRESH_INTERVAL,
    refetchInterval: VAULT_CAPS_REFRESH_INTERVAL,
    refetchOnWindowFocus: false,
  });
  const {
    marketTokensData: depositMarketTokensData,
    isLoading: isDepositMarketTokensLoading,
  } = useMarketTokensByAddresses({
    marketAddresses: exposureAddresses,
    isDeposit: true,
    enabled: exposureAddresses.length > 0,
  });
  const {
    marketTokensData: withdrawalMarketTokensData,
    isLoading: isWithdrawalMarketTokensLoading,
  } = useMarketTokensByAddresses({
    marketAddresses: exposureAddresses,
    isDeposit: false,
    enabled: exposureAddresses.length > 0,
  });

  const hlvMarketsQuery = useQuery({
    queryKey: [
      'hz-sdk',
      'vault-caps-hlv-markets',
      chainId,
      checksumVaultAddress,
      exposureAddressesKey,
    ],
    enabled:
      !!hzSdk &&
      !!chainId &&
      !!checksumVaultAddress &&
      exposureAddresses.length > 0,
    queryFn: async () => {
      if (!hzSdk || !chainId || !checksumVaultAddress) return [];
      return fetchHlvMarketsForVault({
        hzSdk,
        chainId,
        hlvToken: checksumVaultAddress,
        markets: exposureAddresses,
      });
    },
    placeholderData: (prev) => prev,
    staleTime: VAULT_CAPS_REFRESH_INTERVAL,
    refetchInterval: VAULT_CAPS_REFRESH_INTERVAL,
    refetchOnWindowFocus: false,
  });
  const hlvMarkets = useMemo(
    () => hlvMarketsQuery.data ?? [],
    [hlvMarketsQuery.data],
  );
  const marketExposure = useMemo<MarketExposureItem[] | undefined>(() => {
    if (vaultDetail === undefined) return undefined;
    if (restMarketExposure.length > 0) return restMarketExposure;
    if (isHzvConfigLoading || hlvMarketsQuery.isLoading) return undefined;
    if (!hzvConfig) return [];

    const hlvMarketByAddress = new Map(
      hlvMarkets.map((market) => [market.address.toLowerCase(), market]),
    );
    return hzvConfig.markets.map((marketAddress) => {
      const address = normalizeAddress(marketAddress);
      const hlvMarket = hlvMarketByAddress.get(address.toLowerCase());
      const inst = insts[address] ?? insts[address.toLowerCase()];
      const fallbackMaxCap =
        hzvConfig.maxCapByMarket?.[address] ??
        hzvConfig.maxCapByMarket?.[address.toLowerCase()];

      return {
        market_address: address,
        symbol: inst?.symbol ?? address,
        long_token: hzvConfig.longToken,
        short_token: hzvConfig.shortToken,
        distribution_amount: (hlvMarket?.hzlpBalance ?? 0n).toString(),
        max_cap: (
          hlvMarket?.hlvMaxMarketTokenBalanceUsd ??
          fallbackMaxCap ??
          0n
        ).toString(),
      };
    });
  }, [
    hlvMarkets,
    hlvMarketsQuery.isLoading,
    hzvConfig,
    insts,
    isHzvConfigLoading,
    restMarketExposure,
    vaultDetail,
  ]);
  const uiFeeFactorQuery = useQuery({
    queryKey: ['hz-sdk', 'vault-caps-ui-fee-factor', chainId],
    enabled: !!hzSdk && !!chainId,
    queryFn: async () => {
      if (!hzSdk) return 0n;
      return hzSdk.utils.getUiFeeFactor();
    },
    staleTime: VAULT_CAPS_REFRESH_INTERVAL,
    refetchInterval: VAULT_CAPS_REFRESH_INTERVAL,
    refetchOnWindowFocus: false,
  });
  const depositUiFeeFactor = uiFeeFactorQuery.data ?? 0n;
  const pricesData = useMemo(
    () => ({
      ...pricesMap,
      ...(marketsContextQuery.data?.pricesData ?? {}),
    }),
    [marketsContextQuery.data?.pricesData, pricesMap],
  );

  const underlyingTokenPrice = useMemo(() => {
    const tokenAddress = underlyingToken?.address;
    if (!tokenAddress) return undefined;
    return pricesData[tokenAddress]?.maxPrice;
  }, [pricesData, underlyingToken?.address]);
  const underlyingTokenDecimals = underlyingToken?.decimals;

  const caps = useMemo(() => {
    if (marketExposure === undefined) {
      return {
        remainingDepositCapUsd: undefined,
        remainingWithdrawalCapUsd: undefined,
        remainingDepositCapByMarket: {},
        remainingWithdrawalCapByMarket: {},
      };
    }

    return computeVaultRemainingCaps({
      marketExposure,
      marketsInfoData: marketsContextQuery.data?.marketsInfoData ?? undefined,
      marketTokensData: depositMarketTokensData,
      withdrawalMarketTokensData,
      pricesData,
      depositTokenPrice: underlyingTokenPrice,
      depositTokenDecimals: underlyingTokenDecimals,
      depositUiFeeFactor,
      hlvMarkets,
    });
  }, [
    depositUiFeeFactor,
    hlvMarkets,
    marketExposure,
    depositMarketTokensData,
    marketsContextQuery.data?.marketsInfoData,
    pricesData,
    underlyingTokenDecimals,
    underlyingTokenPrice,
    withdrawalMarketTokensData,
  ]);

  const marketsInfoData = useMemo(() => {
    const data = marketsContextQuery.data?.marketsInfoData;
    if (!data || exposureAddresses.length === 0) return undefined;

    const availableAddresses = new Set(
      Object.keys(data).map((address) => address.toLowerCase()),
    );
    const isComplete = exposureAddresses.every((address) =>
      availableAddresses.has(address.toLowerCase()),
    );
    return isComplete ? data : undefined;
  }, [exposureAddresses, marketsContextQuery.data?.marketsInfoData]);

  const isLoading = useMemo(() => {
    if (!vaultAddress) return false;
    if (
      isVaultDetailLoading ||
      internalUsdConfigQuery.isLoading ||
      (shouldUseChainExposure && isHzvConfigLoading) ||
      marketsContextQuery.isLoading ||
      hlvMarketsQuery.isLoading ||
      uiFeeFactorQuery.isLoading
    ) {
      return true;
    }
    if (
      exposureAddresses.length > 0 &&
      (isDepositMarketTokensLoading || isWithdrawalMarketTokensLoading)
    ) {
      return true;
    }
    return false;
  }, [
    exposureAddresses.length,
    hlvMarketsQuery.isLoading,
    isDepositMarketTokensLoading,
    isWithdrawalMarketTokensLoading,
    isVaultDetailLoading,
    internalUsdConfigQuery.isLoading,
    isHzvConfigLoading,
    marketsContextQuery.isLoading,
    uiFeeFactorQuery.isLoading,
    vaultAddress,
    shouldUseChainExposure,
  ]);

  return {
    ...caps,
    marketExposure,
    marketsInfoData,
    isLoading,
  };
}
