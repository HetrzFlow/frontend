import { useMemo } from 'react';
import { getAddress } from 'viem';
import { useConnectionStatus } from '@/common/chainClient/hooks';
import {
  DYNAMIC_DATA_CACHE_TIME,
  STATIC_CONFIG_CACHE_TIME,
} from '@/common/constants/timeConstants';
import {
  useHzvValueByVault,
  useHlvTokenBalance,
  useVaultRemainingCaps,
  useVaultDetail,
  type VaultDetailQueryItem,
  type VaultDetailQueryData,
} from '@/queries/bsc/vaults';
import type { VaultItem } from '@/services/rest/vaults';
import { useHlvWalletBalance } from '@/stores/synthetics/marketTokens/selectors';
import {
  calculateVaultRestHoldingsUsd,
  getByAddress,
  getVaultListItem,
  parseRawValue,
  useHzvValuesData,
  useVaultsListData,
  useVaultsMarketTokenAddresses,
  useViewedVaultAddresses,
} from './shared';

type VaultDepositCapLike = Pick<VaultItem, 'tvl_cap' | 'tvl'>;

export function useVaultDetailData(
  vaultAddress: string | undefined,
  options?: {
    staleTime?: number;
    refetchInterval?: number | false;
    initialData?: VaultDetailQueryData;
    includeWalletAddress?: boolean;
  },
): VaultDetailQueryItem | undefined {
  const staleTime = options?.staleTime ?? STATIC_CONFIG_CACHE_TIME;
  const refetchInterval = options?.refetchInterval ?? STATIC_CONFIG_CACHE_TIME;
  const { data } = useVaultDetail(vaultAddress ?? '', {
    staleTime,
    refetchInterval,
    initialData: options?.initialData,
    includeWalletAddress: options?.includeWalletAddress,
  });
  return data?.data;
}

export function useVaultDepositCapMetrics(
  vaultAddress: string | undefined,
  options?: {
    fallbackVault?: Partial<VaultDepositCapLike> | null;
  },
): {
  tvlUsd: bigint | undefined;
  vaultCapLimitUsd: bigint | undefined;
  effectiveTotalCapUsd: bigint | undefined;
  depositedUsd: bigint | undefined;
  remainingDepositCapUsd: bigint | undefined;
  remainingWithdrawalCapUsd: bigint | undefined;
  fillPercent: number;
  isRemainingCapsLoading: boolean;
  isLoading: boolean;
} {
  const { fallbackVault } = options ?? {};
  const queryVaultAddress = fallbackVault ? undefined : vaultAddress;
  const batchHzvValues = useHzvValuesData({ enabled: !!fallbackVault });
  const batchHzvValue = useMemo(
    () =>
      vaultAddress ? getByAddress(batchHzvValues, vaultAddress) : undefined,
    [batchHzvValues, vaultAddress],
  );
  const vaultDetail = useVaultDetailData(queryVaultAddress, {
    includeWalletAddress: false,
  });
  const vaultRemainingCaps = useVaultRemainingCaps(queryVaultAddress);
  const { data: queriedHzvValue } = useHzvValueByVault(queryVaultAddress, {
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const hzvValue = queriedHzvValue ?? batchHzvValue;

  const restTvlUsd = useMemo(
    () => parseRawValue(vaultDetail?.tvl ?? fallbackVault?.tvl),
    [fallbackVault?.tvl, vaultDetail?.tvl],
  );
  const vaultCapLimitUsd = useMemo(
    () => {
      const configuredCap = parseRawValue(
        vaultDetail?.tvl_cap ?? fallbackVault?.tvl_cap,
      );
      if (configuredCap !== undefined && configuredCap > 0n) {
        return configuredCap;
      }
      if (!vaultRemainingCaps.marketExposure?.length) return configuredCap;
      return vaultRemainingCaps.marketExposure.reduce(
        (sum, exposure) => sum + (parseRawValue(exposure.max_cap) ?? 0n),
        0n,
      );
    },
    [
      fallbackVault?.tvl_cap,
      vaultDetail?.tvl_cap,
      vaultRemainingCaps.marketExposure,
    ],
  );

  const tvlUsd = useMemo(
    () => hzvValue?.hlvValue ?? restTvlUsd,
    [hzvValue?.hlvValue, restTvlUsd],
  );
  const effectiveTotalCapUsd = vaultCapLimitUsd;
  const depositedUsd = useMemo(
    () => hzvValue?.hlvValueMax ?? tvlUsd,
    [hzvValue?.hlvValueMax, tvlUsd],
  );
  const remainingDepositCapUsd = vaultRemainingCaps.remainingDepositCapUsd;
  const remainingWithdrawalCapUsd =
    vaultRemainingCaps.remainingWithdrawalCapUsd;

  const fillPercent = useMemo(() => {
    if (
      effectiveTotalCapUsd === undefined ||
      effectiveTotalCapUsd <= 0n ||
      depositedUsd === undefined
    ) {
      return 0;
    }
    const rawPercent =
      Number((depositedUsd * 10000n) / effectiveTotalCapUsd) / 100;
    return Math.max(0, Math.min(100, rawPercent));
  }, [depositedUsd, effectiveTotalCapUsd]);

  return {
    tvlUsd,
    vaultCapLimitUsd,
    effectiveTotalCapUsd,
    depositedUsd,
    remainingDepositCapUsd,
    remainingWithdrawalCapUsd,
    fillPercent,
    isRemainingCapsLoading: vaultRemainingCaps.isLoading,
    isLoading:
      depositedUsd === undefined ||
      effectiveTotalCapUsd === undefined ||
      remainingDepositCapUsd === undefined,
  };
}

export function useVaultHoldingsUsd(
  vaultAddress: string | undefined,
  fallbackVault?: Partial<
    Pick<VaultItem, 'tokens_balance' | 'supply' | 'tvl'>
  > | null,
): bigint | undefined {
  const status = useConnectionStatus();
  const queryVaultAddress = fallbackVault ? undefined : vaultAddress;
  const batchHzvValues = useHzvValuesData({ enabled: !!fallbackVault });
  const batchHzvValue = useMemo(
    () =>
      vaultAddress ? getByAddress(batchHzvValues, vaultAddress) : undefined,
    [batchHzvValues, vaultAddress],
  );
  const { data } = useHzvValueByVault(queryVaultAddress, {
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const vaultDetail = useVaultDetailData(queryVaultAddress);
  const vaultMarketAddresses = useVaultsMarketTokenAddresses();
  const viewedVaultAddresses = useViewedVaultAddresses();
  const snapshotHlvWalletBalance = useHlvWalletBalance(
    vaultAddress ? getAddress(vaultAddress) : undefined,
    {
      enabled: !!fallbackVault,
      marketAddresses: vaultMarketAddresses,
      vaultAddresses: viewedVaultAddresses,
    },
  );
  const { data: hlvBalanceData } = useHlvTokenBalance(vaultAddress, {
    enabled: !fallbackVault,
  });
  const hlvWalletBalance = snapshotHlvWalletBalance ?? hlvBalanceData?.balance;
  const tokenPrice = data?.hlvTokenPrice ?? batchHzvValue?.hlvTokenPrice;

  const chainHoldings = useMemo(() => {
    if (tokenPrice === undefined || hlvWalletBalance === undefined)
      return undefined;
    return (hlvWalletBalance * tokenPrice) / 10n ** 18n;
  }, [hlvWalletBalance, tokenPrice]);

  const restHoldings = useMemo(
    () => calculateVaultRestHoldingsUsd(fallbackVault ?? vaultDetail),
    [fallbackVault, vaultDetail],
  );

  return useMemo(() => {
    if (status === 'disconnected') return 0n;
    return chainHoldings ?? restHoldings;
  }, [chainHoldings, restHoldings, status]);
}

export function useVaultTvlUsd(
  vaultAddress: string | undefined,
  options?: {
    staleTime?: number;
    refetchInterval?: number | false;
    initialData?: VaultDetailQueryData;
  },
): bigint | undefined {
  const staleTime = options?.staleTime ?? DYNAMIC_DATA_CACHE_TIME;
  const refetchInterval = options?.refetchInterval ?? DYNAMIC_DATA_CACHE_TIME;
  const { data } = useHzvValueByVault(vaultAddress, {
    staleTime,
    refetchInterval,
  });
  const vaultDetail = useVaultDetailData(vaultAddress, {
    initialData: options?.initialData,
    includeWalletAddress: false,
  });

  return useMemo(() => {
    const chainValue = data?.hlvValue;
    const backendValue = parseRawValue(vaultDetail?.tvl);
    return chainValue ?? backendValue;
  }, [data?.hlvValue, vaultDetail?.tvl]);
}

export function useVaultTotalEarnedFeesUsd(
  vaultAddress: string | undefined,
  options?: {
    staleTime?: number;
    refetchInterval?: number | false;
  },
): bigint | undefined {
  const vaultsList = useVaultsListData();
  const listVault = useMemo(
    () => getVaultListItem(vaultsList, vaultAddress),
    [vaultAddress, vaultsList],
  );
  const vaultDetail = useVaultDetailData(vaultAddress, {
    staleTime: options?.staleTime ?? DYNAMIC_DATA_CACHE_TIME,
    refetchInterval: options?.refetchInterval ?? DYNAMIC_DATA_CACHE_TIME,
    includeWalletAddress: false,
  });
  return useMemo(() => {
    const raw =
      vaultDetail?.total_earned_fees_usd ?? listVault?.total_earned_fees_usd;
    if (raw === undefined) return undefined;
    try {
      return BigInt(raw);
    } catch {
      return undefined;
    }
  }, [listVault?.total_earned_fees_usd, vaultDetail?.total_earned_fees_usd]);
}
