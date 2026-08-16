import { useMemo } from 'react';
import { formatAmount, USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { useHydrated } from '@/common/hooks/useHydrated';
import { useInstStore } from '@/common/stores/instStore';
import { usePriceStore } from '@/common/stores/priceStore';
import { useMarketInfoByAddress, usePoolDetail } from '@/queries/bsc/pools';
import type { PoolDetailQueryData } from '@/queries/bsc/pools';
import type { CATEGORY } from '@/services/rest/pools';
import {
  calculateMaxAumForDeposit,
  calculateRemainingDepositCap,
  calculateRemainingWithdrawalCap,
} from '@/stores/synthetics/marketsData/caps';
import type { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';

const DISPLAY_DECIMALS = 2;

function parseBigIntValue(value: string | undefined): bigint | undefined {
  if (value === undefined) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

export interface PoolDetailData {
  displayName?: string;
  symbol?: string;
  category?: CATEGORY;
  tvl?: string;
  totalEarnedFees?: string;
  remainingDepositCap?: string;
  remainingWithdrawalCap?: string;
  maxAum?: string;
  aum?: string;
  usdtPrice?: string;
  aumUsdtAmount?: string;
  maxAumUsdtAmount?: string;
  maxUsdtInAmount?: string;
  maxUsdtOutAmount?: string;
  feeApyRaw?: string;
  feeApy7dAgoRaw?: string;
  realizedPnlRaw?: string;
  totalBoughtRaw?: string;
  averageDepositPriceRaw?: string;
}

export interface UsePoolDetailDataResult {
  data: PoolDetailData | null;
  isLoading: boolean;
  isError: boolean;
}

export function usePoolDetailData(
  marketAddress: string | undefined,
  initialData?: PoolDetailQueryData,
  options?: {
    showErrorToast?: boolean;
  },
): UsePoolDetailDataResult {
  const isHydrated = useHydrated();
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const usdtCoin = useInstStore((state) => state.getUsdtCoin(state));
  const poolDetailQuery = usePoolDetail(marketAddress ?? '', {
    initialData,
    showErrorToast: options?.showErrorToast,
  });
  const poolDetail =
    !isHydrated && initialData ? initialData : poolDetailQuery.data;
  const { data: marketInfo } = useMarketInfoByAddress(marketAddress ?? '', {
    enabled: !!marketAddress,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });

  const data = useMemo<PoolDetailData | null>(() => {
    if (!marketAddress) return null;

    const backendTvlUsd = parseBigIntValue(poolDetail?.pool?.tvl_usd);
    const backendTotalEarnedFeesUsd = parseBigIntValue(
      poolDetail?.pool?.total_earned_fees_usd,
    );

    const hydratedMarketInfo = isHydrated ? marketInfo : null;
    const hydratedPricesMap = isHydrated ? pricesMap : {};
    const hydratedUsdtCoin = isHydrated ? usdtCoin : undefined;

    const chainTvlUsd = hydratedMarketInfo?.poolValueMin;
    const poolTvlUsd = chainTvlUsd ?? backendTvlUsd;
    const earnedFeesUsd = backendTotalEarnedFeesUsd;
    if (poolTvlUsd === undefined && earnedFeesUsd === undefined) return null;

    const usdtAddress = hydratedUsdtCoin?.address;
    const usdtPrices = usdtAddress
      ? (hydratedPricesMap[usdtAddress] as TokenPrices | undefined)
      : undefined;
    const usdtPriceForCap = usdtPrices?.maxPrice;
    const usdtDecimals = hydratedUsdtCoin?.decimals ?? 18;
    const hasPriceMap = Object.keys(hydratedPricesMap).length > 0;

    const remainingDepositCapUsd = hydratedMarketInfo
      ? calculateRemainingDepositCap(
          hydratedMarketInfo,
          usdtPriceForCap,
          usdtDecimals,
          hydratedPricesMap,
        )
      : undefined;
    const remainingWithdrawalCapUsd =
      hydratedMarketInfo && hasPriceMap
        ? calculateRemainingWithdrawalCap(hydratedMarketInfo, hydratedPricesMap)
        : undefined;

    const maxAum = hydratedMarketInfo
      ? calculateMaxAumForDeposit(
          hydratedMarketInfo,
          usdtPriceForCap,
          usdtDecimals,
        )
      : undefined;

    const usdtPrice = usdtPrices?.maxPrice;
    const usdtDecimalsBigInt = BigInt(usdtDecimals);
    const aumUsdtAmount =
      poolTvlUsd !== undefined && usdtPrice !== undefined && usdtPrice > 0n
        ? (poolTvlUsd * 10n ** usdtDecimalsBigInt) / usdtPrice
        : undefined;
    const maxAumUsdtAmount =
      maxAum !== undefined && usdtPrice !== undefined && usdtPrice > 0n
        ? (maxAum * 10n ** usdtDecimalsBigInt) / usdtPrice
        : undefined;
    const maxUsdtInAmount =
      remainingDepositCapUsd !== undefined &&
      usdtPrice !== undefined &&
      usdtPrice > 0n
        ? (remainingDepositCapUsd * 10n ** usdtDecimalsBigInt) / usdtPrice
        : undefined;
    const maxUsdtOutAmount =
      remainingWithdrawalCapUsd !== undefined &&
      usdtPrice !== undefined &&
      usdtPrice > 0n
        ? (remainingWithdrawalCapUsd * 10n ** usdtDecimalsBigInt) / usdtPrice
        : undefined;

    const result: PoolDetailData = {
      displayName: poolDetail?.pool?.display_name,
      symbol: poolDetail?.pool?.symbol,
      category: poolDetail?.pool?.category,
      remainingDepositCap:
        remainingDepositCapUsd !== undefined
          ? formatAmount(remainingDepositCapUsd, USD_DECIMALS, DISPLAY_DECIMALS)
          : undefined,
      remainingWithdrawalCap:
        remainingWithdrawalCapUsd !== undefined
          ? formatAmount(
              remainingWithdrawalCapUsd,
              USD_DECIMALS,
              DISPLAY_DECIMALS,
            )
          : undefined,
      maxAum:
        maxAum !== undefined
          ? formatAmount(maxAum, USD_DECIMALS, DISPLAY_DECIMALS)
          : undefined,
      aum:
        poolTvlUsd !== undefined
          ? formatAmount(poolTvlUsd, USD_DECIMALS, DISPLAY_DECIMALS)
          : undefined,
      usdtPrice:
        usdtPrice !== undefined
          ? formatAmount(usdtPrice, USD_DECIMALS, DISPLAY_DECIMALS)
          : undefined,
      aumUsdtAmount:
        aumUsdtAmount !== undefined
          ? formatAmount(aumUsdtAmount, usdtDecimals, DISPLAY_DECIMALS)
          : undefined,
      maxAumUsdtAmount:
        maxAumUsdtAmount !== undefined
          ? formatAmount(maxAumUsdtAmount, usdtDecimals, DISPLAY_DECIMALS)
          : undefined,
      maxUsdtInAmount:
        maxUsdtInAmount !== undefined
          ? formatAmount(maxUsdtInAmount, usdtDecimals, DISPLAY_DECIMALS)
          : undefined,
      maxUsdtOutAmount:
        maxUsdtOutAmount !== undefined
          ? formatAmount(maxUsdtOutAmount, usdtDecimals, DISPLAY_DECIMALS)
          : undefined,
      feeApyRaw: poolDetail?.pool?.fee_apy,
      feeApy7dAgoRaw: poolDetail?.pool?.fee_apy_7d_ago,
      realizedPnlRaw: poolDetail?.pool?.realized_pnl,
      totalBoughtRaw: poolDetail?.pool?.total_bought,
      averageDepositPriceRaw: poolDetail?.pool?.average_deposit_price,
    };

    if (poolTvlUsd !== undefined) {
      result.tvl = formatAmount(poolTvlUsd, USD_DECIMALS, DISPLAY_DECIMALS);
    }

    if (earnedFeesUsd !== undefined) {
      result.totalEarnedFees = formatAmount(
        earnedFeesUsd,
        USD_DECIMALS,
        DISPLAY_DECIMALS,
      );
    }

    return result;
  }, [
    marketInfo,
    isHydrated,
    marketAddress,
    poolDetail?.pool?.display_name,
    poolDetail?.pool?.symbol,
    poolDetail?.pool?.category,
    poolDetail?.pool?.tvl_usd,
    poolDetail?.pool?.total_earned_fees_usd,
    poolDetail?.pool?.fee_apy,
    poolDetail?.pool?.fee_apy_7d_ago,
    poolDetail?.pool?.realized_pnl,
    poolDetail?.pool?.total_bought,
    poolDetail?.pool?.average_deposit_price,
    pricesMap,
    usdtCoin,
  ]);

  const isLoading = !data && !poolDetailQuery.isError;
  const isError = poolDetailQuery.isError && data === null;

  return { data, isLoading, isError };
}
