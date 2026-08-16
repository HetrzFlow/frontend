'use client';

import { useMemo } from 'react';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { formatUnits } from 'viem';
import { HZV_TOKEN_DECIMALS, useInstStore } from '@/common';
import { useHzSdk } from '@/common/chainClient/hooks';
import type { ActivityItem } from '@/common/services/rest/activity';
import { useVaultsDepositCapMetrics } from '@/queries/bsc/vaults';
import type { HzvConfig } from '@/queries/bsc/vaults/types';
import type {
  GenesisUserAssetRow,
  GenesisOverview,
  GenesisMeritsSeason,
  GenesisUserPosition,
  GenesisVaultConfig,
} from '@/services/rest/genesis';
import type { VaultItem } from '@/services/rest/vaults';
import { GENESIS_ASSETS, type GenesisAssetSymbol } from '../lib/constants';
import {
  mergeGenesisOverviewIntoConfig,
  mergeGenesisSeasonIntoConfig,
  sharesRawToUsd,
} from '../lib/genesisOverview';
import { selectGenesisVaults } from '../lib/genesisVaultToken';

const ZERO = '0';
const formatRaw = (value: string | bigint | undefined, decimals: number) => {
  try {
    return formatUnits(BigInt(value ?? 0), decimals);
  } catch {
    return ZERO;
  }
};

const formatUsdRawAbs = (value: string | undefined) => {
  if (!value) return ZERO;
  try {
    const raw = BigInt(value);
    return formatUnits(raw < 0n ? -raw : raw, USD_DECIMALS);
  } catch {
    return ZERO;
  }
};

const emptyUserAsset = (
  symbol: GenesisUserAssetRow['symbol'],
): GenesisUserAssetRow => ({
  symbol,
  deposited: ZERO,
  maturedDeposits: ZERO,
  unmaturedDeposits: ZERO,
  unmaturedShares: ZERO,
  earnedRewards: ZERO,
  maturedRewards: ZERO,
  claimable: ZERO,
  claimed: ZERO,
  unrealisedPnl: ZERO,
  hzvBalance: ZERO,
  rewardsLocked: ZERO,
});

export const useGenesisVaultData = ({
  config,
  overview,
  position,
  vaults,
  activities,
  hzvConfigs,
  meritsSeason,
  seasonNowMs,
}: {
  config?: GenesisVaultConfig;
  overview?: GenesisOverview;
  position?: GenesisUserPosition;
  vaults?: VaultItem[];
  activities?: ActivityItem[];
  hzvConfigs?: Record<string, HzvConfig>;
  meritsSeason?: GenesisMeritsSeason;
  seasonNowMs?: number;
}) => {
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());
  const selectedVaults = useMemo(
    () =>
      selectGenesisVaults(vaults, {
        chainId: hzSdk?.chainId,
        hzvConfigs,
        coins,
        allowIndexFallback: false,
      }),
    [coins, hzSdk?.chainId, hzvConfigs, vaults],
  );
  const selectedVaultItems = useMemo(
    () => selectedVaults.map(({ vault }) => vault),
    [selectedVaults],
  );
  const depositCapMetrics = useVaultsDepositCapMetrics(selectedVaultItems);
  return useMemo(() => {
    const seasonConfig = mergeGenesisSeasonIntoConfig(
      config,
      meritsSeason,
      seasonNowMs,
    );
    const configWithOverview = mergeGenesisOverviewIntoConfig(
      seasonConfig,
      overview,
    );

    if (!selectedVaults.length) {
      return {
        config: configWithOverview,
        position,
        isProgressReady: vaults !== undefined,
        isPositionValuationReady: false,
      };
    }

    const assets = selectedVaults.map(({ symbol, vault }) => {
      const depositCapMetric =
        depositCapMetrics[vault.vault_address.toLowerCase()];
      return {
        symbol,
        vaultAddress: vault.vault_address,
        vaultName: vault.vault_name,
        capToken: formatRaw(
          depositCapMetric?.effectiveTotalCapUsd ?? vault.tvl_cap,
          USD_DECIMALS,
        ),
        depositedToken: formatRaw(
          depositCapMetric?.depositCapacityUsedUsd ?? vault.tvl,
          USD_DECIMALS,
        ),
        meritsPoolUsd: formatRaw(vault.tvl, USD_DECIMALS),
      };
    });
    const totalCap = selectedVaultItems.reduce((sum, vault) => {
      const metric = depositCapMetrics[vault.vault_address.toLowerCase()];
      return sum + (metric?.effectiveTotalCapUsd ?? BigInt(vault.tvl_cap));
    }, 0n);
    const totalDeposited = selectedVaultItems.reduce((sum, vault) => {
      const metric = depositCapMetrics[vault.vault_address.toLowerCase()];
      return sum + (metric?.depositCapacityUsedUsd ?? BigInt(vault.tvl));
    }, 0n);
    const totalDepositedFormatted = formatUnits(totalDeposited, USD_DECIMALS);
    const totalMeritsPoolUsd = selectedVaultItems.reduce(
      (sum, vault) => sum + BigInt(vault.tvl),
      0n,
    );

    const adaptedConfig: GenesisVaultConfig | undefined = configWithOverview
      ? {
          ...configWithOverview,
          capToken: formatUnits(totalCap, USD_DECIMALS),
          depositedToken: totalDepositedFormatted,
          meritsPoolUsd: formatUnits(totalMeritsPoolUsd, USD_DECIMALS),
          assets,
        }
      : undefined;

    const perAsset = selectedVaults.map(({ symbol, vault }) => {
      const vaultAddress = vault.vault_address.toLowerCase();
      const base =
        position?.perAsset.find(
          (item) => item.vaultAddress?.toLowerCase() === vaultAddress,
        ) ??
        position?.perAsset.find(
          (item) => !item.vaultAddress && item.symbol === symbol,
        ) ??
        emptyUserAsset(symbol);
      const deposited =
        sharesRawToUsd({
          sharesRaw: base.totalDepositsSharesRaw,
          supply: vault.supply,
          tvl: vault.tvl,
        }) ??
        sharesRawToUsd({
          sharesRaw: vault.tokens_balance,
          supply: vault.supply,
          tvl: vault.tvl,
        }) ??
        ZERO;
      const maturedDeposits =
        sharesRawToUsd({
          sharesRaw: base.maturedDepositsSharesRaw,
          supply: vault.supply,
          tvl: vault.tvl,
        }) ?? base.maturedDeposits;
      const unmaturedDeposits =
        sharesRawToUsd({
          sharesRaw: base.unmaturedDepositsSharesRaw,
          supply: vault.supply,
          tvl: vault.tvl,
        }) ??
        String(
          Math.max(0, Number(deposited) - Number(maturedDeposits || ZERO)),
        );
      const unmaturedShares =
        base.unmaturedDepositsSharesRaw !== undefined
          ? formatRaw(base.unmaturedDepositsSharesRaw, HZV_TOKEN_DECIMALS)
          : base.unmaturedShares;
      const immatureDepositNumber = Number(unmaturedDeposits);
      const rewardsLocked =
        immatureDepositNumber *
        (Number(config?.apr ?? 0) / 100 / 365) *
        Number(meritsSeason?.durationDays ?? 0);

      return {
        ...base,
        symbol,
        vaultAddress: vault.vault_address,
        vaultName: vault.vault_name,
        deposited,
        maturedDeposits,
        unmaturedDeposits,
        unmaturedShares,
        earnedRewards:
          base.earnedRewardsRaw !== undefined
            ? formatRaw(base.earnedRewardsRaw, USD_DECIMALS)
            : base.earnedRewards,
        maturedRewards:
          base.maturedRewardsRaw !== undefined
            ? formatRaw(base.maturedRewardsRaw, USD_DECIMALS)
            : base.maturedRewards,
        claimable:
          base.maturedRewardsRaw !== undefined
            ? formatRaw(base.maturedRewardsRaw, USD_DECIMALS)
            : base.claimable,
        claimed: ZERO,
        unrealisedPnl: formatRaw(vault.unrealized_pnl, USD_DECIMALS),
        hzvBalance: formatRaw(vault.tokens_balance, HZV_TOKEN_DECIMALS),
        totalDepositsShares:
          base.totalDepositsSharesRaw !== undefined
            ? formatRaw(base.totalDepositsSharesRaw, HZV_TOKEN_DECIMALS)
            : formatRaw(vault.tokens_balance, HZV_TOKEN_DECIMALS),
        rewardsLocked: String(rewardsLocked),
      };
    });
    const totalDeposits = perAsset.reduce(
      (sum, item) => sum + Number(item.deposited || 0),
      0,
    );
    const totalUnrealisedPnl = perAsset.reduce(
      (sum, item) => sum + Number(item.unrealisedPnl || 0),
      0,
    );
    const totalMaturedDeposits = perAsset.reduce(
      (sum, item) => sum + Number(item.maturedDeposits || 0),
      0,
    );
    const totalClaimableCash = perAsset.reduce(
      (sum, item) => sum + Number(item.claimable || 0),
      0,
    );
    const predepositVaultSymbols = new Map(
      selectedVaults.map(({ symbol, vault }) => [
        vault.vault_address.toLowerCase(),
        symbol,
      ]),
    );
    const mappedActivities = activities?.flatMap((activity) => {
      const directMarket = activity.market_address?.toLowerCase();
      const claimMarket = activity.claim_details
        ?.find((detail) =>
          detail.market
            ? predepositVaultSymbols.has(detail.market.toLowerCase())
            : false,
        )
        ?.market?.toLowerCase();
      const market =
        directMarket && predepositVaultSymbols.has(directMarket)
          ? directMarket
          : claimMarket;
      const vaultSymbol =
        market === undefined ? undefined : predepositVaultSymbols.get(market);
      const isVaultAction =
        activity.action_type === 'vault' &&
        (activity.action === 'deposit' ||
          activity.action === 'withdraw' ||
          activity.action === 'withdrawal');
      const isClaim =
        activity.action_type === 'claim' && vaultSymbol !== undefined;
      if ((!isVaultAction || vaultSymbol === undefined) && !isClaim) return [];

      const symbolFromApi = activity.symbol?.toUpperCase();
      const symbol = GENESIS_ASSETS.includes(
        symbolFromApi as GenesisAssetSymbol,
      )
        ? (symbolFromApi as GenesisAssetSymbol)
        : vaultSymbol;
      if (!symbol) return [];

      return [
        {
          id: `${activity.tx_hash}-${activity.timestamp}-${activity.action}`,
          type: isClaim
            ? ('claim' as const)
            : activity.action === 'withdraw' || activity.action === 'withdrawal'
              ? ('withdraw' as const)
              : ('deposit' as const),
          symbol,
          amount: formatUsdRawAbs(
            isClaim ? activity.claim_value_usd : activity.delta_usd,
          ),
          createdAt: new Date(activity.timestamp).toISOString(),
          status:
            activity.status === 'pending'
              ? ('pending' as const)
              : activity.status === 'cancelled'
                ? ('failed' as const)
                : ('completed' as const),
        },
      ];
    });
    const adaptedPosition: GenesisUserPosition | undefined = position
      ? {
          ...position,
          hasDeposited:
            position.hasDeposited ||
            perAsset.some((item) => Number(item.deposited || 0) > 0),
          totalDeposits: String(totalDeposits),
          maturedDeposits: String(totalMaturedDeposits),
          claimableCash: String(totalClaimableCash),
          unrealisedPnl: String(totalUnrealisedPnl),
          perAsset,
          activities: mappedActivities ?? position.activities,
        }
      : undefined;

    return {
      config: adaptedConfig,
      position: adaptedPosition,
      isProgressReady: true,
      isPositionValuationReady: position !== undefined,
    };
  }, [
    config,
    depositCapMetrics,
    overview,
    activities,
    position,
    selectedVaults,
    selectedVaultItems,
    meritsSeason,
    seasonNowMs,
    vaults,
  ]);
};
