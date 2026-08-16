'use client';

import { useMemo } from 'react';
import { getAddress } from 'viem';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import {
  useConnectionStatus,
  useCurrentAccountAddress,
} from '@/common/chainClient/hooks';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { usePoolDetail } from '@/queries/bsc/pools';
import { useHlvTokenBalance, useHzvValueByVault } from '@/queries/bsc/vaults';
import {
  calculatePoolRestHoldingsUsd,
  calculateVaultRestHoldingsUsd,
  useVaultDetailData,
  useVaultsListData,
} from '@/stores/synthetics/marketsData/selectors';
import { useMarketTokenByAddress } from '@/stores/synthetics/marketTokens/hooks';
import type {
  UserPerformanceEntry,
  UserPerformanceResourceType,
} from './store';

const TOKEN_DECIMALS = 10n ** 18n;

function parseRawBigInt(value?: string | bigint | null) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'bigint') return value;
  try {
    const str = String(value).trim();
    if (!str) return undefined;

    if (/^-?\d+$/.test(str)) {
      return BigInt(str);
    }

    if (!/^-?\d+(\.\d+)?$/.test(str)) {
      return undefined;
    }

    // Backend may serialize raw integer-like on-chain values through decimal types.
    // Truncate the fractional tail and keep the original raw magnitude.
    return BigInt(calc(str).integerValue(ROUND_MODE.DOWN).toFixed(0));
  } catch {
    return undefined;
  }
}

function calculateCurrentValueRaw(
  currentLpPrice?: bigint,
  currentLpBalance?: bigint,
): bigint | undefined {
  if (currentLpPrice === undefined || currentLpBalance === undefined)
    return undefined;
  return (currentLpPrice * currentLpBalance) / TOKEN_DECIMALS;
}

function calculateUnrealizedPnlRaw({
  currentLpPrice,
  averageDepositPrice,
  currentLpBalance,
}: {
  currentLpPrice?: bigint;
  averageDepositPrice?: bigint;
  currentLpBalance?: bigint;
}): bigint | undefined {
  if (
    currentLpPrice === undefined ||
    averageDepositPrice === undefined ||
    currentLpBalance === undefined
  ) {
    return undefined;
  }

  // Product requirement: keep the raw 1e30 / 1e18 formula aligned with backend semantics.
  const lpPriceDeltaValue =
    ((currentLpPrice - averageDepositPrice) * currentLpBalance) /
    TOKEN_DECIMALS;

  return lpPriceDeltaValue;
}

function buildEntry({
  walletAddress,
  resourceType,
  resourceAddress,
  isLoading,
  totalBought,
  realizedPnl,
  averageDepositPrice,
  currentLpPrice,
  currentLpBalance,
  depositsUsdOverride,
}: {
  walletAddress?: string;
  resourceType: UserPerformanceResourceType;
  resourceAddress: string;
  isLoading: boolean;
  totalBought?: bigint;
  realizedPnl?: bigint;
  averageDepositPrice?: bigint;
  currentLpPrice?: bigint;
  currentLpBalance?: bigint;
  depositsUsdOverride?: bigint;
}): UserPerformanceEntry {
  const depositsUsd =
    depositsUsdOverride ??
    calculateCurrentValueRaw(currentLpPrice, currentLpBalance);
  const hasBalance =
    (currentLpBalance !== undefined && currentLpBalance > 0n) ||
    (depositsUsd !== undefined && depositsUsd > 0n);
  const hasBackendPosition = totalBought !== undefined && totalBought > 0n;
  const hasDeposit = hasBackendPosition || hasBalance;
  const hasValidCostBasis =
    averageDepositPrice !== undefined && averageDepositPrice > 0n;
  const isPerformanceBasisLoading =
    hasDeposit &&
    (!hasBackendPosition || !hasValidCostBasis || realizedPnl === undefined);
  const displayRealizedPnl = !hasDeposit
    ? 0n
    : isPerformanceBasisLoading
      ? undefined
      : realizedPnl;
  const unrealizedPnl = !hasDeposit
    ? 0n
    : isPerformanceBasisLoading
      ? undefined
      : calculateUnrealizedPnlRaw({
          currentLpPrice,
          averageDepositPrice,
          currentLpBalance,
        });
  const earnedFeesUsd =
    displayRealizedPnl !== undefined && unrealizedPnl !== undefined
      ? displayRealizedPnl + unrealizedPnl
      : undefined;

  return {
    resourceType,
    resourceAddress,
    walletAddress,
    isLoading: isLoading || isPerformanceBasisLoading,
    hasDeposit,
    depositsUsd,
    earnedFeesUsd,
    realizedPnl: displayRealizedPnl,
    unrealizedPnl,
    allTimePnl: displayRealizedPnl,
    averageDepositPrice,
    totalBought,
    currentLpPrice,
    currentLpBalance,
  };
}

export function useVaultUserPerformance(vaultAddress: string | undefined) {
  const walletAddress = useCurrentAccountAddress() || undefined;
  const connectionStatus = useConnectionStatus();
  const normalizedVaultAddress = useMemo(() => {
    if (!vaultAddress) return undefined;
    try {
      return getAddress(vaultAddress);
    } catch {
      return vaultAddress;
    }
  }, [vaultAddress]);
  const vaultsList = useVaultsListData();
  const vaultDetail = useVaultDetailData(normalizedVaultAddress);
  const { data: hzvValues } = useHzvValueByVault(normalizedVaultAddress, {
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const { data: hlvBalanceData } = useHlvTokenBalance(normalizedVaultAddress);
  const currentLpBalance = hlvBalanceData?.balance;
  const currentLpPrice = hzvValues?.hlvTokenPrice;
  const fallbackVault = useMemo(() => {
    if (!normalizedVaultAddress || !vaultsList?.length) return undefined;
    const targetAddress = normalizedVaultAddress.toLowerCase();
    return vaultsList.find(
      (item) => item.vault_address.toLowerCase() === targetAddress,
    );
  }, [normalizedVaultAddress, vaultsList]);

  const entry = useMemo(() => {
    if (!normalizedVaultAddress) return undefined;

    if (connectionStatus === 'disconnected') {
      return buildEntry({
        walletAddress,
        resourceType: 'vault',
        resourceAddress: normalizedVaultAddress,
        isLoading: false,
        totalBought: 0n,
        realizedPnl: 0n,
        averageDepositPrice: 0n,
        currentLpPrice: 0n,
        currentLpBalance: 0n,
      });
    }

    const isLoading =
      connectionStatus === 'unknown' ||
      (connectionStatus === 'connected' &&
        (vaultDetail === undefined ||
          currentLpPrice === undefined ||
          currentLpBalance === undefined));
    const fallbackDepositsUsd = calculateVaultRestHoldingsUsd(
      fallbackVault ?? vaultDetail,
    );
    const depositsUsd =
      calculateCurrentValueRaw(currentLpPrice, currentLpBalance) ??
      fallbackDepositsUsd;

    return buildEntry({
      walletAddress,
      resourceType: 'vault',
      resourceAddress: normalizedVaultAddress,
      isLoading,
      depositsUsdOverride: depositsUsd,
      totalBought: parseRawBigInt(vaultDetail?.total_bought),
      realizedPnl: parseRawBigInt(vaultDetail?.realized_pnl),
      averageDepositPrice: parseRawBigInt(vaultDetail?.average_deposit_price),
      currentLpPrice,
      currentLpBalance,
    });
  }, [
    currentLpPrice,
    connectionStatus,
    currentLpBalance,
    fallbackVault,
    normalizedVaultAddress,
    vaultDetail,
    walletAddress,
  ]);

  return entry;
}

export function usePoolUserPerformance(marketAddress: string | undefined) {
  const walletAddress = useCurrentAccountAddress() || undefined;
  const connectionStatus = useConnectionStatus();
  const normalizedMarketAddress = useMemo(() => {
    if (!marketAddress) return undefined;
    try {
      return getAddress(marketAddress);
    } catch {
      return marketAddress;
    }
  }, [marketAddress]);
  const { data: poolDetail } = usePoolDetail(normalizedMarketAddress ?? '', {
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const { marketTokenData, isLoading: isMarketTokenLoading } =
    useMarketTokenByAddress({
      marketAddress: normalizedMarketAddress,
      isDeposit: true,
      enabled: !!normalizedMarketAddress,
    });

  const entry = useMemo(() => {
    if (!normalizedMarketAddress) return undefined;

    if (connectionStatus === 'disconnected') {
      return buildEntry({
        walletAddress,
        resourceType: 'pool',
        resourceAddress: normalizedMarketAddress,
        isLoading: false,
        totalBought: 0n,
        realizedPnl: 0n,
        averageDepositPrice: 0n,
        currentLpPrice: 0n,
        currentLpBalance: 0n,
      });
    }

    const currentLpBalance = marketTokenData?.walletBalance;
    const currentLpPrice = marketTokenData?.prices?.minPrice;
    const isLoading =
      connectionStatus === 'unknown' ||
      (connectionStatus === 'connected' &&
        (poolDetail?.pool === undefined ||
          currentLpPrice === undefined ||
          currentLpBalance === undefined ||
          isMarketTokenLoading));

    const chainDepositsUsd = calculateCurrentValueRaw(
      currentLpPrice,
      currentLpBalance,
    );
    const backendDepositsUsd = calculatePoolRestHoldingsUsd(poolDetail?.pool);
    const depositsUsd = chainDepositsUsd ?? backendDepositsUsd;

    return buildEntry({
      walletAddress,
      resourceType: 'pool',
      resourceAddress: normalizedMarketAddress,
      isLoading,
      depositsUsdOverride: depositsUsd,
      totalBought: parseRawBigInt(poolDetail?.pool?.total_bought),
      realizedPnl: parseRawBigInt(poolDetail?.pool?.realized_pnl),
      averageDepositPrice: parseRawBigInt(
        poolDetail?.pool?.average_deposit_price,
      ),
      currentLpPrice,
      currentLpBalance,
    });
  }, [
    connectionStatus,
    isMarketTokenLoading,
    marketTokenData?.prices?.minPrice,
    marketTokenData?.walletBalance,
    normalizedMarketAddress,
    poolDetail?.pool,
    walletAddress,
  ]);

  return entry;
}
