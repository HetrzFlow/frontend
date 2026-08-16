import { computeVaultDepositAllocationCaps } from '@/queries/bsc/vaults/caps';
import type { MarketExposureItem } from '@/services/rest/vaults';
import type {
  MarketTokensData,
  HlvMarket,
} from '@/stores/synthetics/marketTokens/types';
import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import type { TokenPricesData } from '@hertzflow/sdk-v2/types/tokens';
import type { Address } from 'viem';

const BPS_DIVISOR = 10_000n;
const BUFFER_BPS = 1_000n;
const PRIMARY_ALLOCATION_BPS = BPS_DIVISOR - BUFFER_BPS;

export interface MarketAllocation {
  marketAddress: Address;
  amountUsd: bigint;
  amount?: bigint;
}

export interface AllocateVaultLiquidityParams {
  marketExposure: MarketExposureItem[];
  marketsInfoData: Record<Address, MarketInfo> | undefined;
  marketTokensData: MarketTokensData | undefined;
  hlvMarkets: HlvMarket[];
  depositAmountUsd: bigint;
  depositAmount?: bigint;
  depositTokenPrice?: bigint;
  depositTokenDecimals?: number;
  pricesData?: TokenPricesData;
  depositUiFeeFactor?: bigint;
  conservativeProjectedCap?: boolean;
}

export interface AllocateVaultLiquidityResult {
  allocations: MarketAllocation[];
  exceedsCapacity: boolean;
  totalAvailableCapacity: bigint;
  totalAvailableCapacityAmount: bigint;
  primaryMarket: Address | undefined;
}

export function hasCompleteVaultLiquidityData({
  marketExposure,
  marketsInfoData,
  marketTokensData,
  hlvMarkets,
}: Pick<
  AllocateVaultLiquidityParams,
  'marketExposure' | 'marketsInfoData' | 'marketTokensData' | 'hlvMarkets'
>): boolean {
  if (
    marketExposure.length === 0 ||
    !marketsInfoData ||
    !marketTokensData ||
    hlvMarkets.length === 0
  ) {
    return false;
  }

  return marketExposure.every(({ market_address }) => {
    const normalizedAddress = market_address.toLowerCase();
    const hasMarketInfo = Object.keys(marketsInfoData).some(
      (address) => address.toLowerCase() === normalizedAddress,
    );
    const marketTokenData = Object.entries(marketTokensData).find(
      ([address]) => address.toLowerCase() === normalizedAddress,
    )?.[1];
    const hasMarketTokenData =
      marketTokenData !== undefined &&
      marketTokenData.prices.minPrice > 0n &&
      marketTokenData.prices.maxPrice > 0n;
    const hasHlvMarket = hlvMarkets.some(
      (market) => market.address.toLowerCase() === normalizedAddress,
    );

    return hasMarketInfo && hasMarketTokenData && hasHlvMarket;
  });
}

function getRoundOneOffer(
  effectiveCapUsd: bigint,
  currentVaultUsd: bigint,
  allocatedUsd: bigint,
) {
  const bufferedCapUsd =
    (effectiveCapUsd * PRIMARY_ALLOCATION_BPS) / BPS_DIVISOR;
  const consumedUsd = currentVaultUsd + allocatedUsd;
  return bufferedCapUsd > consumedUsd ? bufferedCapUsd - consumedUsd : 0n;
}

export function allocateVaultLiquidity(
  params: AllocateVaultLiquidityParams,
): AllocateVaultLiquidityResult {
  const {
    marketExposure,
    marketsInfoData,
    marketTokensData,
    hlvMarkets,
    depositAmountUsd,
    depositAmount,
    depositTokenPrice,
    depositTokenDecimals,
    pricesData,
    depositUiFeeFactor,
    conservativeProjectedCap,
  } = params;

  if (!marketExposure?.length) {
    return {
      allocations: [],
      exceedsCapacity: false,
      totalAvailableCapacity: 0n,
      totalAvailableCapacityAmount: 0n,
      primaryMarket: undefined,
    };
  }

  const marketsCapacity = computeVaultDepositAllocationCaps({
    marketExposure,
    marketsInfoData,
    marketTokensData,
    hlvMarkets,
    depositTokenPrice,
    depositTokenDecimals,
    pricesData,
    depositUiFeeFactor,
    conservativeProjectedCap,
  });

  if (!marketsCapacity?.length) {
    return {
      allocations: [],
      exceedsCapacity: false,
      totalAvailableCapacity: 0n,
      totalAvailableCapacityAmount: 0n,
      primaryMarket: undefined,
    };
  }

  marketsCapacity.sort((a, b) => {
    if (a.maxCapUsd !== b.maxCapUsd) {
      return a.maxCapUsd > b.maxCapUsd ? -1 : 1;
    }
    if (a.currentVaultUsd !== b.currentVaultUsd) {
      return a.currentVaultUsd > b.currentVaultUsd ? -1 : 1;
    }
    return a.marketAddress.localeCompare(b.marketAddress);
  });

  const marketsAvailableCapacity = marketsCapacity.reduce(
    (sum, market) => sum + market.totalAvailableCapacity,
    0n,
  );
  const marketsAvailableCapacityAmount = marketsCapacity.reduce(
    (sum, market) => sum + market.totalAvailableCapacityAmount,
    0n,
  );
  const totalAvailableCapacity = marketsAvailableCapacity;
  const totalAvailableCapacityAmount = marketsAvailableCapacityAmount;
  const exceedsCapacity =
    depositAmountUsd > totalAvailableCapacity ||
    (depositAmount !== undefined &&
      depositAmount > totalAvailableCapacityAmount);

  if (
    depositAmount !== undefined &&
    depositAmount > 0n &&
    depositAmountUsd > 0n
  ) {
    const allocated = new Map<Address, bigint>();
    let remainingAmount =
      depositAmount < totalAvailableCapacityAmount
        ? depositAmount
        : totalAvailableCapacityAmount;

    const getAmountForUsd = (usd: bigint) =>
      (depositAmount * usd) / depositAmountUsd;
    const getUsdForAmount = (amount: bigint) =>
      (depositAmountUsd * amount) / depositAmount;

    for (const market of marketsCapacity) {
      if (remainingAmount <= 0n) break;
      const offerUsd = getRoundOneOffer(
        market.effectiveCapUsd,
        market.currentVaultUsd,
        0n,
      );
      const offerAmount = getAmountForUsd(offerUsd);
      const availableOffer =
        offerAmount < market.totalAvailableCapacityAmount
          ? offerAmount
          : market.totalAvailableCapacityAmount;
      if (availableOffer <= 0n) continue;
      const amount =
        remainingAmount <= availableOffer ? remainingAmount : availableOffer;
      allocated.set(market.marketAddress, amount);
      remainingAmount -= amount;
    }

    if (remainingAmount > 0n) {
      for (const market of marketsCapacity) {
        if (remainingAmount <= 0n) break;
        const alreadyAllocated = allocated.get(market.marketAddress) ?? 0n;
        const fullCap = market.totalAvailableCapacityAmount;
        const remaining =
          fullCap > alreadyAllocated ? fullCap - alreadyAllocated : 0n;
        if (remaining <= 0n) continue;
        const amount =
          remainingAmount <= remaining ? remainingAmount : remaining;
        allocated.set(market.marketAddress, alreadyAllocated + amount);
        remainingAmount -= amount;
      }
    }

    const allocations: MarketAllocation[] = [];
    for (const market of marketsCapacity) {
      const amount = allocated.get(market.marketAddress);
      if (amount && amount > 0n) {
        allocations.push({
          marketAddress: market.marketAddress,
          amountUsd: getUsdForAmount(amount),
          amount,
        });
      }
    }

    return {
      allocations,
      exceedsCapacity,
      totalAvailableCapacity,
      totalAvailableCapacityAmount,
      primaryMarket: allocations[0]?.marketAddress,
    };
  }

  const allocated = new Map<Address, bigint>();
  let remainingAmount =
    depositAmountUsd < totalAvailableCapacity
      ? depositAmountUsd
      : totalAvailableCapacity;

  for (const market of marketsCapacity) {
    if (remainingAmount <= 0n) break;
    const offer = getRoundOneOffer(
      market.effectiveCapUsd,
      market.currentVaultUsd,
      0n,
    );
    const availableOffer =
      offer < market.totalAvailableCapacity
        ? offer
        : market.totalAvailableCapacity;
    if (availableOffer <= 0n) continue;
    const amount =
      remainingAmount <= availableOffer ? remainingAmount : availableOffer;
    allocated.set(market.marketAddress, amount);
    remainingAmount -= amount;
  }

  if (remainingAmount > 0n) {
    for (const market of marketsCapacity) {
      if (remainingAmount <= 0n) break;
      const alreadyAllocated = allocated.get(market.marketAddress) ?? 0n;
      const fullCap = market.totalAvailableCapacity;
      const remaining =
        fullCap > alreadyAllocated ? fullCap - alreadyAllocated : 0n;
      if (remaining <= 0n) continue;
      const amount = remainingAmount <= remaining ? remainingAmount : remaining;
      allocated.set(market.marketAddress, alreadyAllocated + amount);
      remainingAmount -= amount;
    }
  }

  const allocations: MarketAllocation[] = [];
  for (const market of marketsCapacity) {
    const amount = allocated.get(market.marketAddress);
    if (amount && amount > 0n) {
      allocations.push({
        marketAddress: market.marketAddress,
        amountUsd: amount,
      });
    }
  }

  return {
    allocations,
    exceedsCapacity,
    totalAvailableCapacity,
    totalAvailableCapacityAmount,
    primaryMarket: allocations[0]?.marketAddress,
  };
}
