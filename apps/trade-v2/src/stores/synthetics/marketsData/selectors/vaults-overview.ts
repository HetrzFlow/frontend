import { useMemo } from 'react';
import { getAddress, type Address } from 'viem';
import { usePrivy } from '@/common/chainClient';
import { useConnectionStatus } from '@/common/chainClient/hooks';
import type { VaultItem, fetchVaultsList } from '@/services/rest/vaults';
import {
  useHlvData,
  useMarketAndHlvTokensData,
} from '@/stores/synthetics/marketTokens/selectors';
import {
  calculateVaultRestHoldingsUsd,
  useHzvValuesData,
  useVaultsListData,
  useVaultsGlobalStats,
  useVaultsMarketTokenAddresses,
  useViewedVaultAddresses,
} from './shared';

type VaultsListInitialData = Awaited<
  ReturnType<typeof fetchVaultsList>
>['data'];

type RefetchOptions = {
  refetchInterval?: number | false;
};

function useVaultsOverviewTotalTvlUsd(
  initialData?: VaultsListInitialData,
): bigint | undefined {
  const marketAddresses = useVaultsMarketTokenAddresses();
  const vaultAddresses = useViewedVaultAddresses();
  const hzvValues = useHzvValuesData({ marketAddresses, vaultAddresses });
  const viewedVaultsList = useVaultsOverviewList(initialData);
  const vaultsList = useVaultsListData(initialData);
  const vaultsGlobalStats = useVaultsGlobalStats(initialData);

  const restTotal = useMemo(() => {
    if (vaultsGlobalStats?.total_tvl !== undefined) {
      try {
        return BigInt(vaultsGlobalStats.total_tvl);
      } catch {
        return undefined;
      }
    }
    if (!vaultsList) return undefined;
    let hasData = false;
    const total = vaultsList.reduce((sum, v) => {
      if (!v.is_view) return sum;
      if ((v.market_exposure?.length ?? 0) === 0) return sum;
      if (v.tvl === undefined) return sum;
      try {
        const tvl = BigInt(v.tvl);
        hasData = true;
        return sum + tvl;
      } catch {
        return sum;
      }
    }, 0n);
    return hasData ? total : undefined;
  }, [vaultsGlobalStats?.total_tvl, vaultsList]);

  const chainTotal = useMemo(() => {
    if (!hzvValues || !viewedVaultsList) return undefined;
    const allowed = new Set(
      viewedVaultsList.map((v) => v.vault_address.toLowerCase()),
    );
    const viewedHzvValues = Object.entries(hzvValues).flatMap(
      ([addr, value]) => (allowed.has(addr.toLowerCase()) ? [value] : []),
    );
    if (
      viewedHzvValues.length === 0 ||
      viewedHzvValues.length !== allowed.size
    )
      return undefined;
    let total = 0n;
    for (const value of viewedHzvValues) {
      if (value.hlvValue === undefined) return undefined;
      total += value.hlvValue;
    }
    return total;
  }, [hzvValues, viewedVaultsList]);

  return chainTotal ?? restTotal;
}

function useVaultsOverviewTotalEarnedFeesUsd(
  initialData?: VaultsListInitialData,
): bigint | undefined {
  const vaultsList = useVaultsListData(initialData);
  const vaultsGlobalStats = useVaultsGlobalStats(initialData);
  return useMemo(() => {
    if (vaultsGlobalStats?.total_earned_fees !== undefined) {
      try {
        return BigInt(vaultsGlobalStats.total_earned_fees);
      } catch {
        return undefined;
      }
    }
    if (!vaultsList) return undefined;
    let hasData = false;
    const total = vaultsList.reduce((sum, v) => {
      if (!v.is_view) return sum;
      if ((v.market_exposure?.length ?? 0) === 0) return sum;
      const raw = v.total_earned_fees_usd;
      if (raw === undefined) return sum;
      try {
        const earnedFees = BigInt(raw);
        hasData = true;
        return sum + earnedFees;
      } catch {
        return sum;
      }
    }, 0n);
    return hasData ? total : undefined;
  }, [vaultsGlobalStats?.total_earned_fees, vaultsList]);
}

export function useVaultsOverviewYourDepositsUsd(
  initialData?: VaultsListInitialData,
  options: RefetchOptions = {},
): bigint | undefined {
  const status = useConnectionStatus();
  const marketAddresses = useVaultsMarketTokenAddresses();
  const vaultAddresses = useViewedVaultAddresses();
  const tokensView = useMarketAndHlvTokensData({
    withHlv: true,
    marketAddresses,
    vaultAddresses,
    refreshInterval:
      typeof options.refetchInterval === 'number'
        ? options.refetchInterval
        : undefined,
  });
  const viewedVaultsList = useVaultsOverviewList(initialData, options);

  const chainTotal = useMemo(() => {
    if (!tokensView || !viewedVaultsList) return undefined;
    const allowedVaultAddresses = new Set(
      viewedVaultsList.map((v) => v.vault_address.toLowerCase()),
    );
    const viewedTokensView = Object.values(tokensView).filter((token) =>
      allowedVaultAddresses.has(String(token.address).toLowerCase()),
    );
    if (!viewedTokensView.length) return undefined;
    if (viewedTokensView.length !== allowedVaultAddresses.size)
      return undefined;

    let total = 0n;
    for (const token of viewedTokensView) {
      const { balance, prices, decimals } = token;
      if (balance === undefined || !prices?.minPrice) return undefined;
      total += (balance * prices.minPrice) / 10n ** BigInt(decimals);
    }

    return total;
  }, [tokensView, viewedVaultsList]);

  const restTotal = useMemo(() => {
    if (!viewedVaultsList?.length) return undefined;
    let hasData = false;
    const total = viewedVaultsList.reduce((sum, v) => {
      const holdings = calculateVaultRestHoldingsUsd(v);
      if (holdings === undefined) return sum;
      hasData = true;
      return sum + holdings;
    }, 0n);
    return hasData ? total : undefined;
  }, [viewedVaultsList]);

  return useMemo(() => {
    if (status === 'unknown') return undefined;
    if (status === 'disconnected') return 0n;
    return chainTotal ?? restTotal;
  }, [chainTotal, restTotal, status]);
}

function useVaultsOverviewYourUnrealizedPnlUsd(
  initialData?: VaultsListInitialData,
): bigint | undefined {
  const status = useConnectionStatus();
  const { ready } = usePrivy();
  const vaultsList = useVaultsListData(initialData);
  const viewedVaultsList = useMemo(() => {
    if (status === 'connected' && !ready) return undefined;
    if (!vaultsList) return undefined;
    return vaultsList.filter((vault) => vault.is_view);
  }, [ready, status, vaultsList]);

  return useMemo(() => {
    if (status === 'unknown') return undefined;
    if (status === 'disconnected') return 0n;
    if (!viewedVaultsList) return undefined;
    let hasUserData = false;
    const total = viewedVaultsList.reduce((sum, v) => {
      try {
        const unrealizedPnl = BigInt(v.unrealized_pnl);
        hasUserData = true;
        return sum + unrealizedPnl;
      } catch {
        return sum;
      }
    }, 0n);
    return hasUserData ? total : undefined;
  }, [status, viewedVaultsList]);
}

export function useVaultsOverviewFields(initialData?: VaultsListInitialData): {
  totalTvl: bigint | undefined;
  totalEarnedFees: bigint | undefined;
  yourDeposits: bigint | undefined;
  yourUnrealizedPnl: bigint | undefined;
} {
  const totalTvl = useVaultsOverviewTotalTvlUsd(initialData);
  const totalEarnedFees = useVaultsOverviewTotalEarnedFeesUsd(initialData);
  const yourDeposits = useVaultsOverviewYourDepositsUsd(initialData);
  const yourUnrealizedPnl = useVaultsOverviewYourUnrealizedPnlUsd(initialData);
  return { totalTvl, totalEarnedFees, yourDeposits, yourUnrealizedPnl };
}

export function useVaultsOverviewList(
  initialData?: VaultsListInitialData,
  options: RefetchOptions = {},
  allowedVaultAddresses?: readonly string[],
): VaultItem[] | undefined {
  const vaultsList = useVaultsListData(initialData, options);
  const allowedVaultAddressSet = useMemo(
    () =>
      allowedVaultAddresses
        ? new Set(allowedVaultAddresses.map((address) => address.toLowerCase()))
        : undefined,
    [allowedVaultAddresses],
  );
  const viewedVaultsList = useMemo(
    () =>
      vaultsList?.filter(
        (vault) =>
          vault.is_view &&
          (!allowedVaultAddressSet ||
            allowedVaultAddressSet.has(vault.vault_address.toLowerCase())),
      ),
    [allowedVaultAddressSet, vaultsList],
  );
  const marketAddresses =
    useVaultsMarketTokenAddresses(allowedVaultAddresses);
  const vaultAddresses = useViewedVaultAddresses(allowedVaultAddresses);
  const hlvData = useHlvData({ marketAddresses, vaultAddresses });
  return useMemo(() => {
    if (!viewedVaultsList) return undefined;
    if (!hlvData) return viewedVaultsList;

    return viewedVaultsList.map((v) => {
      const addr = getAddress(v.vault_address) as Address;
      const chainIsDisabled = hlvData[addr]?.isDisabled;
      if (chainIsDisabled === undefined) return v;
      return {
        ...v,
        is_disabled: chainIsDisabled,
        isDisabled: chainIsDisabled,
      };
    });
  }, [hlvData, viewedVaultsList]);
}
