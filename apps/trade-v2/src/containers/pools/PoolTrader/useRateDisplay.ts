'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { formatUnits, getAddress } from 'viem';
import { usePriceStore } from '@/common/stores/priceStore';
import { usePoolDetail } from '@/queries/bsc/pools';
import {
  useHzvConfigByVault,
  useHzvValueByVault,
  useInternalUsdConfigForToken,
  useVaultDetail,
} from '@/queries/bsc/vaults';
import { useMarketTokenByAddress } from '@/stores/synthetics/marketTokens/hooks';
import { ActivityTabType } from '../PoolsDetail/components/ActivityPanel';
import { POOL_TRADE_QUOTE_REFRESH_INTERVAL_MS } from './constants';

import type { Address } from 'viem';

const TOKEN_DECIMALS = 10n ** 18n;

function parseRawBigInt(value: string | bigint | undefined | null) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'bigint') return value;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function getApproxTokenPriceUsd({
  tvlRaw,
  supplyRaw,
}: {
  tvlRaw: string | bigint | undefined | null;
  supplyRaw: string | bigint | undefined | null;
}) {
  const tvl = parseRawBigInt(tvlRaw);
  const supply = parseRawBigInt(supplyRaw);
  if (tvl === undefined || supply === undefined || supply <= 0n) return null;
  return (tvl * TOKEN_DECIMALS) / supply;
}

type UseRateDisplayOptions = {
  marketAddress: string;
  type: ActivityTabType;
  isDeposit: boolean;
};

type UseRateDisplayReturn = {
  displayDirectRate: number | null;
  displayReverseRate: number | null;
  isLoading: boolean;
  isUnavailable: boolean;
  shortTokenPriceUsd: bigint | null;
  tokenPriceUsd: bigint | null;
  refreshRate: () => void;
  refreshTick: number;
};

type DisplayRateState = {
  directRate: number | null;
  reverseRate: number | null;
  refreshTick: number;
};

export function useRateDisplay(
  options: UseRateDisplayOptions,
): UseRateDisplayReturn {
  const { marketAddress, type, isDeposit } = options;
  const isVault = type === ActivityTabType.VAULT;
  const pricesMap = usePriceStore((state) => state.pricesMap);

  const checksumAddress = useMemo(
    () => (marketAddress ? getAddress(marketAddress) : undefined),
    [marketAddress],
  );
  const poolDetailQuery = usePoolDetail(
    !isVault && checksumAddress ? checksumAddress : '',
  );
  const vaultDetailQuery = useVaultDetail(
    isVault && checksumAddress ? checksumAddress : '',
  );
  const {
    marketTokenData,
    isLoading: isMarketTokenLoading,
    isFetching: isMarketTokenFetching,
  } = useMarketTokenByAddress({
    marketAddress: isVault ? undefined : (checksumAddress as Address),
    isDeposit,
    enabled: !isVault,
    refreshInterval: POOL_TRADE_QUOTE_REFRESH_INTERVAL_MS,
  });

  const hzvConfigQuery = useHzvConfigByVault(
    isVault ? (checksumAddress as Address) : undefined,
  );
  const hzvValuesQuery = useHzvValueByVault(
    isVault ? (checksumAddress as Address) : undefined,
    { refetchInterval: POOL_TRADE_QUOTE_REFRESH_INTERVAL_MS },
  );

  const hzvConfig = hzvConfigQuery.data;
  const hzvValues = hzvValuesQuery.data;
  const poolDetail = poolDetailQuery.data?.pool;
  const vaultDetail = vaultDetailQuery.data?.data;
  const hasPriceFeed = Object.keys(pricesMap).length > 0;

  const backendTokenPriceUsd = useMemo(() => {
    if (isVault) {
      return getApproxTokenPriceUsd({
        tvlRaw: vaultDetail?.tvl,
        supplyRaw: vaultDetail?.supply,
      });
    }
    return getApproxTokenPriceUsd({
      tvlRaw: poolDetail?.tvl_usd,
      supplyRaw: poolDetail?.lp_supply,
    });
  }, [
    isVault,
    poolDetail?.lp_supply,
    poolDetail?.tvl_usd,
    vaultDetail?.supply,
    vaultDetail?.tvl,
  ]);

  const shortTokenAddress = useMemo(() => {
    if (isVault) {
      return hzvConfig?.shortToken ?? vaultDetail?.short_token_address ?? null;
    }
    return (
      marketTokenData?.shortTokenAddress ??
      poolDetail?.short_token_address ??
      null
    );
  }, [
    hzvConfig?.shortToken,
    isVault,
    marketTokenData?.shortTokenAddress,
    poolDetail?.short_token_address,
    vaultDetail?.short_token_address,
  ]);

  const internalUsdConfigQuery = useInternalUsdConfigForToken(
    isVault ? (shortTokenAddress ?? undefined) : undefined,
  );

  const priceTokenAddress = useMemo(() => {
    if (!isVault) return shortTokenAddress;
    if (!shortTokenAddress || !internalUsdConfigQuery.isSuccess) {
      return undefined;
    }
    return (
      internalUsdConfigQuery.data?.underlyingTokenAddress ?? shortTokenAddress
    );
  }, [
    internalUsdConfigQuery.data?.underlyingTokenAddress,
    internalUsdConfigQuery.isSuccess,
    isVault,
    shortTokenAddress,
  ]);

  const priceTokenPrices = useMemo(() => {
    if (!priceTokenAddress) return null;
    try {
      const checksum = getAddress(priceTokenAddress);
      return (
        pricesMap[checksum] ??
        pricesMap[checksum.toLowerCase()] ??
        pricesMap[priceTokenAddress] ??
        pricesMap[priceTokenAddress.toLowerCase()] ??
        null
      );
    } catch {
      return (
        pricesMap[priceTokenAddress] ??
        pricesMap[priceTokenAddress.toLowerCase()] ??
        null
      );
    }
  }, [priceTokenAddress, pricesMap]);

  const tokenPriceUsd = useMemo(() => {
    if (isVault) {
      return (
        hzvValues?.hlvTokenPriceMin ??
        hzvValues?.hlvTokenPrice ??
        backendTokenPriceUsd
      );
    }
    return marketTokenData?.prices?.minPrice ?? backendTokenPriceUsd;
  }, [
    backendTokenPriceUsd,
    hzvValues?.hlvTokenPrice,
    hzvValues?.hlvTokenPriceMin,
    isVault,
    marketTokenData?.prices?.minPrice,
  ]);

  // The base token price is the actual pool payment token. For Genesis
  // internal-USD vaults, this resolves to the underlying stablecoin.
  const shortTokenPriceUsd = useMemo(() => {
    if (priceTokenPrices?.maxPrice) {
      return priceTokenPrices.maxPrice;
    }
    return priceTokenPrices?.minPrice ?? null;
  }, [priceTokenPrices]);

  // Rate display prices align with the same visible USD price basis.
  // Deposit: use maxPrice for HzLP/HZV
  // Withdraw: use minPrice for HzLP/HZV
  const tokenPriceForRate = useMemo(() => {
    if (isVault) {
      const minPrice =
        hzvValues?.hlvTokenPriceMin ??
        hzvValues?.hlvTokenPrice ??
        backendTokenPriceUsd;
      const maxPrice =
        hzvValues?.hlvTokenPriceMax ??
        hzvValues?.hlvTokenPrice ??
        backendTokenPriceUsd;
      if (!minPrice || !maxPrice) return null;
      return isDeposit ? maxPrice : minPrice;
    }
    const prices = marketTokenData?.prices;
    const minPrice = prices?.minPrice ?? backendTokenPriceUsd;
    const maxPrice = prices?.maxPrice ?? backendTokenPriceUsd;
    if (!minPrice || !maxPrice) return null;
    return isDeposit ? maxPrice : minPrice;
  }, [
    backendTokenPriceUsd,
    hzvValues?.hlvTokenPrice,
    hzvValues?.hlvTokenPriceMax,
    hzvValues?.hlvTokenPriceMin,
    isDeposit,
    isVault,
    marketTokenData?.prices,
  ]);

  const shortTokenPriceForRate = useMemo(() => {
    if (priceTokenPrices) {
      return priceTokenPrices.maxPrice ?? priceTokenPrices.minPrice ?? null;
    }
    return null;
  }, [priceTokenPrices]);

  // Rate calculations use the same adverse prices as the quote direction.
  const directRate = useMemo(() => {
    if (
      !tokenPriceForRate ||
      !shortTokenPriceForRate ||
      tokenPriceForRate === 0n
    ) {
      return null;
    }
    const rateNum = Number(formatUnits(shortTokenPriceForRate, USD_DECIMALS));
    const tokenPriceNum = Number(formatUnits(tokenPriceForRate, USD_DECIMALS));
    if (tokenPriceNum <= 0) return null;
    return rateNum / tokenPriceNum;
  }, [tokenPriceForRate, shortTokenPriceForRate]);

  const reverseRate = useMemo(() => {
    if (
      !tokenPriceForRate ||
      !shortTokenPriceForRate ||
      shortTokenPriceForRate === 0n
    ) {
      return null;
    }
    const rateNum = Number(formatUnits(tokenPriceForRate, USD_DECIMALS));
    const shortPriceNum = Number(
      formatUnits(shortTokenPriceForRate, USD_DECIMALS),
    );
    if (shortPriceNum <= 0) return null;
    return rateNum / shortPriceNum;
  }, [tokenPriceForRate, shortTokenPriceForRate]);

  // Display state with automatic refresh
  const [displayRateState, setDisplayRateState] = useState<DisplayRateState>({
    directRate: null,
    reverseRate: null,
    refreshTick: 0,
  });
  const displayDirectRate = displayRateState.directRate;
  const displayReverseRate = displayRateState.reverseRate;
  const refreshTick = displayRateState.refreshTick;

  const latestDirectRef = useRef<number | null>(null);
  const latestReverseRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestDirectRef.current = directRate;
    latestReverseRef.current = reverseRate;

    setDisplayRateState((current) => {
      const nextDirectRate =
        directRate === null
          ? null
          : current.directRate === null
            ? directRate
            : current.directRate;
      const nextReverseRate =
        reverseRate === null
          ? null
          : current.reverseRate === null
            ? reverseRate
            : current.reverseRate;

      if (
        nextDirectRate === current.directRate &&
        nextReverseRate === current.reverseRate
      ) {
        return current;
      }

      return {
        ...current,
        directRate: nextDirectRate,
        reverseRate: nextReverseRate,
      };
    });
  }, [directRate, reverseRate]);

  const applyLatestRates = useCallback(() => {
    setDisplayRateState((current) => ({
      directRate: latestDirectRef.current,
      reverseRate: latestReverseRef.current,
      refreshTick: current.refreshTick + 1,
    }));
  }, []);

  const scheduleNextRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      applyLatestRates();
      scheduleNextRefresh();
    }, POOL_TRADE_QUOTE_REFRESH_INTERVAL_MS);
  }, [applyLatestRates]);

  useEffect(() => {
    scheduleNextRefresh();
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleNextRefresh]);

  const refreshRate = useCallback(() => {
    applyLatestRates();
    scheduleNextRefresh();
  }, [applyLatestRates, scheduleNextRefresh]);

  const isSourceLoading = isVault
    ? !hasPriceFeed ||
      internalUsdConfigQuery.isLoading ||
      hzvConfigQuery.isLoading ||
      hzvValuesQuery.isLoading ||
      (vaultDetail === undefined && !vaultDetailQuery.isError)
    : !hasPriceFeed ||
      isMarketTokenLoading ||
      isMarketTokenFetching ||
      (poolDetail === undefined && !poolDetailQuery.isError);
  const isUnavailable =
    !isSourceLoading &&
    (shortTokenPriceForRate === null || tokenPriceForRate === null);
  const isLoading =
    !isUnavailable &&
    (displayDirectRate === null || displayReverseRate === null);

  return {
    displayDirectRate,
    displayReverseRate,
    isLoading,
    isUnavailable,
    shortTokenPriceUsd,
    tokenPriceUsd,
    refreshRate,
    refreshTick,
  };
}
