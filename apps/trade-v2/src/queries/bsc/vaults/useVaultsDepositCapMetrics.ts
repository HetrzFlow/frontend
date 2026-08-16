import { useMemo } from 'react';
import { getAddress, type Address } from 'viem';
import { useQuery, useQueryClient } from '@repo/lib/queryClient';
import { useHzSdk } from '@/common/chainClient/hooks';
import { useInstStore } from '@/common/stores/instStore';
import { usePriceStore } from '@/common/stores/priceStore';
import type { VaultItem } from '@/services/rest/vaults';
import { useMarketTokensByAddresses } from '@/stores/synthetics/marketTokens/hooks';
import { computeVaultRemainingCaps } from './caps';
import { fetchHlvMarketsForVaults, resolveMarketsInfoData } from './helpers';
import { useInternalUsdConfigsForTokens } from './useInternalUsdConfig';

const VAULT_CAPS_REFRESH_INTERVAL = 10_000;

type VaultDepositCapInput = Pick<
  VaultItem,
  'vault_address' | 'tvl' | 'tvl_cap' | 'market_exposure'
>;

export type VaultDepositCapMetric = {
  depositCapacityUsedUsd: bigint | undefined;
  effectiveTotalCapUsd: bigint | undefined;
};

export type VaultDepositCapMetricsMap = Record<string, VaultDepositCapMetric>;

function normalizeAddress(address: string): Address {
  try {
    return getAddress(address) as Address;
  } catch {
    return address as Address;
  }
}

function parseBigInt(value: string): bigint | undefined {
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

export function useVaultsDepositCapMetrics(
  vaults: VaultDepositCapInput[],
): VaultDepositCapMetricsMap {
  const hzSdk = useHzSdk();
  const queryClient = useQueryClient();
  const chainId = hzSdk?.chainId;
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const coins = useInstStore((state) => state.getCoins());

  const vaultRequests = useMemo(
    () =>
      vaults.map((vault) => ({
        hlvToken: normalizeAddress(vault.vault_address),
        markets: Array.from(
          new Set(
            vault.market_exposure.map((exposure) =>
              normalizeAddress(exposure.market_address),
            ),
          ),
        ),
      })),
    [vaults],
  );
  const exposureAddresses = useMemo(
    () =>
      Array.from(
        new Set(
          vaultRequests.flatMap(({ markets }) =>
            markets.map((address) => address.toLowerCase()),
          ),
        ),
      )
        .sort()
        .map(normalizeAddress),
    [vaultRequests],
  );
  const exposureAddressesKey = useMemo(
    () => exposureAddresses.map((address) => address.toLowerCase()).join(','),
    [exposureAddresses],
  );
  const vaultRequestsKey = useMemo(
    () =>
      vaultRequests
        .map(
          ({ hlvToken, markets }) =>
            `${hlvToken.toLowerCase()}:${markets
              .map((address) => address.toLowerCase())
              .sort()
              .join(',')}`,
        )
        .sort()
        .join('|'),
    [vaultRequests],
  );

  const marketsContextQuery = useQuery({
    queryKey: [
      'hz-sdk',
      'vaults-deposit-caps-markets-context',
      chainId,
      exposureAddressesKey,
    ],
    enabled: !!hzSdk && !!chainId && exposureAddresses.length > 0,
    queryFn: async () => {
      if (!hzSdk) {
        throw new Error('Vault deposit caps query executed before SDK loaded');
      }
      return resolveMarketsInfoData(
        hzSdk,
        queryClient,
        pricesMap,
        exposureAddresses,
      );
    },
    placeholderData: (previous) => previous,
    staleTime: VAULT_CAPS_REFRESH_INTERVAL,
    refetchInterval: VAULT_CAPS_REFRESH_INTERVAL,
    refetchOnWindowFocus: false,
  });
  const { marketTokensData } = useMarketTokensByAddresses({
    marketAddresses: exposureAddresses,
    isDeposit: true,
    enabled: exposureAddresses.length > 0,
  });
  const hlvMarketsQuery = useQuery({
    queryKey: [
      'hz-sdk',
      'vaults-deposit-caps-hlv-markets',
      chainId,
      vaultRequestsKey,
    ],
    enabled: !!hzSdk && !!chainId && exposureAddresses.length > 0,
    queryFn: async () => {
      if (!hzSdk || !chainId) return {};
      return fetchHlvMarketsForVaults({
        hzSdk,
        chainId,
        vaults: vaultRequests,
      });
    },
    placeholderData: (previous) => previous,
    staleTime: VAULT_CAPS_REFRESH_INTERVAL,
    refetchInterval: VAULT_CAPS_REFRESH_INTERVAL,
    refetchOnWindowFocus: false,
  });
  const uiFeeFactorQuery = useQuery({
    queryKey: ['hz-sdk', 'vault-caps-ui-fee-factor', chainId],
    enabled: !!hzSdk && !!chainId && exposureAddresses.length > 0,
    queryFn: async () => {
      if (!hzSdk) return 0n;
      return hzSdk.utils.getUiFeeFactor();
    },
    staleTime: VAULT_CAPS_REFRESH_INTERVAL,
    refetchInterval: VAULT_CAPS_REFRESH_INTERVAL,
    refetchOnWindowFocus: false,
  });

  const pricesData = useMemo(
    () => ({
      ...pricesMap,
      ...(marketsContextQuery.data?.pricesData ?? {}),
    }),
    [marketsContextQuery.data?.pricesData, pricesMap],
  );
  const collateralTokenAddresses = useMemo(() => {
    const marketsInfoData = marketsContextQuery.data?.marketsInfoData;
    if (!marketsInfoData) return [];

    return vaults.flatMap((vault) => {
      const marketInfo = vault.market_exposure
        .map(
          (exposure) =>
            Object.entries(marketsInfoData).find(
              ([address]) =>
                address.toLowerCase() === exposure.market_address.toLowerCase(),
            )?.[1],
        )
        .find(Boolean);
      const collateralTokenAddress =
        marketInfo?.shortTokenAddress ?? marketInfo?.longTokenAddress;
      return collateralTokenAddress ? [collateralTokenAddress] : [];
    });
  }, [marketsContextQuery.data?.marketsInfoData, vaults]);
  const internalUsdConfigsQuery = useInternalUsdConfigsForTokens(
    collateralTokenAddresses,
  );

  return useMemo(() => {
    const result: VaultDepositCapMetricsMap = {};
    for (const vault of vaults) {
      const vaultAddress = normalizeAddress(vault.vault_address);
      const effectiveTotalCapUsd = parseBigInt(vault.tvl_cap);
      const restDepositedUsd = parseBigInt(vault.tvl);
      const marketInfo = vault.market_exposure
        .map(
          (exposure) =>
            Object.entries(
              marketsContextQuery.data?.marketsInfoData ?? {},
            ).find(
              ([address]) =>
                address.toLowerCase() === exposure.market_address.toLowerCase(),
            )?.[1],
        )
        .find(Boolean);
      const collateralTokenAddress =
        marketInfo?.shortTokenAddress ?? marketInfo?.longTokenAddress;
      const internalUsdConfig = collateralTokenAddress
        ? internalUsdConfigsQuery.data?.[collateralTokenAddress.toLowerCase()]
        : undefined;
      const fallbackTokenAddress =
        internalUsdConfigsQuery.isSuccess && collateralTokenAddress
          ? (internalUsdConfig?.underlyingTokenAddress ??
            collateralTokenAddress)
          : undefined;
      const fallbackToken = fallbackTokenAddress
        ? (coins[fallbackTokenAddress] ??
          coins[fallbackTokenAddress.toLowerCase()])
        : undefined;
      const fallbackTokenPrice = fallbackTokenAddress
        ? pricesData[fallbackTokenAddress]?.maxPrice
        : undefined;
      const remainingDepositCapUsd = computeVaultRemainingCaps({
        marketExposure: vault.market_exposure,
        marketsInfoData: marketsContextQuery.data?.marketsInfoData ?? undefined,
        marketTokensData,
        pricesData,
        depositTokenPrice: fallbackTokenPrice,
        depositTokenDecimals: fallbackToken?.decimals,
        depositUiFeeFactor: uiFeeFactorQuery.data ?? 0n,
        hlvMarkets: hlvMarketsQuery.data?.[vaultAddress] ?? [],
      }).remainingDepositCapUsd;
      const chainDepositCapacityUsedUsd =
        effectiveTotalCapUsd === undefined ||
        remainingDepositCapUsd === undefined
          ? undefined
          : effectiveTotalCapUsd > remainingDepositCapUsd
            ? effectiveTotalCapUsd - remainingDepositCapUsd
            : 0n;

      result[vault.vault_address.toLowerCase()] = {
        depositCapacityUsedUsd: chainDepositCapacityUsedUsd ?? restDepositedUsd,
        effectiveTotalCapUsd,
      };
    }
    return result;
  }, [
    hlvMarketsQuery.data,
    marketTokensData,
    marketsContextQuery.data?.marketsInfoData,
    pricesData,
    coins,
    internalUsdConfigsQuery.data,
    internalUsdConfigsQuery.isSuccess,
    uiFeeFactorQuery.data,
    vaults,
  ]);
}
