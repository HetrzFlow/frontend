import { useCallback, useMemo } from 'react';
import { BASIS_POINTS_DIVISOR_BIGINT } from '@hertzflow/sdk-v2/configs/factors';
import {
  getInternalUsdCollateralPriceTokenAddress,
  getInternalUsdParamsForMarketTokens,
} from '@hertzflow/sdk-v2/configs/internalUsd';
import { bigMath } from '@hertzflow/sdk-v2/utils/bigmath';
import {
  getDepositAmounts,
  type TokenDataWithPrices,
} from '@hertzflow/sdk-v2/utils/trade/liquidityDeposit';
import { zeroAddress, getAddress, type Address } from 'viem';
import { useQuery } from '@repo/lib/queryClient';

import { useInstStore, HZV_TOKEN_DECIMALS } from '@/common';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient/hooks';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { useGasLimits, useGasPrice } from '@/common/services/rest/gas';
import { usePriceStore } from '@/common/stores/priceStore';
import {
  getExecutionFee,
  estimateHzvDepositOraclePriceCount,
  estimateExecuteHzvDepositGasLimit,
} from '@/domain/synthetics/fees';
import { useTokensData } from '@/domain/synthetics/liquidity/hzlp/useTokensData';
import {
  allocateVaultLiquidity,
  hasCompleteVaultLiquidityData,
} from '@/domain/synthetics/markets/allocateVaultLiquidity';
import { useMarketsInfoByAddresses } from '@/queries/bsc/pools';
import { useHzvValueByVault } from '@/queries/bsc/vaults';
import type { VaultDetailItem } from '@/services/rest/vaults';
import {
  useMarketTokenByAddress,
  useMarketTokensByAddresses,
} from '@/stores/synthetics/marketTokens/hooks';
import type {
  HlvMarket,
  MarketTokenData,
} from '@/stores/synthetics/marketTokens/types';
import { usePreferenceStore } from '@/stores/trade/preference';
import { scaleHlvDepositAllocations } from './scaleHlvDepositAllocations';

import type { ExecutionFee } from '@hertzflow/sdk-v2/types/fees';
import type { HlvDepositAllocation } from '@hertzflow/sdk-v2/types/liquidity';
import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import type { TokenPrices, TokensData } from '@hertzflow/sdk-v2/types/tokens';
import type { DepositAmounts } from '@hertzflow/sdk-v2/types/trade';
import type { InternalUsdParams } from '@hertzflow/sdk-v2/utils/internalUsd';

interface HlvTokenData {
  decimals: number;
  prices: TokenPrices;
}

type VaultTransactionDetail = Partial<
  Pick<
    VaultDetailItem,
    | 'vault_address'
    | 'market_exposure'
    | 'supply'
    | 'tvl'
    | 'long_token_address'
    | 'short_token_address'
  >
>;

const BASIS_POINTS_DIVISOR = 10000;

function applySlippageToMinOut(
  allowedSlippage: number,
  minOutputAmount: bigint,
): bigint {
  const slippageBasisPoints = BASIS_POINTS_DIVISOR - allowedSlippage;
  return bigMath.mulDiv(
    minOutputAmount,
    BigInt(slippageBasisPoints),
    BASIS_POINTS_DIVISOR_BIGINT,
  );
}

function scaleTokenAmount(
  amount: bigint,
  fromDecimals: number,
  toDecimals: number,
) {
  if (amount <= 0n || fromDecimals === toDecimals) return amount;
  if (toDecimals > fromDecimals) {
    return amount * 10n ** BigInt(toDecimals - fromDecimals);
  }
  return amount / 10n ** BigInt(fromDecimals - toDecimals);
}

function getByAddress<T>(
  data: Record<string, T> | undefined,
  address: Address,
): T | undefined {
  const checksum = getAddress(address);
  return data?.[checksum] ?? data?.[checksum.toLowerCase()] ?? data?.[address];
}

function getDepositAmountUsd({
  amount,
  tokenAddress,
  tokensData,
  pricesMap,
}: {
  amount: bigint;
  tokenAddress?: Address;
  tokensData: TokensData;
  pricesMap: Record<string, TokenPrices>;
}) {
  if (amount <= 0n || !tokenAddress) return 0n;
  const tokenData = tokensData[tokenAddress];
  const tokenPrices = pricesMap[tokenAddress];
  const price = tokenPrices?.maxPrice ?? tokenPrices?.minPrice;
  if (!tokenData || !price || price <= 0n) return 0n;
  return (amount * price) / 10n ** BigInt(tokenData.decimals);
}

function getMarketDepositAmounts({
  marketInfo,
  marketTokenData,
  tokensData,
  pricesMap,
  longTokenAmount,
  shortTokenAmount,
  hlvTokenData,
  depositUiFeeFactor,
}: {
  marketInfo: MarketInfo;
  marketTokenData: MarketTokenData;
  tokensData: TokensData;
  pricesMap: Record<string, TokenPrices>;
  longTokenAmount: bigint;
  shortTokenAmount: bigint;
  hlvTokenData?: HlvTokenData;
  depositUiFeeFactor: bigint;
}) {
  const longToken = tokensData[marketInfo.longTokenAddress];
  const shortToken = tokensData[marketInfo.shortTokenAddress];
  const longTokenPrices = pricesMap[marketInfo.longTokenAddress as Address];
  const shortTokenPrices = pricesMap[marketInfo.shortTokenAddress as Address];

  if (!longToken || !shortToken || !longTokenPrices || !shortTokenPrices) {
    return undefined;
  }

  const longTokenWithPrices: TokenDataWithPrices = {
    ...longToken,
    prices: longTokenPrices,
  };

  const shortTokenWithPrices: TokenDataWithPrices = {
    ...shortToken,
    prices: shortTokenPrices,
  };

  let adjustedLongTokenAmount = longTokenAmount;
  let adjustedShortTokenAmount = shortTokenAmount;

  if (marketInfo.isSameCollaterals) {
    const positiveAmount = bigMath.max(longTokenAmount, shortTokenAmount);
    adjustedLongTokenAmount = positiveAmount / 2n;
    adjustedShortTokenAmount = positiveAmount - adjustedLongTokenAmount;
  }

  return getDepositAmounts({
    marketInfo,
    marketToken: marketTokenData,
    longToken: longTokenWithPrices,
    shortToken: shortTokenWithPrices,
    longTokenAmount: adjustedLongTokenAmount,
    shortTokenAmount: adjustedShortTokenAmount,
    uiFeeFactor: depositUiFeeFactor,
    marketTokenAmount: undefined,
    hlvToken: hlvTokenData,
    isMarketTokenDeposit: false,
  });
}

function getHlvMarketByAddress<T extends { address: Address }>(
  hlvMarkets: T[],
  marketAddress: Address,
) {
  const target = marketAddress.toLowerCase();
  return hlvMarkets.find((market) => market.address.toLowerCase() === target);
}

function isProjectedVaultMarketCapExceeded({
  hlvMarket,
  marketTokenData,
  receivedMarketTokenAmount,
  projectedPoolValue,
  projectedMarketTokenSupply,
}: {
  hlvMarket?: {
    hzlpBalance: bigint;
    hlvMaxMarketTokenBalanceAmount: bigint;
    hlvMaxMarketTokenBalanceUsd?: bigint;
  };
  marketTokenData?: MarketTokenData;
  receivedMarketTokenAmount: bigint;
  projectedPoolValue?: bigint;
  projectedMarketTokenSupply?: bigint;
}) {
  return (
    getProjectedVaultMarketCapExcessUsd({
      hlvMarket,
      marketTokenData,
      receivedMarketTokenAmount,
      projectedPoolValue,
      projectedMarketTokenSupply,
    })?.exceeded ?? false
  );
}

function getProjectedVaultMarketCapExcessUsd({
  hlvMarket,
  marketTokenData,
  receivedMarketTokenAmount,
  projectedPoolValue,
  projectedMarketTokenSupply,
}: {
  hlvMarket?: {
    hzlpBalance: bigint;
    hlvMaxMarketTokenBalanceAmount: bigint;
    hlvMaxMarketTokenBalanceUsd?: bigint;
  };
  marketTokenData?: MarketTokenData;
  receivedMarketTokenAmount: bigint;
  projectedPoolValue?: bigint;
  projectedMarketTokenSupply?: bigint;
}): { exceeded: boolean; excessUsd: bigint } | undefined {
  if (!hlvMarket || !marketTokenData || receivedMarketTokenAmount <= 0n) {
    return { exceeded: false, excessUsd: 0n };
  }

  const projectedMarketTokenAmount =
    hlvMarket.hzlpBalance + receivedMarketTokenAmount;
  const marketTokenPrice = marketTokenData.prices.maxPrice;
  const projectedMarketTokenUsd =
    projectedPoolValue !== undefined &&
    projectedPoolValue > 0n &&
    projectedMarketTokenSupply !== undefined &&
    projectedMarketTokenSupply > 0n
      ? (projectedMarketTokenAmount * projectedPoolValue) /
        projectedMarketTokenSupply
      : marketTokenPrice > 0n
        ? (projectedMarketTokenAmount * marketTokenPrice) /
          10n ** BigInt(marketTokenData.decimals)
        : undefined;

  let excessUsd = 0n;
  if (
    hlvMarket.hlvMaxMarketTokenBalanceAmount > 0n &&
    projectedMarketTokenAmount > hlvMarket.hlvMaxMarketTokenBalanceAmount
  ) {
    const excessAmount =
      projectedMarketTokenAmount - hlvMarket.hlvMaxMarketTokenBalanceAmount;
    const excessAmountUsd =
      projectedPoolValue !== undefined &&
      projectedPoolValue > 0n &&
      projectedMarketTokenSupply !== undefined &&
      projectedMarketTokenSupply > 0n
        ? (excessAmount * projectedPoolValue) / projectedMarketTokenSupply
        : marketTokenPrice > 0n
          ? (excessAmount * marketTokenPrice) /
            10n ** BigInt(marketTokenData.decimals)
          : undefined;
    if (excessAmountUsd === undefined) return undefined;
    excessUsd = excessAmountUsd;
  }

  const maxUsd = hlvMarket.hlvMaxMarketTokenBalanceUsd;
  if (
    maxUsd !== undefined &&
    maxUsd > 0n &&
    projectedMarketTokenUsd !== undefined &&
    projectedMarketTokenUsd > maxUsd
  ) {
    const usdExcess = projectedMarketTokenUsd - maxUsd;
    excessUsd = excessUsd > usdExcess ? excessUsd : usdExcess;
  }

  return { exceeded: excessUsd > 0n, excessUsd };
}

function getProjectedVaultDepositCapExcessUsd({
  allocation,
  depositAmountUsd,
  collateralLongTokenAmount,
  collateralShortTokenAmount,
  marketsInfoData,
  marketTokensData,
  tokensData,
  pricesMap,
  hlvMarkets,
  depositUiFeeFactor,
}: {
  allocation: ReturnType<typeof allocateVaultLiquidity>;
  depositAmountUsd: bigint;
  collateralLongTokenAmount: bigint;
  collateralShortTokenAmount: bigint;
  marketsInfoData: Record<Address, MarketInfo>;
  marketTokensData: Record<Address, MarketTokenData>;
  tokensData: TokensData;
  pricesMap: Record<string, TokenPrices>;
  hlvMarkets: HlvMarket[];
  depositUiFeeFactor: bigint;
}): bigint | undefined {
  if (!allocation.allocations.length || depositAmountUsd <= 0n) return 0n;

  const lastPartIndex = allocation.allocations.length - 1;
  let remainingLongTokenAmount = collateralLongTokenAmount;
  let remainingShortTokenAmount = collateralShortTokenAmount;
  let excessUsd = 0n;

  for (const [index, marketAllocation] of allocation.allocations.entries()) {
    const proportion = (marketAllocation.amountUsd * 10000n) / depositAmountUsd;
    const allocLongAmount =
      index === lastPartIndex
        ? remainingLongTokenAmount
        : marketAllocation.amount !== undefined &&
            collateralLongTokenAmount > 0n &&
            collateralShortTokenAmount === 0n
          ? marketAllocation.amount
          : (collateralLongTokenAmount * proportion) / 10000n;
    const allocShortAmount =
      index === lastPartIndex
        ? remainingShortTokenAmount
        : marketAllocation.amount !== undefined &&
            collateralShortTokenAmount > 0n &&
            collateralLongTokenAmount === 0n
          ? marketAllocation.amount
          : (collateralShortTokenAmount * proportion) / 10000n;
    remainingLongTokenAmount =
      remainingLongTokenAmount > allocLongAmount
        ? remainingLongTokenAmount - allocLongAmount
        : 0n;
    remainingShortTokenAmount =
      remainingShortTokenAmount > allocShortAmount
        ? remainingShortTokenAmount - allocShortAmount
        : 0n;

    const allocationMarketInfo = getByAddress(
      marketsInfoData,
      marketAllocation.marketAddress,
    );
    const allocationMarketTokenData = getByAddress(
      marketTokensData,
      marketAllocation.marketAddress,
    );
    if (!allocationMarketInfo || !allocationMarketTokenData) return undefined;

    try {
      const allocationDepositAmounts = getMarketDepositAmounts({
        marketInfo: allocationMarketInfo,
        marketTokenData: allocationMarketTokenData,
        tokensData,
        pricesMap,
        longTokenAmount: allocLongAmount,
        shortTokenAmount: allocShortAmount,
        depositUiFeeFactor,
      });
      if (!allocationDepositAmounts) return undefined;
      const capCheck = getProjectedVaultMarketCapExcessUsd({
        hlvMarket: getHlvMarketByAddress(
          hlvMarkets,
          marketAllocation.marketAddress,
        ),
        marketTokenData: allocationMarketTokenData,
        receivedMarketTokenAmount: allocationDepositAmounts.marketTokenAmount,
        projectedPoolValue: allocationMarketInfo.poolValueMax +
          allocationDepositAmounts.longTokenUsd +
          allocationDepositAmounts.shortTokenUsd,
        projectedMarketTokenSupply:
          allocationMarketTokenData.totalSupply +
          allocationDepositAmounts.marketTokenAmount,
      });
      if (!capCheck) return undefined;
      excessUsd += capCheck.excessUsd;
    } catch {
      return undefined;
    }
  }

  return excessUsd;
}

export interface UseHzvDepositTransactionParams {
  vaultDetail: VaultTransactionDetail | null;
  marketsInfoData?: Record<Address, MarketInfo>;
  /** Decimals used by the wallet-facing input token. */
  inputTokenDecimals?: number;
  /** Address of the wallet-facing input token. */
  inputTokenAddress?: Address;
  /** Resolved internal USD config shared with the trade UI. */
  internalUsd?: InternalUsdParams;
  /** Prevents the transaction from becoming ready before internal USD resolves. */
  internalUsdResolutionReady?: boolean;
  longTokenAmount?: bigint;
  shortTokenAmount?: bigint;
  longTokenSwapPath?: Address[];
  shortTokenSwapPath?: Address[];
}

export interface UseHzvDepositTransactionReturn {
  depositAmounts: DepositAmounts | undefined;
  quoteFeeUsd: bigint | undefined;
  quoteInputUsd: bigint | undefined;
  executionFee: ExecutionFee | undefined;
  minHlvTokens: bigint | undefined;
  /** Selected market address (primary market based on allocation) */
  selectedMarketAddress: Address | undefined;
  /** Whether the deposit exceeds total available capacity */
  exceedsCapacity: boolean;
  /** Total available capacity across all markets (30 decimals) */
  totalAvailableCapacity: bigint;
  /** Total available deposit input token amount across all markets */
  totalAvailableCapacityAmount: bigint;
  allocationCount: number;
  projectedCapExceeded: boolean;
  isFirstDepositSplitUnsupported: boolean;
  isLoading: boolean;
  isReady: boolean;
  onDeposit: () => Promise<`0x${string}` | undefined>;
}

export function useHzvDepositTransaction(
  params: UseHzvDepositTransactionParams,
): UseHzvDepositTransactionReturn {
  const {
    vaultDetail,
    marketsInfoData: marketsInfoDataOverride,
    inputTokenDecimals,
    inputTokenAddress,
    internalUsd: internalUsdOverride,
    internalUsdResolutionReady = true,
    longTokenAmount = 0n,
    shortTokenAmount = 0n,
    longTokenSwapPath = [],
    shortTokenSwapPath = [],
  } = params;

  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const internalUsd = useMemo(
    () =>
      internalUsdOverride ??
      getInternalUsdParamsForMarketTokens({
        chainId: hzSdk?.chainId,
        longTokenAddress: vaultDetail?.long_token_address,
        shortTokenAddress: vaultDetail?.short_token_address,
      }),
    [
      hzSdk?.chainId,
      internalUsdOverride,
      vaultDetail?.long_token_address,
      vaultDetail?.short_token_address,
    ],
  );
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const coins = useInstStore((state) => state.getCoins());
  const uiFeeFactorQuery = useQuery({
    queryKey: ['hz-sdk', 'hzv-deposit-ui-fee-factor', hzSdk?.chainId],
    enabled: !!hzSdk,
    queryFn: async () => {
      if (!hzSdk) return 0n;
      return hzSdk.utils.getUiFeeFactor();
    },
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
    refetchOnWindowFocus: false,
  });
  const depositUiFeeFactor = uiFeeFactorQuery.data ?? 0n;

  const slippageStr = usePreferenceStore((state) => state.slippage);
  const allowedSlippage = useMemo(() => {
    const slippagePercent = parseFloat(slippageStr) || 0.02;
    return Math.round(slippagePercent * BASIS_POINTS_DIVISOR);
  }, [slippageStr]);

  const { tokensData, isLoading: isTokensLoading } = useTokensData();
  const collateralTokenDecimals = useMemo(() => {
    if (!internalUsd) return inputTokenDecimals;
    const collateralTokenAddress =
      vaultDetail?.short_token_address ?? vaultDetail?.long_token_address;
    if (!collateralTokenAddress || !tokensData) {
      return undefined;
    }

    return getByAddress(tokensData, collateralTokenAddress as Address)
      ?.decimals;
  }, [
    inputTokenDecimals,
    internalUsd,
    tokensData,
    vaultDetail?.long_token_address,
    vaultDetail?.short_token_address,
  ]);
  const collateralLongTokenAmount = useMemo(() => {
    if (
      !internalUsd ||
      inputTokenDecimals === undefined ||
      collateralTokenDecimals === undefined
    ) {
      return longTokenAmount;
    }
    return scaleTokenAmount(
      longTokenAmount,
      inputTokenDecimals,
      collateralTokenDecimals,
    );
  }, [
    collateralTokenDecimals,
    inputTokenDecimals,
    internalUsd,
    longTokenAmount,
  ]);
  const collateralShortTokenAmount = useMemo(() => {
    if (
      !internalUsd ||
      inputTokenDecimals === undefined ||
      collateralTokenDecimals === undefined
    ) {
      return shortTokenAmount;
    }
    return scaleTokenAmount(
      shortTokenAmount,
      inputTokenDecimals,
      collateralTokenDecimals,
    );
  }, [
    collateralTokenDecimals,
    inputTokenDecimals,
    internalUsd,
    shortTokenAmount,
  ]);
  const toInputTokenAmount = useCallback(
    (amount: bigint) => {
      if (
        !internalUsd ||
        inputTokenDecimals === undefined ||
        collateralTokenDecimals === undefined
      ) {
        return amount;
      }

      return scaleTokenAmount(
        amount,
        collateralTokenDecimals,
        inputTokenDecimals,
      );
    },
    [collateralTokenDecimals, inputTokenDecimals, internalUsd],
  );
  const { data: hzvValues } = useHzvValueByVault(
    vaultDetail?.vault_address
      ? getAddress(vaultDetail.vault_address)
      : undefined,
    { refetchInterval: DYNAMIC_DATA_CACHE_TIME },
  );
  const marketExposure = useMemo(
    () => vaultDetail?.market_exposure ?? [],
    [vaultDetail?.market_exposure],
  );
  const fallbackExposureAddresses = useMemo(() => {
    return marketExposure
      .map((item) => item.market_address)
      .filter((addr): addr is string => !!addr)
      .map((addr) => {
        try {
          return getAddress(addr) as Address;
        } catch {
          return addr as Address;
        }
      });
  }, [marketExposure]);
  const exposureAddresses = useMemo(() => {
    return fallbackExposureAddresses;
  }, [fallbackExposureAddresses]);
  const marketsInfoQuery = useMarketsInfoByAddresses(exposureAddresses, {
    enabled:
      exposureAddresses.length > 0 && marketsInfoDataOverride === undefined,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const marketsInfoData =
    marketsInfoDataOverride ?? marketsInfoQuery.data ?? undefined;
  const isMarketInfoLoading =
    marketsInfoDataOverride === undefined && marketsInfoQuery.isLoading;
  const { marketTokensData, isLoading: isMarketTokensLoading } =
    useMarketTokensByAddresses({
      marketAddresses: exposureAddresses,
      isDeposit: true,
      enabled: exposureAddresses.length > 0,
      includeAccount: false,
      refreshInterval: DYNAMIC_DATA_CACHE_TIME,
    });

  const nativeTokenPrices = pricesMap[zeroAddress];
  const fallbackDepositTokenAddress = useMemo(() => {
    if (inputTokenAddress) return inputTokenAddress;
    if (!internalUsdResolutionReady) return undefined;

    return getInternalUsdCollateralPriceTokenAddress({
      chainId: hzSdk?.chainId,
      collateralTokenAddress: vaultDetail?.short_token_address,
    });
  }, [
    hzSdk?.chainId,
    inputTokenAddress,
    internalUsdResolutionReady,
    vaultDetail?.short_token_address,
  ]);
  const fallbackDepositToken = useMemo(() => {
    if (!fallbackDepositTokenAddress) return undefined;
    return (
      coins[fallbackDepositTokenAddress] ??
      coins[fallbackDepositTokenAddress.toLowerCase()]
    );
  }, [coins, fallbackDepositTokenAddress]);
  const fallbackDepositTokenPrice = fallbackDepositTokenAddress
    ? pricesMap[fallbackDepositTokenAddress]?.maxPrice
    : undefined;
  const fallbackDepositTokenDecimals = fallbackDepositToken?.decimals;

  // Calculate deposit amount in USD for allocation
  const depositAmountUsd = useMemo(() => {
    if (!tokensData || !pricesMap) return 0n;

    return (
      getDepositAmountUsd({
        amount: collateralLongTokenAmount,
        tokenAddress: vaultDetail?.long_token_address as Address | undefined,
        tokensData,
        pricesMap,
      }) +
      getDepositAmountUsd({
        amount: collateralShortTokenAmount,
        tokenAddress: vaultDetail?.short_token_address as Address | undefined,
        tokensData,
        pricesMap,
      })
    );
  }, [
    tokensData,
    pricesMap,
    collateralLongTokenAmount,
    collateralShortTokenAmount,
    vaultDetail?.long_token_address,
    vaultDetail?.short_token_address,
  ]);

  const hlvMarkets = useMemo(
    () => hzvValues?.hlvMarkets ?? [],
    [hzvValues?.hlvMarkets],
  );
  const hasAllocationData = hasCompleteVaultLiquidityData({
    marketExposure,
    marketsInfoData,
    marketTokensData,
    hlvMarkets,
  });
  const liquidityAllocation = useMemo(() => {
    if (!hasAllocationData) return undefined;

    return allocateVaultLiquidity({
      marketExposure,
      marketsInfoData: marketsInfoData,
      marketTokensData: marketTokensData,
      hlvMarkets,
      depositAmountUsd,
      depositAmount:
        collateralLongTokenAmount > 0n && collateralShortTokenAmount === 0n
          ? collateralLongTokenAmount
          : collateralShortTokenAmount > 0n && collateralLongTokenAmount === 0n
            ? collateralShortTokenAmount
            : undefined,
      depositTokenPrice: fallbackDepositTokenPrice,
      depositTokenDecimals: fallbackDepositTokenDecimals,
      pricesData: pricesMap,
      depositUiFeeFactor,
      conservativeProjectedCap: true,
    });
  }, [
    depositUiFeeFactor,
    depositAmountUsd,
    hasAllocationData,
    hlvMarkets,
    collateralLongTokenAmount,
    marketExposure,
    marketTokensData,
    marketsInfoData,
    pricesMap,
    collateralShortTokenAmount,
    fallbackDepositTokenDecimals,
    fallbackDepositTokenPrice,
  ]);

  const projectedCapacityAmount = useMemo(() => {
    if (
      !liquidityAllocation ||
      !tokensData ||
      !marketsInfoData ||
      !marketTokensData
    ) {
      return undefined;
    }

    const isLongOnly =
      collateralLongTokenAmount > 0n && collateralShortTokenAmount === 0n;
    const isShortOnly =
      collateralShortTokenAmount > 0n && collateralLongTokenAmount === 0n;
    if (!isLongOnly && !isShortOnly) return undefined;

    const depositTokenAddress = (isLongOnly
      ? vaultDetail?.long_token_address
      : vaultDetail?.short_token_address) as Address | undefined;
    if (!depositTokenAddress) return undefined;

    const depositToken = getByAddress(tokensData, depositTokenAddress);
    const depositTokenPrice = getByAddress(pricesMap, depositTokenAddress)?.maxPrice;
    if (!depositToken || !depositTokenPrice || depositTokenPrice <= 0n) {
      return undefined;
    }

    const amountCapacityByUsd =
      (liquidityAllocation.totalAvailableCapacity *
        10n ** BigInt(depositToken.decimals)) /
      depositTokenPrice;
    const fullCapacityAmount =
      liquidityAllocation.totalAvailableCapacityAmount < amountCapacityByUsd
        ? liquidityAllocation.totalAvailableCapacityAmount
        : amountCapacityByUsd;
    if (fullCapacityAmount <= 0n) return 0n;

    const fullCapacityUsd = getDepositAmountUsd({
      amount: fullCapacityAmount,
      tokenAddress: depositTokenAddress,
      tokensData,
      pricesMap,
    });
    if (fullCapacityUsd <= 0n) return 0n;

    const fullAllocation = allocateVaultLiquidity({
      marketExposure,
      marketsInfoData,
      marketTokensData,
      hlvMarkets,
      depositAmountUsd: fullCapacityUsd,
      depositAmount: fullCapacityAmount,
      depositTokenPrice: fallbackDepositTokenPrice,
      depositTokenDecimals: fallbackDepositTokenDecimals,
      pricesData: pricesMap,
      depositUiFeeFactor,
      conservativeProjectedCap: true,
    });
    if (fullAllocation.exceedsCapacity || !fullAllocation.allocations.length) {
      return undefined;
    }

    // Quote the full static capacity once and reserve any projected-cap excess.
    // This stays linear in the number of markets; the input-time projected cap
    // check remains the final safety guard for stale or changing quote data.
    const projectedCapExcessUsd = getProjectedVaultDepositCapExcessUsd({
      allocation: fullAllocation,
      depositAmountUsd: fullCapacityUsd,
      collateralLongTokenAmount: isLongOnly ? fullCapacityAmount : 0n,
      collateralShortTokenAmount: isShortOnly ? fullCapacityAmount : 0n,
      marketsInfoData,
      marketTokensData,
      tokensData,
      pricesMap,
      hlvMarkets,
      depositUiFeeFactor,
    });
    if (projectedCapExcessUsd === undefined || projectedCapExcessUsd <= 0n) {
      return projectedCapExcessUsd === undefined
        ? undefined
        : fullCapacityAmount;
    }

    if (projectedCapExcessUsd >= fullCapacityUsd) return 0n;
    const safeCapacityAmount =
      (fullCapacityAmount * (fullCapacityUsd - projectedCapExcessUsd)) /
      fullCapacityUsd;
    return safeCapacityAmount < fullCapacityAmount
      ? safeCapacityAmount
      : fullCapacityAmount;
  }, [
    collateralLongTokenAmount,
    collateralShortTokenAmount,
    depositUiFeeFactor,
    fallbackDepositTokenDecimals,
    fallbackDepositTokenPrice,
    hlvMarkets,
    liquidityAllocation,
    marketExposure,
    marketTokensData,
    marketsInfoData,
    pricesMap,
    tokensData,
    vaultDetail?.long_token_address,
    vaultDetail?.short_token_address,
  ]);

  // Select the primary market from allocation result
  const selectedMarketAddress = useMemo<Address | undefined>(() => {
    // Use the primary market from allocation if available
    if (liquidityAllocation?.primaryMarket) {
      return getAddress(liquidityAllocation.primaryMarket) as Address;
    }

    // Fallback to first market if no allocation
    const firstMarket = exposureAddresses[0];
    if (!firstMarket) return undefined;
    try {
      return getAddress(firstMarket) as Address;
    } catch {
      return firstMarket as Address;
    }
  }, [liquidityAllocation?.primaryMarket, exposureAddresses]);

  const isFirstDeposit = useMemo(() => {
    // Prefer on-chain data from hzvValues
    if (hzvValues?.hlvTotalSupply !== undefined) {
      const result = hzvValues.hlvTotalSupply === 0n;
      return result;
    }

    if (!vaultDetail?.supply) return false;
    const result =
      vaultDetail.supply === '0' || BigInt(vaultDetail.supply) === 0n;
    return result;
  }, [hzvValues?.hlvTotalSupply, vaultDetail?.supply]);

  const selectedMarketInfo = useMemo(() => {
    if (!selectedMarketAddress) return null;
    const info = marketsInfoData?.[getAddress(selectedMarketAddress)];
    return info ?? null;
  }, [selectedMarketAddress, marketsInfoData]);

  const { marketTokenData } = useMarketTokenByAddress({
    marketAddress: selectedMarketAddress,
    isDeposit: true,
    enabled: !!selectedMarketAddress,
    includeAccount: false,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const isMarketTokenDataLoading = marketTokenData === undefined;

  const hlvTokenData = useMemo<HlvTokenData | undefined>(() => {
    if (!vaultDetail || !hzvValues) return undefined;
    const hlvTokenPriceBigInt =
      hzvValues.hlvTokenPriceMax ?? hzvValues.hlvTokenPrice;
    if (hlvTokenPriceBigInt === 0n) return undefined;
    const hlvTokenPrices: TokenPrices = {
      minPrice: hlvTokenPriceBigInt,
      maxPrice: hlvTokenPriceBigInt,
    };

    return {
      decimals: HZV_TOKEN_DECIMALS,
      prices: hlvTokenPrices,
    };
  }, [vaultDetail, hzvValues]);

  const { data: gasLimits, isLoading: isGasLimitsLoading } = useGasLimits();
  const {
    data: gasPrice,
    isLoading: isGasPriceLoading,
    refetch: refetchGasPrice,
  } = useGasPrice();

  const calculateExecutionFee = useCallback(
    (currentGasPrice: bigint) => {
      if (!gasLimits || !tokensData || !nativeTokenPrices || !vaultDetail) {
        return undefined;
      }

      try {
        const marketsCount = BigInt(exposureAddresses.length);
        const swapsCount = BigInt(
          longTokenSwapPath.length + shortTokenSwapPath.length,
        );
        if (marketsCount === 0n) return undefined;

        const estimatedGasLimit = estimateExecuteHzvDepositGasLimit(gasLimits, {
          marketsCount,
          isMarketTokenDeposit: false,
          swapsCount,
          callbackGasLimit: 0n,
        });

        const oraclePriceCount = estimateHzvDepositOraclePriceCount(
          marketsCount,
          swapsCount,
        );

        return getExecutionFee(
          hzSdk?.chainId ?? 0,
          gasLimits,
          nativeTokenPrices,
          tokensData,
          estimatedGasLimit,
          currentGasPrice,
          oraclePriceCount,
        );
      } catch (error) {
        console.error(
          '[useHzvDepositTransaction] Failed to calculate execution fee:',
          error,
        );
        return undefined;
      }
    },
    [
      gasLimits,
      tokensData,
      nativeTokenPrices,
      vaultDetail,
      hzSdk?.chainId,
      longTokenSwapPath.length,
      shortTokenSwapPath.length,
      exposureAddresses.length,
    ],
  );

  const executionFee = useMemo(() => {
    if (gasPrice === undefined) return undefined;
    return calculateExecutionFee(gasPrice);
  }, [calculateExecutionFee, gasPrice]);

  const depositAmounts = useMemo<DepositAmounts | undefined>(() => {
    if (
      !vaultDetail ||
      !tokensData ||
      !selectedMarketInfo ||
      !marketTokenData
    ) {
      return undefined;
    }

    try {
      const result = getMarketDepositAmounts({
        marketInfo: selectedMarketInfo,
        marketTokenData,
        tokensData,
        pricesMap,
        longTokenAmount: collateralLongTokenAmount,
        shortTokenAmount: collateralShortTokenAmount,
        hlvTokenData,
        depositUiFeeFactor,
      });

      return result;
    } catch (error) {
      console.error(
        '[useHzvDepositTransaction] getDepositAmounts failed:',
        error,
      );
      return undefined;
    }
  }, [
    vaultDetail,
    tokensData,
    selectedMarketInfo,
    marketTokenData,
    pricesMap,
    collateralLongTokenAmount,
    collateralShortTokenAmount,
    hlvTokenData,
    depositUiFeeFactor,
  ]);

  const marketAllocationResult = useMemo<
    | {
        allocations: HlvDepositAllocation[];
        projectedCapExceeded: boolean;
        quoteFeeUsd: bigint;
        quoteInputUsd: bigint;
      }
    | undefined
  >(() => {
    if (
      !liquidityAllocation ||
      liquidityAllocation.allocations.length <= 1 ||
      depositAmountUsd <= 0n ||
      !tokensData ||
      !marketsInfoData ||
      !marketTokensData
    ) {
      return undefined;
    }

    const lastPartIndex = liquidityAllocation.allocations.length - 1;
    let remainingLongTokenAmount = collateralLongTokenAmount;
    let remainingShortTokenAmount = collateralShortTokenAmount;
    const result: HlvDepositAllocation[] = [];
    let projectedCapExceeded = false;
    let quoteFeeUsd = 0n;
    let quoteInputUsd = 0n;

    for (const [
      index,
      allocation,
    ] of liquidityAllocation.allocations.entries()) {
      const proportion = (allocation.amountUsd * 10000n) / depositAmountUsd;
      const allocLongAmount =
        index === lastPartIndex
          ? remainingLongTokenAmount
          : allocation.amount !== undefined &&
              collateralLongTokenAmount > 0n &&
              collateralShortTokenAmount === 0n
            ? allocation.amount
            : (collateralLongTokenAmount * proportion) / 10000n;
      const allocShortAmount =
        index === lastPartIndex
          ? remainingShortTokenAmount
          : allocation.amount !== undefined &&
              collateralShortTokenAmount > 0n &&
              collateralLongTokenAmount === 0n
            ? allocation.amount
            : (collateralShortTokenAmount * proportion) / 10000n;
      remainingLongTokenAmount =
        remainingLongTokenAmount > allocLongAmount
          ? remainingLongTokenAmount - allocLongAmount
          : 0n;
      remainingShortTokenAmount =
        remainingShortTokenAmount > allocShortAmount
          ? remainingShortTokenAmount - allocShortAmount
          : 0n;

      const allocationMarketInfo = getByAddress(
        marketsInfoData,
        allocation.marketAddress,
      );
      const allocationMarketTokenData = getByAddress(
        marketTokensData,
        allocation.marketAddress,
      );
      if (!allocationMarketInfo || !allocationMarketTokenData) return undefined;

      try {
        const allocationDepositAmounts = getMarketDepositAmounts({
          marketInfo: allocationMarketInfo,
          marketTokenData: allocationMarketTokenData,
          tokensData,
          pricesMap,
          longTokenAmount: allocLongAmount,
          shortTokenAmount: allocShortAmount,
          hlvTokenData,
          depositUiFeeFactor,
        });

        if (!allocationDepositAmounts?.hlvTokenAmount) return undefined;
        quoteFeeUsd += allocationDepositAmounts.swapFeeUsd;
        quoteInputUsd +=
          allocationDepositAmounts.longTokenUsd +
          allocationDepositAmounts.shortTokenUsd;
        projectedCapExceeded =
          projectedCapExceeded ||
          isProjectedVaultMarketCapExceeded({
            hlvMarket: getHlvMarketByAddress(
              hlvMarkets,
              allocation.marketAddress,
            ),
            marketTokenData: allocationMarketTokenData,
            receivedMarketTokenAmount:
              allocationDepositAmounts.marketTokenAmount,
            projectedPoolValue:
              allocationMarketInfo.poolValueMax +
              allocationDepositAmounts.longTokenUsd +
              allocationDepositAmounts.shortTokenUsd,
            projectedMarketTokenSupply:
              allocationMarketTokenData.totalSupply +
              allocationDepositAmounts.marketTokenAmount,
          });

        result.push({
          marketAddress: allocation.marketAddress,
          longTokenAmount: allocLongAmount,
          shortTokenAmount: allocShortAmount,
          minHlvTokens: applySlippageToMinOut(
            allowedSlippage,
            allocationDepositAmounts.hlvTokenAmount,
          ),
        });
      } catch (error) {
        console.error(
          '[useHzvDepositTransaction] allocation getDepositAmounts failed:',
          error,
        );
        return undefined;
      }
    }

    return {
      allocations: result,
      projectedCapExceeded,
      quoteFeeUsd,
      quoteInputUsd,
    };
  }, [
    allowedSlippage,
    depositAmountUsd,
    depositUiFeeFactor,
    hlvTokenData,
    hlvMarkets,
    liquidityAllocation,
    collateralLongTokenAmount,
    marketTokensData,
    marketsInfoData,
    pricesMap,
    collateralShortTokenAmount,
    tokensData,
  ]);
  const marketAllocations = marketAllocationResult?.allocations;
  const transactionMarketAllocations = useMemo(() => {
    if (!marketAllocations) return undefined;

    return scaleHlvDepositAllocations({
      allocations: marketAllocations,
      totalLongTokenAmount: toInputTokenAmount(collateralLongTokenAmount),
      totalShortTokenAmount: toInputTokenAmount(collateralShortTokenAmount),
      scaleAmount: toInputTokenAmount,
    });
  }, [
    collateralLongTokenAmount,
    collateralShortTokenAmount,
    marketAllocations,
    toInputTokenAmount,
  ]);
  const requiresMarketAllocations =
    (liquidityAllocation?.allocations.length ?? 0) > 1;
  const selectedHlvMarket = useMemo(() => {
    if (!selectedMarketAddress) return undefined;
    return getHlvMarketByAddress(hlvMarkets, selectedMarketAddress);
  }, [hlvMarkets, selectedMarketAddress]);
  const selectedMarketProjectedCapExceeded = useMemo(() => {
    if (requiresMarketAllocations) return false;
    return isProjectedVaultMarketCapExceeded({
      hlvMarket: selectedHlvMarket,
      marketTokenData,
      receivedMarketTokenAmount: depositAmounts?.marketTokenAmount ?? 0n,
      projectedPoolValue:
        selectedMarketInfo && depositAmounts
          ? selectedMarketInfo.poolValueMax +
            depositAmounts.longTokenUsd +
            depositAmounts.shortTokenUsd
          : undefined,
      projectedMarketTokenSupply:
        marketTokenData && depositAmounts
          ? marketTokenData.totalSupply + depositAmounts.marketTokenAmount
          : undefined,
    });
  }, [
    depositAmounts,
    marketTokenData,
    requiresMarketAllocations,
    selectedHlvMarket,
    selectedMarketInfo,
  ]);
  const projectedCapExceeded =
    marketAllocationResult?.projectedCapExceeded ??
    selectedMarketProjectedCapExceeded;

  const quoteFeeUsd =
    marketAllocationResult?.quoteFeeUsd ?? depositAmounts?.swapFeeUsd;
  const quoteInputUsd =
    marketAllocationResult?.quoteInputUsd ??
    (depositAmounts
      ? depositAmounts.longTokenUsd + depositAmounts.shortTokenUsd
      : undefined);

  const minHlvTokens = useMemo(() => {
    if (requiresMarketAllocations) {
      if (!marketAllocations?.length) return undefined;
      return marketAllocations.reduce(
        (sum, allocation) => sum + allocation.minHlvTokens,
        0n,
      );
    }
    if (!depositAmounts?.hlvTokenAmount) return undefined;
    const result = applySlippageToMinOut(
      allowedSlippage,
      depositAmounts.hlvTokenAmount,
    );
    return result;
  }, [
    depositAmounts?.hlvTokenAmount,
    allowedSlippage,
    marketAllocations,
    requiresMarketAllocations,
  ]);

  const isLoading =
    isTokensLoading ||
    isGasLimitsLoading ||
    isGasPriceLoading ||
    isMarketInfoLoading ||
    isMarketTokensLoading ||
    isMarketTokenDataLoading ||
    uiFeeFactorQuery.isLoading ||
    !internalUsdResolutionReady ||
    (!!internalUsd &&
      (inputTokenDecimals === undefined ||
        collateralTokenDecimals === undefined)) ||
    !hasAllocationData ||
    !vaultDetail;
  const isFirstDepositSplitUnsupported =
    isFirstDeposit && (liquidityAllocation?.allocations.length ?? 0) > 1;

  const isReady = useMemo(() => {
    const hasInputAmount =
      collateralLongTokenAmount > 0n || collateralShortTokenAmount > 0n;

    const ready =
      !!hzSdk &&
      !!account &&
      !!vaultDetail &&
      !!tokensData &&
      !!gasLimits &&
      !!depositAmounts &&
      !!minHlvTokens &&
      !!selectedMarketAddress &&
      !!marketsInfoData &&
      !!marketTokensData &&
      !!liquidityAllocation &&
      internalUsdResolutionReady &&
      (!internalUsd ||
        (inputTokenDecimals !== undefined &&
          collateralTokenDecimals !== undefined)) &&
      liquidityAllocation.allocations.length > 0 &&
      !isFirstDepositSplitUnsupported &&
      (!requiresMarketAllocations || !!marketAllocations?.length) &&
      !liquidityAllocation.exceedsCapacity &&
      !projectedCapExceeded &&
      hasInputAmount;

    return ready;
  }, [
    collateralLongTokenAmount,
    collateralShortTokenAmount,
    collateralTokenDecimals,
    inputTokenDecimals,
    hzSdk,
    account,
    vaultDetail,
    tokensData,
    gasLimits,
    depositAmounts,
    minHlvTokens,
    selectedMarketAddress,
    marketTokensData,
    marketsInfoData,
    internalUsdResolutionReady,
    liquidityAllocation,
    isFirstDepositSplitUnsupported,
    marketAllocations,
    projectedCapExceeded,
    requiresMarketAllocations,
    internalUsd,
  ]);

  const onDeposit = useCallback(async (): Promise<
    `0x${string}` | undefined
  > => {
    if (
      !isReady ||
      !hzSdk ||
      !account ||
      !vaultDetail ||
      !vaultDetail.vault_address ||
      !tokensData ||
      !minHlvTokens ||
      !selectedMarketAddress ||
      !liquidityAllocation
    ) {
      console.warn('[useHzvDepositTransaction] Not ready to deposit');
      return undefined;
    }

    const initialLongToken = vaultDetail.long_token_address;
    const initialShortToken = vaultDetail.short_token_address;
    if (!initialLongToken || !initialShortToken) {
      console.warn('[useHzvDepositTransaction] Missing vault token addresses');
      return undefined;
    }

    const refreshedGasPrice = await refetchGasPrice();
    if (refreshedGasPrice.error || refreshedGasPrice.data === undefined) {
      throw (
        refreshedGasPrice.error ??
        new Error('Failed to refresh gas price before deposit')
      );
    }

    const submissionGasPrice = refreshedGasPrice.data;
    const submissionExecutionFee = calculateExecutionFee(submissionGasPrice);
    if (
      !submissionExecutionFee ||
      submissionExecutionFee.feeTokenAmount <= 0n
    ) {
      console.warn(
        '[useHzvDepositTransaction] Failed to calculate submission execution fee',
      );
      return undefined;
    }

    const txHash = await hzSdk.liquidity.createHlvDeposit({
      hlvAddress: vaultDetail.vault_address as Address,
      marketAddress: selectedMarketAddress,
      longTokenAmount: toInputTokenAmount(collateralLongTokenAmount),
      shortTokenAmount: toInputTokenAmount(collateralShortTokenAmount),
      minHlvTokens,
      executionFee: submissionExecutionFee.feeTokenAmount,
      gasPrice: submissionGasPrice,
      initialLongToken: getAddress(initialLongToken) as Address,
      initialShortToken: getAddress(initialShortToken) as Address,
      internalUsd,
      isFirstDeposit,
      marketAllocations: transactionMarketAllocations,
    });

    return txHash;
  }, [
    isReady,
    hzSdk,
    account,
    vaultDetail,
    tokensData,
    minHlvTokens,
    selectedMarketAddress,
    internalUsd,
    liquidityAllocation,
    collateralLongTokenAmount,
    collateralShortTokenAmount,
    toInputTokenAmount,
    transactionMarketAllocations,
    isFirstDeposit,
    calculateExecutionFee,
    refetchGasPrice,
  ]);

  const totalAvailableCapacityAmount = useMemo(() => {
    const staticCapacityAmount =
      liquidityAllocation?.totalAvailableCapacityAmount ?? 0n;
    if (projectedCapacityAmount === undefined) {
      return toInputTokenAmount(staticCapacityAmount);
    }
    return toInputTokenAmount(
      projectedCapacityAmount < staticCapacityAmount
        ? projectedCapacityAmount
        : staticCapacityAmount,
    );
  }, [
    liquidityAllocation?.totalAvailableCapacityAmount,
    projectedCapacityAmount,
    toInputTokenAmount,
  ]);

  return {
    depositAmounts,
    quoteFeeUsd,
    quoteInputUsd,
    executionFee,
    minHlvTokens,
    selectedMarketAddress,
    exceedsCapacity: liquidityAllocation?.exceedsCapacity ?? false,
    totalAvailableCapacity: liquidityAllocation?.totalAvailableCapacity ?? 0n,
    totalAvailableCapacityAmount,
    allocationCount: liquidityAllocation
      ? Math.max(liquidityAllocation.allocations.length, 1)
      : 0,
    projectedCapExceeded,
    isFirstDepositSplitUnsupported,
    isLoading,
    isReady,
    onDeposit,
  };
}
