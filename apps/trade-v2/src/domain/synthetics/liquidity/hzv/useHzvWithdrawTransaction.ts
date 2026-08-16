import { useCallback, useEffect, useMemo, useRef } from 'react';
import { BASIS_POINTS_DIVISOR_BIGINT } from '@hertzflow/sdk-v2/configs/factors';
import { bigMath } from '@hertzflow/sdk-v2/utils/bigmath';
import { createFindSwapPath } from '@hertzflow/sdk-v2/utils/swap/swapPath';
import { getWithdrawalAmounts } from '@hertzflow/sdk-v2/utils/trade/liquidityWithdrawal';
import { zeroAddress, getAddress, type Address } from 'viem';

import { HZV_TOKEN_DECIMALS } from '@/common';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient/hooks';
import { HZLP_TOKEN_DECIMALS } from '@/common/constants';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { useGasLimits, useGasPrice } from '@/common/services/rest/gas';
import { usePriceStore } from '@/common/stores/priceStore';
import {
  getExecutionFee,
  estimateHzvWithdrawalOraclePriceCount,
  estimateExecuteHzvWithdrawalGasLimit,
} from '@/domain/synthetics/fees';
import { useTokensData } from '@/domain/synthetics/liquidity/hzlp/useTokensData';
import { useMarketsInfoByAddresses } from '@/queries/bsc/pools';
import { useHzvValueByVault } from '@/queries/bsc/vaults';
import { computeVaultRemainingCaps } from '@/queries/bsc/vaults/caps';
import type { VaultDetailItem } from '@/services/rest/vaults';
import {
  useMarketTokenByAddress,
  useMarketTokensByAddresses,
} from '@/stores/synthetics/marketTokens/hooks';
import { usePreferenceStore } from '@/stores/trade/preference';
import type { ExecutionFee } from '@hertzflow/sdk-v2/types/fees';
import type { HlvWithdrawalAllocation } from '@hertzflow/sdk-v2/types/liquidity';
import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import type { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';
import type { WithdrawalAmounts } from '@hertzflow/sdk-v2/types/trade';

const BASIS_POINTS_DIVISOR = 10000;

const ALLOC_BPS_DIVISOR = 10_000n;
const ALLOC_PRIMARY_BPS = 9_000n;

interface HlvTokenData {
  decimals: number;
  prices: TokenPrices;
}

type VaultTransactionDetail = Partial<
  Pick<
    VaultDetailItem,
    | 'vault_address'
    | 'vault_token_address'
    | 'market_exposure'
    | 'supply'
    | 'long_token_address'
    | 'short_token_address'
  >
>;

function normalizeAddress(address: string): Address {
  try {
    return getAddress(address) as Address;
  } catch {
    return address as Address;
  }
}

function getWithdrawalPriorityPrice(prices: TokenPrices | undefined): bigint {
  if (prices?.minPrice && prices.minPrice > 0n) return prices.minPrice;
  if (prices?.maxPrice && prices.maxPrice > 0n) return prices.maxPrice;
  return 0n;
}

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

export interface UseHzvWithdrawTransactionParams {
  vaultDetail: VaultTransactionDetail | null;
  marketsInfoData?: Record<Address, MarketInfo>;
  hlvTokenAmount?: bigint;
  receiveTokenAddress?: Address;
}

export interface UseHzvWithdrawTransactionReturn {
  withdrawalAmounts: WithdrawalAmounts | undefined;
  quoteFeeUsd: bigint | undefined;
  quoteInputUsd: bigint | undefined;
  executionFee: ExecutionFee | undefined;
  minLongTokenAmount: bigint | undefined;
  minShortTokenAmount: bigint | undefined;
  selectedMarketAddress: Address | undefined;
  allocationCount: number;
  isLoading: boolean;
  isReady: boolean;
  onWithdraw: () => Promise<`0x${string}` | undefined>;
}

export function useHzvWithdrawTransaction(
  params: UseHzvWithdrawTransactionParams,
): UseHzvWithdrawTransactionReturn {
  const {
    vaultDetail,
    marketsInfoData: marketsInfoDataOverride,
    hlvTokenAmount = 0n,
    receiveTokenAddress,
  } = params;

  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const pricesMap = usePriceStore((state) => state.pricesMap);

  const slippageStr = usePreferenceStore((state) => state.slippage);
  const allowedSlippage = useMemo(() => {
    const slippagePercent = parseFloat(slippageStr) || 0.02;
    return Math.round(slippagePercent * BASIS_POINTS_DIVISOR);
  }, [slippageStr]);

  const withdrawalCacheRef = useRef<Map<string, WithdrawalAmounts>>(new Map());
  const cacheIdsRef = useRef({
    seq: 0,
    pricesMap: new WeakMap<object, string>(),
    marketsInfo: new WeakMap<object, string>(),
    tokensData: new WeakMap<object, string>(),
  });
  const getObjectId = useCallback(
    (map: WeakMap<object, string>, obj: object | undefined) => {
      if (!obj) return '0';
      const existing = map.get(obj);
      if (existing) return existing;
      const next = String((cacheIdsRef.current.seq += 1));
      map.set(obj, next);
      return next;
    },
    [],
  );

  const { tokensData, isLoading: isTokensLoading } = useTokensData();
  const { data: hzvValues } = useHzvValueByVault(
    vaultDetail?.vault_address
      ? getAddress(vaultDetail.vault_address)
      : undefined,
    { refetchInterval: DYNAMIC_DATA_CACHE_TIME },
  );

  const nativeTokenPrices = pricesMap[zeroAddress];
  const marketExposure = useMemo(() => {
    return vaultDetail?.market_exposure ?? [];
  }, [vaultDetail?.market_exposure]);
  const exposureAddresses = useMemo(() => {
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

  const marketsInfoQuery = useMarketsInfoByAddresses(exposureAddresses, {
    enabled:
      exposureAddresses.length > 0 && marketsInfoDataOverride === undefined,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const marketsInfoData =
    marketsInfoDataOverride ?? marketsInfoQuery.data ?? undefined;
  const isMarketsInfoLoading =
    marketsInfoDataOverride === undefined && marketsInfoQuery.isLoading;
  const { marketTokensData, isLoading: isMarketTokensLoading } =
    useMarketTokensByAddresses({
      marketAddresses: exposureAddresses,
      isDeposit: false,
      enabled: exposureAddresses.length > 0,
      includeAccount: false,
      refreshInterval: DYNAMIC_DATA_CACHE_TIME,
    });

  const fallbackMarketAddress = useMemo<Address | undefined>(() => {
    const firstMarket = exposureAddresses[0];
    if (!firstMarket) return undefined;
    try {
      return getAddress(firstMarket) as Address;
    } catch {
      return firstMarket as Address;
    }
  }, [exposureAddresses]);

  const marketsCount = useMemo(() => {
    return BigInt(exposureAddresses.length);
  }, [exposureAddresses.length]);

  const hlvTokenData = useMemo<HlvTokenData | undefined>(() => {
    if (!vaultDetail || !hzvValues) return undefined;

    const hlvTokenPriceBigInt =
      hzvValues.hlvTokenPriceMin ?? hzvValues.hlvTokenPrice;
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

  const hlvTokenUsd = useMemo(() => {
    if (!hlvTokenData || hlvTokenAmount <= 0n) return 0n;
    return bigMath.mulDiv(
      hlvTokenAmount,
      hlvTokenData.prices.minPrice,
      BigInt(10 ** hlvTokenData.decimals),
    );
  }, [hlvTokenAmount, hlvTokenData]);
  const hlvMarkets = useMemo(
    () => hzvValues?.hlvMarkets ?? [],
    [hzvValues?.hlvMarkets],
  );
  const vaultRemainingCaps = useMemo(() => {
    return computeVaultRemainingCaps({
      marketExposure,
      marketsInfoData,
      marketTokensData,
      pricesData: pricesMap,
      hlvMarkets,
    });
  }, [
    hlvMarkets,
    marketExposure,
    marketTokensData,
    marketsInfoData,
    pricesMap,
  ]);
  const hasLiveWithdrawalCaps = useMemo(() => {
    return (
      Object.keys(vaultRemainingCaps.remainingWithdrawalCapByMarket).length > 0
    );
  }, [vaultRemainingCaps.remainingWithdrawalCapByMarket]);
  const distributionUsdByMarket = useMemo(() => {
    const result: Record<Address, bigint> = {} as Record<Address, bigint>;
    if (!hlvMarkets?.length) return result;

    const hlvMarketsMap = new Map(
      hlvMarkets.map((m) => [m.address.toLowerCase(), m]),
    );

    for (const exposure of marketExposure) {
      const marketAddress = normalizeAddress(exposure.market_address);
      const chainMarket = hlvMarketsMap.get(marketAddress.toLowerCase());
      if (!chainMarket) continue;
      const marketTokenPrice = getWithdrawalPriorityPrice(
        marketTokensData?.[marketAddress]?.prices,
      );

      result[marketAddress] =
        marketTokenPrice > 0n
          ? (chainMarket.hzlpBalance * marketTokenPrice) /
            10n ** BigInt(HZLP_TOKEN_DECIMALS)
          : 0n;
    }

    return result;
  }, [hlvMarkets, marketExposure, marketTokensData]);

  const withdrawalAllocation = useMemo(() => {
    const capEntries = Object.entries(
      vaultRemainingCaps.remainingWithdrawalCapByMarket,
    )
      .map(([marketAddress, withdrawableUsd]) => {
        let normalizedAddress: Address;
        try {
          normalizedAddress = getAddress(marketAddress) as Address;
        } catch {
          normalizedAddress = marketAddress as Address;
        }
        return {
          marketAddress: normalizedAddress,
          withdrawableUsd,
          distributionUsd: distributionUsdByMarket[normalizedAddress] ?? 0n,
        };
      })
      .filter((item) => item.withdrawableUsd > 0n);

    if (!capEntries.length || hlvTokenUsd <= 0n) {
      return {
        allocations: [],
        exceedsCapacity: false,
        totalWithdrawable: 0n,
        primaryMarket: undefined as Address | undefined,
      };
    }

    const sortedEntries = [...capEntries].sort((a, b) => {
      if (a.withdrawableUsd !== b.withdrawableUsd) {
        return a.withdrawableUsd > b.withdrawableUsd ? -1 : 1;
      }
      if (a.distributionUsd !== b.distributionUsd) {
        return a.distributionUsd > b.distributionUsd ? -1 : 1;
      }
      return a.marketAddress.localeCompare(b.marketAddress);
    });
    const totalWithdrawable = sortedEntries.reduce(
      (sum, item) => sum + item.withdrawableUsd,
      0n,
    );

    const allocated = new Map<Address, bigint>();
    let remainingUsd =
      hlvTokenUsd < totalWithdrawable ? hlvTokenUsd : totalWithdrawable;

    for (const entry of sortedEntries) {
      if (remainingUsd <= 0n) break;
      const offer =
        (entry.withdrawableUsd * ALLOC_PRIMARY_BPS) / ALLOC_BPS_DIVISOR;
      if (offer <= 0n) continue;
      const amount = remainingUsd <= offer ? remainingUsd : offer;
      allocated.set(entry.marketAddress, amount);
      remainingUsd -= amount;
    }

    if (remainingUsd > 0n) {
      for (const entry of sortedEntries) {
        if (remainingUsd <= 0n) break;
        const alreadyAllocated = allocated.get(entry.marketAddress) ?? 0n;
        const remaining =
          entry.withdrawableUsd > alreadyAllocated
            ? entry.withdrawableUsd - alreadyAllocated
            : 0n;
        if (remaining <= 0n) continue;
        const amount = remainingUsd <= remaining ? remainingUsd : remaining;
        allocated.set(entry.marketAddress, alreadyAllocated + amount);
        remainingUsd -= amount;
      }
    }

    const allocations: Array<{ marketAddress: Address; amountUsd: bigint }> =
      [];
    for (const entry of sortedEntries) {
      const amount = allocated.get(entry.marketAddress);
      if (amount && amount > 0n) {
        allocations.push({
          marketAddress: entry.marketAddress,
          amountUsd: amount,
        });
      }
    }

    return {
      allocations,
      exceedsCapacity: hlvTokenUsd > totalWithdrawable,
      totalWithdrawable,
      primaryMarket: allocations[0]?.marketAddress,
    };
  }, [
    distributionUsdByMarket,
    hlvTokenUsd,
    vaultRemainingCaps.remainingWithdrawalCapByMarket,
  ]);

  const selectedMarketAddress = useMemo<Address | undefined>(() => {
    if (withdrawalAllocation.primaryMarket) {
      return getAddress(withdrawalAllocation.primaryMarket) as Address;
    }
    return fallbackMarketAddress;
  }, [withdrawalAllocation.primaryMarket, fallbackMarketAddress]);

  const selectedMarketInfo = useMemo(() => {
    if (!selectedMarketAddress) return null;
    const info = marketsInfoData?.[getAddress(selectedMarketAddress)];
    return info ?? null;
  }, [selectedMarketAddress, marketsInfoData]);

  const { marketTokenData } = useMarketTokenByAddress({
    marketAddress: selectedMarketAddress,
    isDeposit: false,
    enabled: !!selectedMarketAddress,
    includeAccount: false,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const isMarketTokenDataLoading = marketTokenData === undefined;

  const findSwapPath = useMemo(() => {
    if (
      !receiveTokenAddress ||
      !selectedMarketInfo ||
      !marketsInfoData ||
      !tokensData
    ) {
      return undefined;
    }

    const longTokenAddress = selectedMarketInfo.longTokenAddress;
    const shortTokenAddress = selectedMarketInfo.shortTokenAddress;

    let fromTokenAddress: string | undefined;
    if (receiveTokenAddress === longTokenAddress) {
      fromTokenAddress = shortTokenAddress;
    } else if (receiveTokenAddress === shortTokenAddress) {
      fromTokenAddress = longTokenAddress;
    } else {
      return undefined;
    }

    return createFindSwapPath({
      chainId: hzSdk?.chainId ?? 97,
      fromTokenAddress,
      toTokenAddress: receiveTokenAddress,
      marketsInfoData,
      prices: pricesMap,
      tokensData,
      isExpressFeeSwap: false,
    });
  }, [
    receiveTokenAddress,
    selectedMarketInfo,
    marketsInfoData,
    tokensData,
    pricesMap,
    hzSdk?.chainId,
  ]);

  const withdrawalAmounts = useMemo<WithdrawalAmounts | undefined>(() => {
    if (
      !selectedMarketInfo ||
      !marketTokenData ||
      !tokensData ||
      !hlvTokenData ||
      hlvTokenAmount <= 0n
    ) {
      return undefined;
    }

    const longToken = tokensData[selectedMarketInfo.longTokenAddress];
    const shortToken = tokensData[selectedMarketInfo.shortTokenAddress];
    const longTokenPrices =
      pricesMap[selectedMarketInfo.longTokenAddress as Address];
    const shortTokenPrices =
      pricesMap[selectedMarketInfo.shortTokenAddress as Address];

    if (!longToken || !shortToken || !longTokenPrices || !shortTokenPrices) {
      return undefined;
    }

    try {
      const pricesMapId = getObjectId(
        cacheIdsRef.current.pricesMap,
        pricesMap as object,
      );
      const marketsInfoId = getObjectId(
        cacheIdsRef.current.marketsInfo,
        marketsInfoData as object,
      );
      const tokensDataId = getObjectId(
        cacheIdsRef.current.tokensData,
        tokensData as object,
      );
      const cacheKey = [
        'single',
        selectedMarketInfo.marketTokenAddress,
        hlvTokenAmount.toString(),
        hlvTokenUsd.toString(),
        receiveTokenAddress ?? '',
        marketTokenData.totalSupply.toString(),
        marketTokenData.prices.maxPrice.toString(),
        marketTokenData.decimals,
        selectedMarketInfo.longPoolAmount?.toString() ?? '',
        selectedMarketInfo.shortPoolAmount?.toString() ?? '',
        selectedMarketInfo.poolValueMax?.toString() ?? '',
        selectedMarketInfo.withdrawalFeeFactorForBalanceWasNotImproved?.toString() ??
          '',
        longTokenPrices.maxPrice.toString(),
        shortTokenPrices.maxPrice.toString(),
        longToken.decimals,
        shortToken.decimals,
        pricesMapId,
        marketsInfoId,
        tokensDataId,
      ].join('|');
      const cached = withdrawalCacheRef.current.get(cacheKey);
      if (cached) return cached;

      const marketTokenAmount = bigMath.mulDiv(
        hlvTokenUsd,
        BigInt(10 ** marketTokenData.decimals),
        marketTokenData.prices.maxPrice,
      );

      const result = getWithdrawalAmounts({
        marketInfo: selectedMarketInfo,
        marketTokenDecimals: marketTokenData.decimals,
        marketTokenTotalSupply: marketTokenData.totalSupply,
        longToken,
        shortToken,
        longTokenPrices,
        shortTokenPrices,
        marketTokenAmount,
        uiFeeFactor: 0n,
        wrappedReceiveTokenAddress: receiveTokenAddress,
        findSwapPath,
      });

      result.marketTokenUsd = hlvTokenUsd;
      result.hlvTokenAmount = hlvTokenAmount;
      result.hlvTokenUsd = hlvTokenUsd;

      withdrawalCacheRef.current.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to calculate HLV withdrawal amounts:', error);
      return undefined;
    }
  }, [
    selectedMarketInfo,
    marketTokenData,
    tokensData,
    hlvTokenData,
    hlvTokenAmount,
    hlvTokenUsd,
    pricesMap,
    receiveTokenAddress,
    findSwapPath,
    getObjectId,
    marketsInfoData,
  ]);

  const withdrawalAllocationResult = useMemo<
    | {
        allocations: HlvWithdrawalAllocation[];
        quoteFeeUsd: bigint;
        quoteInputUsd: bigint;
      }
    | undefined
  >(() => {
    if (
      withdrawalAllocation.allocations.length === 0 ||
      !marketsInfoData ||
      !tokensData ||
      !marketTokensData ||
      !hlvTokenData ||
      hlvTokenAmount <= 0n ||
      hlvTokenUsd <= 0n
    ) {
      return undefined;
    }

    try {
      const allocations = withdrawalAllocation.allocations;

      const lastIndex = allocations.length - 1;
      let remainingHlvTokenAmount = hlvTokenAmount;
      const result: HlvWithdrawalAllocation[] = [];
      let quoteFeeUsd = 0n;
      let quoteInputUsd = 0n;
      const pricesMapId = getObjectId(
        cacheIdsRef.current.pricesMap,
        pricesMap as object,
      );
      const marketsInfoId = getObjectId(
        cacheIdsRef.current.marketsInfo,
        marketsInfoData as object,
      );
      const tokensDataId = getObjectId(
        cacheIdsRef.current.tokensData,
        tokensData as object,
      );

      for (let i = 0; i < allocations.length; i += 1) {
        const allocation = allocations[i];
        if (!allocation) return undefined;
        const marketAddress = getAddress(allocation.marketAddress) as Address;
        const marketInfo = marketsInfoData[marketAddress];
        const marketTokenData = marketTokensData[marketAddress];

        if (!marketInfo || !marketTokenData) return undefined;

        const longToken = tokensData[marketInfo.longTokenAddress];
        const shortToken = tokensData[marketInfo.shortTokenAddress];
        const longTokenPrices =
          pricesMap[marketInfo.longTokenAddress as Address];
        const shortTokenPrices =
          pricesMap[marketInfo.shortTokenAddress as Address];

        if (
          !longToken ||
          !shortToken ||
          !longTokenPrices ||
          !shortTokenPrices
        ) {
          return undefined;
        }

        const allocationHlvTokenAmount =
          i === lastIndex
            ? remainingHlvTokenAmount
            : bigMath.mulDiv(hlvTokenAmount, allocation.amountUsd, hlvTokenUsd);
        remainingHlvTokenAmount =
          remainingHlvTokenAmount > allocationHlvTokenAmount
            ? remainingHlvTokenAmount - allocationHlvTokenAmount
            : 0n;

        const allocationHlvTokenUsd = bigMath.mulDiv(
          allocationHlvTokenAmount,
          hlvTokenData.prices.minPrice,
          BigInt(10 ** hlvTokenData.decimals),
        );

        const marketTokenAmount = bigMath.mulDiv(
          allocationHlvTokenUsd,
          BigInt(10 ** marketTokenData.decimals),
          marketTokenData.prices.maxPrice,
        );

        const allocationCacheKey = [
          'alloc',
          marketInfo.marketTokenAddress,
          allocationHlvTokenAmount.toString(),
          allocationHlvTokenUsd.toString(),
          receiveTokenAddress ?? '',
          marketTokenData.totalSupply.toString(),
          marketTokenData.prices.maxPrice.toString(),
          marketTokenData.decimals,
          marketInfo.longPoolAmount?.toString() ?? '',
          marketInfo.shortPoolAmount?.toString() ?? '',
          marketInfo.poolValueMax?.toString() ?? '',
          marketInfo.withdrawalFeeFactorForBalanceWasNotImproved?.toString() ??
            '',
          longTokenPrices.maxPrice.toString(),
          shortTokenPrices.maxPrice.toString(),
          longToken.decimals,
          shortToken.decimals,
          pricesMapId,
          marketsInfoId,
          tokensDataId,
        ].join('|');

        let findSwapPathForMarket:
          | ReturnType<typeof createFindSwapPath>
          | undefined;
        if (receiveTokenAddress) {
          const longTokenAddress = marketInfo.longTokenAddress;
          const shortTokenAddress = marketInfo.shortTokenAddress;

          let fromTokenAddress: string | undefined;
          if (receiveTokenAddress === longTokenAddress) {
            fromTokenAddress = shortTokenAddress;
          } else if (receiveTokenAddress === shortTokenAddress) {
            fromTokenAddress = longTokenAddress;
          }

          if (fromTokenAddress) {
            findSwapPathForMarket = createFindSwapPath({
              chainId: hzSdk?.chainId ?? 97,
              fromTokenAddress,
              toTokenAddress: receiveTokenAddress,
              marketsInfoData,
              prices: pricesMap,
              tokensData,
              isExpressFeeSwap: false,
            });
          }
        }

        const cached = withdrawalCacheRef.current.get(allocationCacheKey);
        const allocationWithdrawalAmounts =
          cached ??
          getWithdrawalAmounts({
            marketInfo,
            marketTokenDecimals: marketTokenData.decimals,
            marketTokenTotalSupply: marketTokenData.totalSupply,
            longToken,
            shortToken,
            longTokenPrices,
            shortTokenPrices,
            marketTokenAmount,
            uiFeeFactor: 0n,
            wrappedReceiveTokenAddress: receiveTokenAddress,
            findSwapPath: findSwapPathForMarket,
          });
        if (!cached) {
          withdrawalCacheRef.current.set(
            allocationCacheKey,
            allocationWithdrawalAmounts,
          );
        }

        quoteFeeUsd += allocationWithdrawalAmounts.swapFeeUsd;
        quoteInputUsd += allocationWithdrawalAmounts.marketTokenUsd;

        const minLongTokenAmount =
          allocationWithdrawalAmounts.longTokenSwapPathStats
            ? applySlippageToMinOut(
                allowedSlippage,
                allocationWithdrawalAmounts.longTokenSwapPathStats.amountOut,
              )
            : applySlippageToMinOut(
                allowedSlippage,
                allocationWithdrawalAmounts.longTokenBeforeSwapAmount,
              );

        const minShortTokenAmount =
          allocationWithdrawalAmounts.shortTokenSwapPathStats
            ? applySlippageToMinOut(
                allowedSlippage,
                allocationWithdrawalAmounts.shortTokenSwapPathStats.amountOut,
              )
            : applySlippageToMinOut(
                allowedSlippage,
                allocationWithdrawalAmounts.shortTokenBeforeSwapAmount,
              );

        result.push({
          marketAddress,
          hlvTokenAmount: allocationHlvTokenAmount,
          minLongTokenAmount,
          minShortTokenAmount,
        });
      }

      return result.length > 0
        ? { allocations: result, quoteFeeUsd, quoteInputUsd }
        : undefined;
    } catch (error) {
      console.error('Failed to build HLV withdrawal allocations:', error);
      return undefined;
    }
  }, [
    withdrawalAllocation.allocations,
    marketsInfoData,
    tokensData,
    marketTokensData,
    hlvTokenData,
    hlvTokenAmount,
    hlvTokenUsd,
    receiveTokenAddress,
    pricesMap,
    hzSdk?.chainId,
    allowedSlippage,
    getObjectId,
  ]);
  const withdrawalAllocations = withdrawalAllocationResult?.allocations;
  const usesWithdrawalAllocations = withdrawalAllocation.allocations.length > 1;
  const quoteFeeUsd = usesWithdrawalAllocations
    ? withdrawalAllocationResult?.quoteFeeUsd
    : withdrawalAmounts?.swapFeeUsd;
  const quoteInputUsd = usesWithdrawalAllocations
    ? withdrawalAllocationResult?.quoteInputUsd
    : withdrawalAmounts?.marketTokenUsd;

  const minLongTokenAmount = useMemo<bigint | undefined>(() => {
    if (!withdrawalAmounts) return undefined;

    if (withdrawalAmounts.longTokenSwapPathStats) {
      return applySlippageToMinOut(
        allowedSlippage,
        withdrawalAmounts.longTokenSwapPathStats.amountOut,
      );
    }
    return applySlippageToMinOut(
      allowedSlippage,
      withdrawalAmounts.longTokenBeforeSwapAmount,
    );
  }, [withdrawalAmounts, allowedSlippage]);

  const minShortTokenAmount = useMemo<bigint | undefined>(() => {
    if (!withdrawalAmounts) return undefined;

    if (withdrawalAmounts.shortTokenSwapPathStats) {
      return applySlippageToMinOut(
        allowedSlippage,
        withdrawalAmounts.shortTokenSwapPathStats.amountOut,
      );
    }
    return applySlippageToMinOut(
      allowedSlippage,
      withdrawalAmounts.shortTokenBeforeSwapAmount,
    );
  }, [withdrawalAmounts, allowedSlippage]);

  const swapsCount = useMemo(() => {
    if (!withdrawalAmounts) return 0n;
    const longSwaps = BigInt(
      withdrawalAmounts.longTokenSwapPathStats?.swapPath?.length ?? 0,
    );
    const shortSwaps = BigInt(
      withdrawalAmounts.shortTokenSwapPathStats?.swapPath?.length ?? 0,
    );
    return longSwaps + shortSwaps;
  }, [withdrawalAmounts]);

  const { data: gasLimits } = useGasLimits();
  const { data: gasPrice, refetch: refetchGasPrice } = useGasPrice();

  const calculateExecutionFee = useCallback(
    (currentGasPrice: bigint) => {
      if (
        !gasLimits ||
        !nativeTokenPrices ||
        !tokensData ||
        marketsCount === 0n
      ) {
        return undefined;
      }

      const oraclePriceCount = estimateHzvWithdrawalOraclePriceCount(
        marketsCount,
        swapsCount,
      );

      const gasLimit = estimateExecuteHzvWithdrawalGasLimit(gasLimits, {
        marketsCount,
        swapsCount,
        callbackGasLimit: 0n,
      });

      return getExecutionFee(
        hzSdk?.chainId ?? 56,
        gasLimits,
        nativeTokenPrices,
        tokensData,
        gasLimit,
        currentGasPrice,
        oraclePriceCount,
      );
    },
    [
      gasLimits,
      nativeTokenPrices,
      tokensData,
      hzSdk?.chainId,
      swapsCount,
      marketsCount,
    ],
  );

  const executionFee = useMemo<ExecutionFee | undefined>(() => {
    if (gasPrice === undefined) return undefined;
    return calculateExecutionFee(gasPrice);
  }, [calculateExecutionFee, gasPrice]);

  useEffect(() => {
    if (!executionFee) return;
    const feeDebugInfo = {
      chainId: hzSdk?.chainId ?? 0,
      vaultAddress: vaultDetail?.vault_address,
      selectedMarketAddress,
      hlvTokenAmount: hlvTokenAmount.toString(),
      marketsCount: marketsCount.toString(),
      swapsCount: swapsCount.toString(),
      feeTokenAmount: executionFee.feeTokenAmount.toString(),
      feeUsd: executionFee.feeUsd.toString(),
      gasLimit: executionFee.gasLimit.toString(),
      isFeeHigh: executionFee.isFeeHigh,
      isFeeVeryHigh: executionFee.isFeeVeryHigh,
    };
    if (executionFee.feeTokenAmount <= 0n) {
      console.warn(
        '[executionFee][hzv-withdraw] non-positive fee',
        feeDebugInfo,
      );
    }
  }, [
    executionFee,
    hzSdk?.chainId,
    vaultDetail?.vault_address,
    selectedMarketAddress,
    hlvTokenAmount,
    marketsCount,
    swapsCount,
  ]);

  const isLoading =
    isTokensLoading ||
    isMarketsInfoLoading ||
    isMarketTokensLoading ||
    isMarketTokenDataLoading;

  const isReady = useMemo(() => {
    const needsAllocations = withdrawalAllocation.allocations.length > 1;
    const hasAllocations =
      !needsAllocations ||
      (withdrawalAllocations && withdrawalAllocations.length > 0);
    const hasAllocationCoverage =
      hlvTokenAmount === 0n || withdrawalAllocation.allocations.length > 0;
    return !!(
      hzSdk &&
      account &&
      vaultDetail &&
      selectedMarketAddress &&
      selectedMarketInfo &&
      withdrawalAmounts &&
      hasLiveWithdrawalCaps &&
      hasAllocations &&
      hasAllocationCoverage &&
      !withdrawalAllocation.exceedsCapacity &&
      !!tokensData &&
      !!nativeTokenPrices &&
      !!gasLimits &&
      marketsCount > 0n &&
      minLongTokenAmount !== undefined &&
      minShortTokenAmount !== undefined &&
      hlvTokenAmount > 0n
    );
  }, [
    hzSdk,
    account,
    vaultDetail,
    selectedMarketAddress,
    selectedMarketInfo,
    withdrawalAmounts,
    hasLiveWithdrawalCaps,
    withdrawalAllocation.allocations,
    withdrawalAllocation.exceedsCapacity,
    withdrawalAllocations,
    tokensData,
    nativeTokenPrices,
    gasLimits,
    marketsCount,
    minLongTokenAmount,
    minShortTokenAmount,
    hlvTokenAmount,
  ]);

  const onWithdraw = useCallback(async (): Promise<
    `0x${string}` | undefined
  > => {
    if (!isReady) {
      console.warn('[executionFee][hzv-withdraw] blocked before submit', {
        isReady,
        hasHzSdk: !!hzSdk,
        hasAccount: !!account,
        hasVaultDetail: !!vaultDetail,
        selectedMarketAddress,
        hasExecutionFee: !!executionFee,
        feeTokenAmount: executionFee?.feeTokenAmount?.toString() ?? 'undefined',
        hasWithdrawalAmounts: !!withdrawalAmounts,
        hasMinLong: minLongTokenAmount !== undefined,
        hasMinShort: minShortTokenAmount !== undefined,
        hlvTokenAmount: hlvTokenAmount.toString(),
        allocationCount: withdrawalAllocation.allocations.length,
        exceedsCapacity: withdrawalAllocation.exceedsCapacity,
      });
      return undefined;
    }

    if (
      !hzSdk ||
      !account ||
      !vaultDetail ||
      !vaultDetail.vault_address ||
      !vaultDetail.vault_token_address ||
      !selectedMarketAddress ||
      !withdrawalAmounts ||
      minLongTokenAmount === undefined ||
      minShortTokenAmount === undefined
    ) {
      return undefined;
    }

    const hlvAddress = getAddress(vaultDetail.vault_address) as Address;

    const refreshedGasPrice = await refetchGasPrice();
    if (refreshedGasPrice.error || refreshedGasPrice.data === undefined) {
      throw (
        refreshedGasPrice.error ??
        new Error('Failed to refresh gas price before withdrawal')
      );
    }

    const submissionGasPrice = refreshedGasPrice.data;
    const submissionExecutionFee = calculateExecutionFee(submissionGasPrice);
    if (
      !submissionExecutionFee ||
      submissionExecutionFee.feeTokenAmount <= 0n
    ) {
      console.warn(
        '[useHzvWithdrawTransaction] Failed to calculate submission execution fee',
      );
      return undefined;
    }

    const marketAllocations =
      withdrawalAllocations && withdrawalAllocations.length > 1
        ? withdrawalAllocations
        : undefined;

    const txHash = await hzSdk.liquidity.createHlvWithdrawal({
      hlvAddress,
      hlvTokenAddress: getAddress(vaultDetail.vault_token_address) as Address,
      marketAddress: selectedMarketAddress,
      hlvTokenAmount,
      minLongTokenAmount,
      minShortTokenAmount,
      executionFee: submissionExecutionFee.feeTokenAmount,
      gasPrice: submissionGasPrice,
      marketAllocations,
    });

    return txHash;
  }, [
    isReady,
    hzSdk,
    account,
    vaultDetail,
    selectedMarketAddress,
    executionFee,
    calculateExecutionFee,
    refetchGasPrice,
    withdrawalAmounts,
    minLongTokenAmount,
    minShortTokenAmount,
    withdrawalAllocations,
    hlvTokenAmount,
    withdrawalAllocation.allocations.length,
    withdrawalAllocation.exceedsCapacity,
  ]);

  return {
    withdrawalAmounts,
    quoteFeeUsd,
    quoteInputUsd,
    executionFee,
    minLongTokenAmount,
    minShortTokenAmount,
    selectedMarketAddress,
    allocationCount: Math.max(withdrawalAllocation.allocations.length, 1),
    isLoading,
    isReady,
    onWithdraw,
  };
}
