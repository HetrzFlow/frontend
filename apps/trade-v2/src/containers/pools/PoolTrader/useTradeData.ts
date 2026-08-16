'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { formatUnits, getAddress, type Address } from 'viem';
import { calc, truncate } from '@repo/lib/calc';
import {
  useApproveTokenForSyntheticsRouter,
  useInstStore,
  useMarketIsPausing,
} from '@/common';
import { useConnectionStatus } from '@/common/chainClient/hooks';
import { useTokenBalance } from '@/common/chainClient/hooks/useTokenBalance';
import { HZLP_TOKEN_DECIMALS } from '@/common/constants';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { useMarketsConfigs } from '@/common/services/rest/market';
import { usePriceStore } from '@/common/stores/priceStore';
import { marketIsOpen } from '@/hooks/useMarketsStats';
import { getNextMarketTransition } from '@/lib/market/dateConverter';
import { useMarketInfoByAddress, usePoolDetail } from '@/queries/bsc/pools';
import {
  useHzvConfigByVault,
  useHzvValueByVault,
  useInternalUsdConfigForToken,
  useVaultRemainingCaps,
} from '@/queries/bsc/vaults';
import {
  HZLP_NAME,
  HZV_NAME,
  LiqTradeType,
  USDT_NAME,
} from '@/stores/pools/trade';
import {
  calculateRemainingDepositCap,
  calculateRemainingDepositTokenCap,
  calculateRemainingWithdrawalCap,
} from '@/stores/synthetics/marketsData/caps';
import { useVaultDetailData } from '@/stores/synthetics/marketsData/selectors';
import { ActivityTabType } from '../PoolsDetail/components/ActivityPanel';
import { useRateDisplay } from './useRateDisplay';

function getCoinByAddress<T extends { address: string }>(
  coins: Record<string, T> | undefined,
  address?: string,
) {
  if (!coins || !address) return undefined;
  return coins[address] ?? coins[address.toLowerCase()];
}

export type TradeDataParams = {
  type: ActivityTabType;
  direction: LiqTradeType;
  marketAddress?: string;
};

export function useTradeData({
  type,
  direction,
  marketAddress: marketAddressOverride,
}: TradeDataParams) {
  const params = useParams();
  const routeMarketAddress = params?.market_address as string | undefined;
  const marketAddress = marketAddressOverride ?? routeMarketAddress ?? '';
  const connectionStatus = useConnectionStatus();
  const isConnected = connectionStatus === 'connected';
  const isConnectionUnknown = connectionStatus === 'unknown';
  const isVault = type === ActivityTabType.VAULT;
  const isDeposit = direction === LiqTradeType.Deposit;
  const tokenSymbol = isVault ? HZV_NAME : HZLP_NAME;
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInsts());
  const usdtCoin = useInstStore((state) => state.getUsdtCoin(state));
  const rateDisplay = useRateDisplay({ marketAddress, type, isDeposit });
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const { data: marketInfo } = useMarketInfoByAddress(marketAddress ?? '', {
    enabled: !isVault && !!marketAddress,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });

  const { data: poolDetail } = usePoolDetail(
    isVault ? '' : (marketAddress ?? ''),
  );
  const usdtPrice = usdtCoin?.address
    ? pricesMap[usdtCoin.address]?.maxPrice
    : undefined;
  const usdtDecimals = usdtCoin?.decimals ?? 18;
  const poolRemainingDepositCapUsd = useMemo(() => {
    if (isVault || !marketInfo) return undefined;
    return calculateRemainingDepositCap(
      marketInfo,
      usdtPrice,
      usdtDecimals,
      pricesMap,
    );
  }, [isVault, marketInfo, pricesMap, usdtDecimals, usdtPrice]);
  const poolRemainingDepositCapAmount = useMemo(() => {
    if (isVault || !marketInfo) return undefined;
    return calculateRemainingDepositTokenCap(marketInfo, pricesMap);
  }, [isVault, marketInfo, pricesMap]);
  const poolRemainingWithdrawalCapUsd = useMemo(() => {
    if (isVault || !marketInfo) return undefined;
    if (Object.keys(pricesMap).length === 0) return undefined;
    return calculateRemainingWithdrawalCap(marketInfo, pricesMap);
  }, [isVault, marketInfo, pricesMap]);

  // ============ Vault Data ============
  const vaultDetail =
    useVaultDetailData(isVault ? marketAddress : undefined) ?? null;
  const isVaultDetailLoading = isVault && vaultDetail === null;
  const { data: hzvConfig } = useHzvConfigByVault(
    isVault ? marketAddress : undefined,
  );
  const vaultShortToken = useMemo(() => {
    if (!isVault || !marketAddress || !hzvConfig) return undefined;
    return hzvConfig.shortToken;
  }, [isVault, marketAddress, hzvConfig]);

  const { data: hzvValues } = useHzvValueByVault(
    isVault ? marketAddress : undefined,
    { refetchInterval: DYNAMIC_DATA_CACHE_TIME },
  );
  const vaultRemainingCaps = useVaultRemainingCaps(
    isVault ? marketAddress : undefined,
  );

  const poolInst = useMemo(() => {
    if (isVault || !marketAddress) return undefined;
    return insts[marketAddress];
  }, [insts, isVault, marketAddress]);
  const vaultExposureInsts = useMemo(() => {
    if (!isVault) return [];
    const items = vaultDetail?.market_exposure ?? [];
    return items.flatMap((item) => {
      if (!item.market_address) return [];

      try {
        const checksum = getAddress(item.market_address);
        const inst = insts[checksum] ?? insts[item.market_address];
        return inst ? [inst] : [];
      } catch {
        const inst = insts[item.market_address];
        return inst ? [inst] : [];
      }
    });
  }, [insts, isVault, vaultDetail?.market_exposure]);
  const { data: vaultMarketsConfigs } = useMarketsConfigs({
    additionalMarketInsts: vaultExposureInsts,
    scopeToAdditionalMarketInsts: true,
    markets: vaultExposureInsts,
    enabled: isVault && vaultExposureInsts.length > 0,
    refreshPriority: 'active',
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const depositFeeFactor = useMemo(() => {
    if (!isDeposit || !isVault || !vaultMarketsConfigs) return undefined;
    const factors = (vaultDetail?.market_exposure ?? []).flatMap((item) => {
      if (!item.market_address) return [];
      let config;
      try {
        config = vaultMarketsConfigs[getAddress(item.market_address)];
      } catch {
        config = vaultMarketsConfigs[item.market_address];
      }
      const factor = config?.depositFeeFactorForBalanceWasNotImproved;
      return typeof factor === 'bigint' ? [factor] : [];
    });
    return factors.length
      ? factors.reduce((max, value) => (value > max ? value : max))
      : undefined;
  }, [isDeposit, isVault, vaultDetail?.market_exposure, vaultMarketsConfigs]);
  const closedExposureInsts = useMemo(() => {
    if (!vaultExposureInsts.length) return [];
    return vaultExposureInsts.filter((inst) => !marketIsOpen(inst));
  }, [vaultExposureInsts]);
  const isMarketClosed = useMemo(() => {
    if (isVault) {
      if (!vaultExposureInsts.length) return false;
      return closedExposureInsts.length > 0;
    }
    if (!poolInst) return false;
    return !marketIsOpen(poolInst);
  }, [
    closedExposureInsts.length,
    isVault,
    poolInst,
    vaultExposureInsts.length,
  ]);
  const nextMarketOpenTime = useMemo(() => {
    if (!isMarketClosed) return undefined;
    if (isVault) {
      if (!closedExposureInsts.length) return undefined;
      return closedExposureInsts.reduce((max, inst) => {
        const next = getNextMarketTransition(inst?.schedule).nextOpenTime ?? 0;
        return next > max ? next : max;
      }, 0);
    }
    return getNextMarketTransition(poolInst?.schedule).nextOpenTime;
  }, [closedExposureInsts, isMarketClosed, isVault, poolInst]);
  const marketLabel = useMemo(() => {
    if (isVault) {
      return vaultDetail?.vault_name;
    }
    return poolInst?.name;
  }, [isVault, poolInst?.name, vaultDetail?.vault_name]);

  // ============ Unified Data ============
  const marketIsDisabled = marketInfo?.isDisabled;
  const marketIsPausing = useMarketIsPausing(marketAddress);
  const isPaused = useMemo(() => {
    if (!isDeposit) return false;
    if (isVault) {
      return vaultDetail?.is_disabled;
    }
    if (!marketAddress) return undefined;
    return !!marketIsDisabled || !!marketIsPausing;
  }, [
    isDeposit,
    isVault,
    marketAddress,
    marketIsDisabled,
    marketIsPausing,
    vaultDetail?.is_disabled,
  ]);

  const shortTokenAddress = isVault
    ? vaultShortToken
    : marketInfo?.shortTokenAddress;

  const vaultCollateralTokenAddress = isVault
    ? vaultDetail?.short_token_address || shortTokenAddress
    : undefined;

  const internalUsdConfigQuery = useInternalUsdConfigForToken(
    isVault ? vaultCollateralTokenAddress : undefined,
  );

  const hlvTokenAddress = isVault
    ? vaultDetail?.vault_token_address
    : undefined;

  const underlyingTokenAddress = useMemo(() => {
    if (!isVault) return usdtCoin?.address;

    if (!vaultCollateralTokenAddress || !internalUsdConfigQuery.isSuccess) {
      return undefined;
    }

    return (
      internalUsdConfigQuery.data?.underlyingTokenAddress ??
      vaultCollateralTokenAddress
    );
  }, [
    internalUsdConfigQuery.data?.underlyingTokenAddress,
    internalUsdConfigQuery.isSuccess,
    isVault,
    usdtCoin?.address,
    vaultCollateralTokenAddress,
  ]);

  // ============ Balances ============
  const payTokenAddress = useMemo(() => {
    if (isDeposit) {
      return underlyingTokenAddress;
    }
    return isVault ? hlvTokenAddress : marketAddress;
  }, [
    hlvTokenAddress,
    isDeposit,
    isVault,
    marketAddress,
    underlyingTokenAddress,
  ]);
  const payTokenLimitPriceUsd = useMemo(() => {
    if (!isDeposit) return rateDisplay.tokenPriceUsd;
    if (!payTokenAddress) {
      return isVault ? undefined : rateDisplay.shortTokenPriceUsd;
    }
    return (
      pricesMap[payTokenAddress as Address]?.maxPrice ??
      (isVault ? undefined : rateDisplay.shortTokenPriceUsd)
    );
  }, [
    isDeposit,
    isVault,
    payTokenAddress,
    pricesMap,
    rateDisplay.shortTokenPriceUsd,
    rateDisplay.tokenPriceUsd,
  ]);
  const payTokenMinPriceUsd = useMemo(() => {
    if (!isDeposit) return rateDisplay.tokenPriceUsd;
    if (!payTokenAddress) {
      return isVault ? undefined : rateDisplay.shortTokenPriceUsd;
    }
    return (
      pricesMap[payTokenAddress as Address]?.minPrice ??
      (isVault ? undefined : rateDisplay.shortTokenPriceUsd)
    );
  }, [
    isDeposit,
    isVault,
    payTokenAddress,
    pricesMap,
    rateDisplay.shortTokenPriceUsd,
    rateDisplay.tokenPriceUsd,
  ]);

  const payCoin = useMemo(() => {
    return getCoinByAddress(coins, payTokenAddress);
  }, [coins, payTokenAddress]);

  const underlyingToken = useMemo(
    () => getCoinByAddress(coins, underlyingTokenAddress),
    [coins, underlyingTokenAddress],
  );

  const receiveCoin = useMemo(() => {
    if (isDeposit) return coins?.[tokenSymbol];
    return underlyingToken;
  }, [coins, isDeposit, tokenSymbol, underlyingToken]);

  const underlyingTokenSymbol =
    underlyingToken?.symbol ?? (isVault ? '' : (usdtCoin?.symbol ?? USDT_NAME));
  const isUnderlyingTokenReady =
    !isVault ||
    (internalUsdConfigQuery.isSuccess && underlyingToken !== undefined);
  const payTokenSymbol =
    payCoin?.symbol ?? (isDeposit ? underlyingTokenSymbol : tokenSymbol);
  const receiveTokenSymbol =
    receiveCoin?.symbol ?? (isDeposit ? tokenSymbol : underlyingTokenSymbol);

  const payTokenDecimals = useMemo(() => {
    if (payCoin?.decimal !== undefined) return payCoin.decimal;
    if (payCoin?.decimals !== undefined) return payCoin.decimals;
    if (isDeposit && underlyingToken?.decimals !== undefined) {
      return underlyingToken.decimals;
    }
    if (isDeposit && !isVault && usdtCoin?.decimals !== undefined) {
      return usdtCoin.decimals;
    }
    return HZLP_TOKEN_DECIMALS;
  }, [
    isDeposit,
    isVault,
    payCoin?.decimal,
    payCoin?.decimals,
    underlyingToken?.decimals,
    usdtCoin?.decimals,
  ]);

  const payTokenBalanceQuery = useTokenBalance(
    payTokenAddress ? (getAddress(payTokenAddress) as Address) : undefined,
    {
      enabled: isConnected && !!payTokenAddress,
    },
  );
  const payTokenBalanceRaw = useMemo(() => {
    if (!isConnected) return 0n;
    return payTokenBalanceQuery.data ?? 0n;
  }, [isConnected, payTokenBalanceQuery.data]);

  const payTokenBalanceDisplay = useMemo(() => {
    const d = payTokenDecimals ?? 0;
    return truncate(
      calc(payTokenBalanceRaw.toString()).div(Math.pow(10, d)),
      d,
    );
  }, [payTokenBalanceRaw, payTokenDecimals]);

  // ============ Allowance ============
  // Determine token address for allowance based on type and direction
  const tokenForAllowance = useMemo(() => {
    if (isDeposit) {
      return payTokenAddress as `0x${string}` | undefined;
    }

    if (isVault) {
      return vaultDetail?.vault_token_address as `0x${string}` | undefined;
    }

    return marketInfo?.marketTokenAddress as `0x${string}` | undefined;
  }, [
    isDeposit,
    isVault,
    marketInfo?.marketTokenAddress,
    payTokenAddress,
    vaultDetail?.vault_token_address,
  ]);

  const {
    allowance,
    isAllowanceLoading,
    isApproving,
    approveToken: handleApprove,
  } = useApproveTokenForSyntheticsRouter({
    tokenAddress: tokenForAllowance,
    hideToast: true,
  });

  // ============ Wallet Balance ============
  const walletBalance = useMemo(() => {
    if (!isConnected) return 0n;
    return payTokenBalanceRaw;
  }, [isConnected, payTokenBalanceRaw]);

  const walletBalanceFormatted = useMemo(() => {
    if (isDeposit) {
      return payTokenBalanceDisplay;
    }
    const decimals = payTokenDecimals ?? HZLP_TOKEN_DECIMALS;
    return formatUnits(walletBalance, decimals);
  }, [isDeposit, payTokenBalanceDisplay, payTokenDecimals, walletBalance]);

  const isBalanceLoading = useMemo(() => {
    if (isConnectionUnknown) return true;
    if (!isConnected) return false;
    if (!payTokenAddress) return true;
    if (payTokenBalanceQuery.isLoading) return true;
    return payTokenBalanceQuery.data === undefined;
  }, [
    isConnectionUnknown,
    isConnected,
    payTokenAddress,
    payTokenBalanceQuery.isLoading,
    payTokenBalanceQuery.data,
  ]);

  // ============ Caps ============
  const depositCapUsd = useMemo(() => {
    if (isVault) {
      if (vaultRemainingCaps.isLoading) return undefined;
      return vaultRemainingCaps.remainingDepositCapUsd;
    }
    return poolRemainingDepositCapUsd;
  }, [
    isVault,
    poolRemainingDepositCapUsd,
    vaultRemainingCaps.isLoading,
    vaultRemainingCaps.remainingDepositCapUsd,
  ]);

  const withdrawCapUsd = useMemo(() => {
    if (isVault) {
      if (vaultRemainingCaps.isLoading) return undefined;
      return vaultRemainingCaps.remainingWithdrawalCapUsd;
    }
    return poolRemainingWithdrawalCapUsd;
  }, [
    isVault,
    poolRemainingWithdrawalCapUsd,
    vaultRemainingCaps.isLoading,
    vaultRemainingCaps.remainingWithdrawalCapUsd,
  ]);
  const depositCapAmount = useMemo(() => {
    if (!isDeposit) return undefined;
    if (!isVault) return poolRemainingDepositCapAmount;
    if (depositCapUsd === undefined) return undefined;

    if (!payTokenLimitPriceUsd || payTokenLimitPriceUsd <= 0n) return undefined;

    return (
      (depositCapUsd * 10n ** BigInt(payTokenDecimals)) / payTokenLimitPriceUsd
    );
  }, [
    depositCapUsd,
    isDeposit,
    isVault,
    payTokenLimitPriceUsd,
    payTokenDecimals,
    poolRemainingDepositCapAmount,
  ]);

  const withdrawCapAmount = useMemo(() => {
    if (isDeposit || withdrawCapUsd === undefined) return undefined;
    const tokenPrice = rateDisplay.tokenPriceUsd;
    if (!tokenPrice || tokenPrice <= 0n) return undefined;
    return (withdrawCapUsd * 10n ** BigInt(payTokenDecimals)) / tokenPrice;
  }, [isDeposit, payTokenDecimals, rateDisplay.tokenPriceUsd, withdrawCapUsd]);

  // ============ Data Ready State ============
  const isDataReady = useMemo(() => {
    if (isVault) {
      const relevantVaultCapUsd = isDeposit
        ? vaultRemainingCaps.remainingDepositCapUsd
        : vaultRemainingCaps.remainingWithdrawalCapUsd;
      const hasBasicVaultData =
        !isVaultDetailLoading &&
        !vaultRemainingCaps.isLoading &&
        vaultDetail !== null &&
        hzvConfig !== undefined &&
        hzvValues !== undefined &&
        relevantVaultCapUsd !== undefined &&
        !rateDisplay.isLoading &&
        isUnderlyingTokenReady;

      if (isDeposit) {
        return (
          hasBasicVaultData &&
          !!shortTokenAddress &&
          !!payTokenAddress &&
          payTokenBalanceQuery.data !== undefined
        );
      } else {
        return (
          hasBasicVaultData &&
          !!hlvTokenAddress &&
          payTokenBalanceQuery.data !== undefined
        );
      }
    } else {
      const hasBasicPoolData = marketInfo !== null && !rateDisplay.isLoading;

      if (isDeposit) {
        return (
          hasBasicPoolData &&
          !!payTokenAddress &&
          payTokenBalanceQuery.data !== undefined
        );
      } else {
        return hasBasicPoolData;
      }
    }
  }, [
    isVault,
    isDeposit,
    isUnderlyingTokenReady,
    isVaultDetailLoading,
    vaultDetail,
    hzvConfig,
    hzvValues,
    vaultRemainingCaps.isLoading,
    vaultRemainingCaps.remainingDepositCapUsd,
    vaultRemainingCaps.remainingWithdrawalCapUsd,
    rateDisplay.isLoading,
    marketInfo,
    shortTokenAddress,
    payTokenAddress,
    hlvTokenAddress,
    payTokenBalanceQuery.data,
  ]);

  return {
    marketAddress,
    marketLabel,
    isVault,
    isDeposit,
    tokenSymbol,
    underlyingTokenAddress,
    underlyingTokenDecimals:
      underlyingToken?.decimal ?? underlyingToken?.decimals,
    underlyingTokenSymbol,
    internalUsd: internalUsdConfigQuery.data,
    internalUsdResolutionReady: !isVault || internalUsdConfigQuery.isSuccess,
    isUnderlyingTokenReady,
    payTokenSymbol,
    payTokenIcon: payCoin?.icon,
    receiveTokenSymbol,
    receiveTokenIcon: receiveCoin?.icon,
    rateDisplay,
    isPaused,
    shortTokenAddress,
    payTokenDecimals,
    payTokenLimitPriceUsd,
    payTokenMinPriceUsd,
    depositFeeFactor,
    allowance,
    isAllowanceLoading,
    isApproving,
    handleApprove,
    walletBalance,
    walletBalanceFormatted,
    isBalanceLoading,
    depositCapUsd,
    depositCapAmount,
    withdrawCapUsd,
    withdrawCapAmount,
    isDataReady,
    connectionStatus,
    isMarketClosed,
    nextMarketOpenTime,
    estimatedApy: isVault ? vaultDetail?.net_apy : poolDetail?.pool?.fee_apy,
    // For useFormAction compatibility
    marketInfo,
    vaultDetail,
    isPredeposit: Boolean(vaultDetail?.is_predeposit),
    vaultMarketExposure: vaultRemainingCaps.marketExposure,
    vaultMarketsInfo: vaultRemainingCaps.marketsInfoData,
    hzvValues,
  };
}
