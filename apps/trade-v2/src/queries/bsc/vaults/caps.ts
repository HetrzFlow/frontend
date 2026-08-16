import { getAddress, type Address } from 'viem';
import { HZLP_TOKEN_DECIMALS } from '@/common/constants';
import type { MarketExposureItem } from '@/services/rest/vaults';
import {
  calculateMaxAumForDeposit,
  calculateRemainingDepositCap,
  calculateRemainingDepositTokenCap,
  calculateRemainingWithdrawalCap,
} from '@/stores/synthetics/marketsData/caps';
import type {
  MarketTokensData,
  HlvMarket,
} from '@/stores/synthetics/marketTokens/types';
import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import type {
  TokenPrices,
  TokenPricesData,
} from '@hertzflow/sdk-v2/types/tokens';

export type VaultRemainingCapsResult = {
  remainingDepositCapUsd: bigint | undefined;
  remainingWithdrawalCapUsd: bigint | undefined;
  remainingDepositCapByMarket: Record<Address, bigint>;
  remainingWithdrawalCapByMarket: Record<Address, bigint>;
};

export type VaultDepositAllocationCap = {
  marketAddress: Address;
  symbol: string;
  maxCapUsd: bigint;
  effectiveCapUsd: bigint;
  currentVaultUsd: bigint;
  poolRemainingDepositCapUsd: bigint;
  vaultMarketRemainingCapUsd: bigint;
  totalAvailableCapacityAmount: bigint;
  totalAvailableCapacity: bigint;
};

function normalizeAddress(address: string): Address {
  try {
    return getAddress(address) as Address;
  } catch {
    return address as Address;
  }
}

function parseBigIntValue(
  value: string | bigint | undefined | null,
): bigint | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'bigint') return value;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function getByAddress<T>(
  data: Record<string, T> | undefined,
  marketAddress: string,
): T | undefined {
  if (!data) return undefined;
  const checksumAddress = normalizeAddress(marketAddress);
  return (
    data[checksumAddress] ??
    data[marketAddress] ??
    data[checksumAddress.toLowerCase()] ??
    data[marketAddress.toLowerCase()]
  );
}

function getDepositPrice(prices: TokenPrices | undefined): bigint | undefined {
  if (prices?.maxPrice && prices.maxPrice > 0n) return prices.maxPrice;
  if (prices?.minPrice && prices.minPrice > 0n) return prices.minPrice;
  return undefined;
}

function getWithdrawalPrice(
  prices: TokenPrices | undefined,
): bigint | undefined {
  if (prices?.minPrice && prices.minPrice > 0n) return prices.minPrice;
  return getDepositPrice(prices);
}

function calculateVaultPositionUsd(
  amount: bigint,
  price: bigint | undefined,
): bigint | undefined {
  if (amount === 0n) return 0n;
  if (!price || price <= 0n) return undefined;
  return (amount * price) / 10n ** BigInt(HZLP_TOKEN_DECIMALS);
}

function getVaultDepositToken(marketInfo: MarketInfo) {
  const isSameCollateral =
    marketInfo.longTokenAddress === marketInfo.shortTokenAddress;

  if (isSameCollateral) {
    return marketInfo.longToken ?? marketInfo.shortToken;
  }

  return marketInfo.shortToken;
}

function getTokenAmountForUsd(
  usd: bigint,
  tokenPrice: bigint,
  tokenDecimals?: number,
): bigint {
  if (tokenPrice <= 0n) return 0n;
  return (usd * 10n ** BigInt(tokenDecimals ?? 18)) / tokenPrice;
}

function getHlvMarket(
  hlvMarkets: HlvMarket[],
  marketAddress: Address,
): HlvMarket | undefined {
  const target = marketAddress.toLowerCase();
  return hlvMarkets.find((m) => m.address.toLowerCase() === target);
}

function calculateVaultMarketRemainingCapUsd({
  hlvMarket,
  fallbackMaxCapUsd,
  currentVaultUsd,
  marketTokenPrice,
}: {
  hlvMarket: HlvMarket;
  fallbackMaxCapUsd: bigint;
  currentVaultUsd: bigint;
  marketTokenPrice: bigint | undefined;
}): bigint | undefined {
  const caps: bigint[] = [];
  const maxCapUsd = hlvMarket.hlvMaxMarketTokenBalanceUsd;

  if (maxCapUsd !== undefined) {
    if (maxCapUsd > 0n) {
      caps.push(maxCapUsd > currentVaultUsd ? maxCapUsd - currentVaultUsd : 0n);
    }
  } else if (fallbackMaxCapUsd > 0n) {
    caps.push(
      fallbackMaxCapUsd > currentVaultUsd
        ? fallbackMaxCapUsd - currentVaultUsd
        : 0n,
    );
  }

  if (hlvMarket.hlvMaxMarketTokenBalanceAmount > 0n) {
    if (!marketTokenPrice || marketTokenPrice <= 0n) return undefined;
    const remainingAmount =
      hlvMarket.hlvMaxMarketTokenBalanceAmount > hlvMarket.hzlpBalance
        ? hlvMarket.hlvMaxMarketTokenBalanceAmount - hlvMarket.hzlpBalance
        : 0n;
    caps.push(
      (remainingAmount * marketTokenPrice) / 10n ** BigInt(HZLP_TOKEN_DECIMALS),
    );
  }

  if (!caps.length) return undefined;
  return caps.reduce((min, value) => (value < min ? value : min));
}

function calculatePoolMarketTokenPrice({
  poolValueMax,
  totalSupply,
  marketTokenDecimals,
}: {
  poolValueMax?: bigint;
  totalSupply?: bigint;
  marketTokenDecimals?: number;
}): bigint | undefined {
  if (
    !poolValueMax ||
    poolValueMax <= 0n ||
    !totalSupply ||
    totalSupply <= 0n
  ) {
    return undefined;
  }

  return (
    poolValueMax * 10n ** BigInt(marketTokenDecimals ?? HZLP_TOKEN_DECIMALS)
  ) / totalSupply;
}

function getVaultDepositCapacity({
  marketInfo,
  hlvMarket,
  maxCapUsd,
  currentVaultUsd,
  marketTokenPrice,
  depositTokenPrice,
  depositTokenDecimals,
  pricesData,
  depositUiFeeFactor,
  conservativeProjectedCap = false,
  marketTokenSupply,
  marketTokenDecimals,
  poolValueMax,
}: {
  marketInfo: MarketInfo;
  hlvMarket: HlvMarket;
  maxCapUsd: bigint;
  currentVaultUsd: bigint;
  marketTokenPrice: bigint | undefined;
  depositTokenPrice?: bigint;
  depositTokenDecimals?: number;
  pricesData?: TokenPricesData;
  depositUiFeeFactor?: bigint;
  conservativeProjectedCap?: boolean;
  marketTokenSupply?: bigint;
  marketTokenDecimals?: number;
  poolValueMax?: bigint;
}) {
  if (hlvMarket.isDisabled) {
    return {
      poolCapUsd: 0n,
      effectiveCapUsd: 0n,
      currentVaultUsd: 0n,
      poolRemainingDepositCapUsd: 0n,
      poolRemainingDepositCapAmount: 0n,
      vaultMarketRemainingCapUsd: 0n,
      totalAvailableCapacityAmount: 0n,
      totalAvailableCapacity: 0n,
    };
  }

  const poolCapUsd = calculateMaxAumForDeposit(
    marketInfo,
    depositTokenPrice,
    depositTokenDecimals,
  );
  const poolRemainingDepositCapUsd = calculateRemainingDepositCap(
    marketInfo,
    depositTokenPrice,
    depositTokenDecimals,
    pricesData,
    depositUiFeeFactor ?? 0n,
  );
  const poolRemainingDepositCapAmount = calculateRemainingDepositTokenCap(
    marketInfo,
    pricesData,
    depositUiFeeFactor ?? 0n,
  );
  const projectedMarketTokenPrice = calculatePoolMarketTokenPrice({
    poolValueMax,
    totalSupply: marketTokenSupply,
    marketTokenDecimals,
  });
  // The projected-cap check values the post-deposit HLV balance at the pool
  // price. Revalue the existing balance at that price when it is higher than
  // the current market-token price, reserving only the actual price gap.
  const conservativeMarketTokenPrice =
    conservativeProjectedCap &&
    projectedMarketTokenPrice !== undefined &&
    projectedMarketTokenPrice > (marketTokenPrice ?? 0n)
      ? projectedMarketTokenPrice
      : marketTokenPrice;
  const conservativeCurrentVaultUsd = calculateVaultPositionUsd(
    hlvMarket.hzlpBalance,
    conservativeMarketTokenPrice,
  );
  const effectiveCurrentVaultUsd =
    conservativeCurrentVaultUsd ?? currentVaultUsd;
  const vaultMarketRemainingCapUsd = calculateVaultMarketRemainingCapUsd({
    hlvMarket,
    fallbackMaxCapUsd: maxCapUsd,
    currentVaultUsd: effectiveCurrentVaultUsd,
    marketTokenPrice: conservativeMarketTokenPrice,
  });
  const effectiveCapUsd =
    vaultMarketRemainingCapUsd === undefined
      ? poolCapUsd
      : effectiveCurrentVaultUsd + vaultMarketRemainingCapUsd;
  const rawAvailableCapacity =
    vaultMarketRemainingCapUsd === undefined ||
    poolRemainingDepositCapUsd < vaultMarketRemainingCapUsd
      ? poolRemainingDepositCapUsd
      : vaultMarketRemainingCapUsd;
  const depositToken = getVaultDepositToken(marketInfo);
  const pricedDepositToken =
    depositToken?.address && pricesData?.[depositToken.address]?.maxPrice
      ? pricesData[depositToken.address]
      : undefined;
  const effectiveDepositTokenPrice =
    pricedDepositToken?.maxPrice ?? depositTokenPrice;
  const vaultMarketRemainingCapAmount =
    vaultMarketRemainingCapUsd !== undefined &&
    effectiveDepositTokenPrice !== undefined &&
    effectiveDepositTokenPrice > 0n
      ? getTokenAmountForUsd(
          vaultMarketRemainingCapUsd,
          effectiveDepositTokenPrice,
          depositToken?.decimals ?? depositTokenDecimals,
        )
      : undefined;
  const totalAvailableCapacityAmount =
    vaultMarketRemainingCapAmount === undefined ||
    poolRemainingDepositCapAmount < vaultMarketRemainingCapAmount
      ? poolRemainingDepositCapAmount
      : vaultMarketRemainingCapAmount;

  return {
    poolCapUsd,
    effectiveCapUsd,
    currentVaultUsd: effectiveCurrentVaultUsd,
    poolRemainingDepositCapUsd,
    poolRemainingDepositCapAmount,
    vaultMarketRemainingCapUsd,
    totalAvailableCapacityAmount,
    totalAvailableCapacity: rawAvailableCapacity,
  };
}

export function computeVaultRemainingCaps({
  marketExposure,
  marketsInfoData,
  marketTokensData,
  withdrawalMarketTokensData,
  pricesData,
  depositTokenPrice,
  depositTokenDecimals,
  depositUiFeeFactor,
  hlvMarkets,
}: {
  marketExposure: MarketExposureItem[];
  marketsInfoData: Record<Address, MarketInfo> | undefined;
  marketTokensData: MarketTokensData | undefined;
  withdrawalMarketTokensData?: MarketTokensData | undefined;
  pricesData: TokenPricesData;
  depositTokenPrice?: bigint;
  depositTokenDecimals?: number;
  depositUiFeeFactor?: bigint;
  hlvMarkets: HlvMarket[];
}): VaultRemainingCapsResult {
  let depositReady = hlvMarkets.length > 0;
  let withdrawalReady = hlvMarkets.length > 0;
  let totalMarketRemainingDepositCapUsd = 0n;
  let totalRemainingWithdrawalCapUsd = 0n;
  const remainingDepositCapByMarket = {} as Record<Address, bigint>;
  const remainingWithdrawalCapByMarket = {} as Record<Address, bigint>;

  for (const exposure of marketExposure) {
    const marketAddress = normalizeAddress(exposure.market_address);
    const marketInfo = getByAddress(marketsInfoData, marketAddress);
    const marketTokenData = getByAddress(marketTokensData, marketAddress);
    const withdrawalMarketTokenData = getByAddress(
      withdrawalMarketTokensData ?? marketTokensData,
      marketAddress,
    );
    const maxCapUsd = parseBigIntValue(exposure.max_cap) ?? 0n;

    if (!marketInfo) {
      depositReady = false;
      withdrawalReady = false;
      continue;
    }

    const hlvMarket = getHlvMarket(hlvMarkets, marketAddress);
    if (!hlvMarket) {
      depositReady = false;
      withdrawalReady = false;
      continue;
    }

    const marketTokenPrice = getDepositPrice(marketTokenData?.prices);
    const vaultPositionUsd =
      marketTokenPrice === undefined
        ? undefined
        : calculateVaultPositionUsd(hlvMarket.hzlpBalance, marketTokenPrice);

    if (vaultPositionUsd === undefined) {
      depositReady = false;
    } else {
      const { totalAvailableCapacity } = getVaultDepositCapacity({
        marketInfo,
        hlvMarket,
        maxCapUsd,
        currentVaultUsd: vaultPositionUsd,
        marketTokenPrice: getDepositPrice(marketTokenData?.prices),
        depositTokenPrice,
        depositTokenDecimals,
        pricesData,
        depositUiFeeFactor,
        marketTokenSupply: marketTokenData?.totalSupply,
        marketTokenDecimals: marketTokenData?.decimals,
        poolValueMax: marketInfo.poolValueMax,
      });
      remainingDepositCapByMarket[marketAddress] = totalAvailableCapacity;
      totalMarketRemainingDepositCapUsd += totalAvailableCapacity;
    }

    const poolRemainingWithdrawalCapUsd = withdrawalMarketTokenData
      ? calculateRemainingWithdrawalCap(marketInfo, pricesData)
      : undefined;
    const withdrawalMarketTokenPrice = getWithdrawalPrice(
      withdrawalMarketTokenData?.prices,
    );
    const vaultMarketUsd =
      withdrawalMarketTokenPrice === undefined
        ? undefined
        : calculateVaultPositionUsd(
            hlvMarket.hzlpBalance,
            withdrawalMarketTokenPrice,
          );

    if (
      poolRemainingWithdrawalCapUsd === undefined ||
      vaultMarketUsd === undefined
    ) {
      withdrawalReady = false;
      continue;
    }

    const remainingWithdrawalCapUsd =
      poolRemainingWithdrawalCapUsd < vaultMarketUsd
        ? poolRemainingWithdrawalCapUsd
        : vaultMarketUsd;
    remainingWithdrawalCapByMarket[marketAddress] = remainingWithdrawalCapUsd;
    totalRemainingWithdrawalCapUsd += remainingWithdrawalCapUsd;
  }

  return {
    remainingDepositCapUsd: depositReady
      ? totalMarketRemainingDepositCapUsd
      : undefined,
    remainingWithdrawalCapUsd: withdrawalReady
      ? totalRemainingWithdrawalCapUsd
      : undefined,
    remainingDepositCapByMarket,
    remainingWithdrawalCapByMarket,
  };
}

export function computeVaultDepositAllocationCaps({
  marketExposure,
  marketsInfoData,
  marketTokensData,
  hlvMarkets,
  depositTokenPrice,
  depositTokenDecimals,
  pricesData,
  depositUiFeeFactor,
  conservativeProjectedCap = false,
}: {
  marketExposure: MarketExposureItem[];
  marketsInfoData: Record<Address, MarketInfo> | undefined;
  marketTokensData: MarketTokensData | undefined;
  hlvMarkets: HlvMarket[];
  depositTokenPrice?: bigint;
  depositTokenDecimals?: number;
  pricesData?: TokenPricesData;
  depositUiFeeFactor?: bigint;
  conservativeProjectedCap?: boolean;
}): VaultDepositAllocationCap[] | undefined {
  if (!hlvMarkets.length) return undefined;
  const capacities: VaultDepositAllocationCap[] = [];

  for (const exposure of marketExposure) {
    const marketAddress = normalizeAddress(exposure.market_address);
    const marketInfo = getByAddress(marketsInfoData, marketAddress);
    const marketTokenData = getByAddress(marketTokensData, marketAddress);
    const hlvMarket = getHlvMarket(hlvMarkets, marketAddress);
    const maxCapUsd = parseBigIntValue(exposure.max_cap) ?? 0n;

    if (!marketInfo) {
      return undefined;
    }
    if (!hlvMarket) {
      return undefined;
    }
    if (!marketTokenData) {
      return undefined;
    }

    const currentVaultUsd = calculateVaultPositionUsd(
      hlvMarket.hzlpBalance,
      getDepositPrice(marketTokenData?.prices),
    );
    if (currentVaultUsd === undefined) {
      return undefined;
    }

    const {
      effectiveCapUsd,
      currentVaultUsd: allocationCurrentVaultUsd,
      poolRemainingDepositCapUsd,
      vaultMarketRemainingCapUsd,
      totalAvailableCapacityAmount,
      totalAvailableCapacity,
    } = getVaultDepositCapacity({
      marketInfo,
      hlvMarket,
      maxCapUsd,
      currentVaultUsd,
      marketTokenPrice: getDepositPrice(marketTokenData?.prices),
      depositTokenPrice,
      depositTokenDecimals,
      pricesData,
      depositUiFeeFactor,
      conservativeProjectedCap,
      marketTokenSupply: marketTokenData.totalSupply,
      marketTokenDecimals: marketTokenData.decimals,
      poolValueMax: marketInfo.poolValueMax,
    });

    capacities.push({
      marketAddress,
      symbol: exposure.symbol,
      maxCapUsd,
      effectiveCapUsd,
      currentVaultUsd: allocationCurrentVaultUsd,
      poolRemainingDepositCapUsd,
      vaultMarketRemainingCapUsd:
        vaultMarketRemainingCapUsd ?? poolRemainingDepositCapUsd,
      totalAvailableCapacityAmount,
      totalAvailableCapacity,
    });
  }

  return capacities;
}
