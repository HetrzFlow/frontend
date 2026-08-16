import { BASIS_POINTS_DIVISOR } from "configs/factors";
import { getInternalUsdCollateralPriceTokenAddress } from "configs/internalUsd";
import { getTokenVisualMultiplier, NATIVE_TOKEN_ADDRESS } from "configs/tokens";
import { ContractMarketPrices, Market, MarketConfig, MarketInfo, MarketValues } from "types/markets";
import { Token, TokenData, TokenPrices, TokensData } from "types/tokens";

import { bigMath } from "./bigmath";
import { applyFactor, BASIS_POINTS_DIVISOR_BIGINT, expandDecimals, PRECISION, USD_DECIMALS } from "./numbers";
import { getByKey } from "./objects";
import { convertToContractTokenPrices, convertToTokenAmount, convertToUsd, getMidPrice } from "./tokens";
import { Address } from "viem";

export function getMarketFullName(p: { longToken: Token; shortToken: Token; indexToken: Token; isSpotOnly: boolean }) {
  const { indexToken, longToken, shortToken, isSpotOnly } = p;

  return `${getMarketIndexName({ indexToken, isSpotOnly })} [${getMarketPoolName({ longToken, shortToken })}]`;
}

export function getMarketIndexName(p: ({ indexToken: Token } | { hlvToken: Token }) & { isSpotOnly: boolean }) {
  if (p.isSpotOnly) {
    return `SWAP-ONLY`;
  }

  return `${getMarketBaseName(p)}/USD`;
}

export function getMarketBaseName(p: ({ indexToken: Token } | { hlvToken: Token }) & { isSpotOnly: boolean }) {
  const { isSpotOnly } = p;

  const firstToken = "indexToken" in p ? p.indexToken : p.hlvToken;

  if (isSpotOnly) {
    return `SWAP-ONLY`;
  }

  const prefix = getTokenVisualMultiplier(firstToken);

  return `${prefix}${firstToken.baseSymbol || firstToken.symbol}`;
}

export function getMarketPoolName(p: { longToken: Token; shortToken: Token }, separator = "-") {
  const { longToken, shortToken } = p;

  return `${longToken.symbol}${separator}${shortToken.symbol}`;
}

export function getContractMarketPrices(
  tokensData: Record<Address, { decimals: number }>,
  market: Market,
  prices: Record<Address, TokenPrices>,
  chainId?: number
): ContractMarketPrices | undefined {
  const indexToken = getByKey(tokensData, market.indexTokenAddress);
  const longToken = getByKey(tokensData, market.longTokenAddress);
  const shortToken = getByKey(tokensData, market.shortTokenAddress);
  const indexTokenPrices = getByKey(prices, market.indexTokenAddress);
  const longTokenPrices = getByKey(
    prices,
    getInternalUsdCollateralPriceTokenAddress({
      chainId,
      collateralTokenAddress: market.longTokenAddress,
    })
  );
  const shortTokenPrices = getByKey(
    prices,
    getInternalUsdCollateralPriceTokenAddress({
      chainId,
      collateralTokenAddress: market.shortTokenAddress,
    })
  );

  if (!indexToken || !longToken || !shortToken || !indexTokenPrices || !longTokenPrices || !shortTokenPrices) {
    return undefined;
  }

  return {
    indexTokenPrice: indexToken && convertToContractTokenPrices(indexTokenPrices, indexToken.decimals),
    longTokenPrice: longToken && convertToContractTokenPrices(longTokenPrices, longToken.decimals),
    shortTokenPrice: shortToken && convertToContractTokenPrices(shortTokenPrices, shortToken.decimals),
  };
}

/**
 * Apart from usual cases, returns `long` for single token backed markets.
 */
export function getTokenPoolType(
  marketInfo: {
    longToken: Token;
    shortToken: Token;
  },
  tokenAddress: string
): "long" | "short" | undefined {
  const { longToken, shortToken } = marketInfo;

  if (longToken.address === shortToken.address && tokenAddress === longToken.address) {
    return "long";
  }

  if (tokenAddress === longToken.address || (tokenAddress === NATIVE_TOKEN_ADDRESS && longToken.isWrapped)) {
    return "long";
  }

  if (tokenAddress === shortToken.address || (tokenAddress === NATIVE_TOKEN_ADDRESS && shortToken.isWrapped)) {
    return "short";
  }

  return undefined;
}

export function getPoolUsdWithoutPnl(
  marketInfo: {
    longPoolAmount: bigint;
    shortPoolAmount: bigint;
    longTokenAddress: string;
    shortTokenAddress: string;
  },
  isLong: boolean,
  priceType: "minPrice" | "maxPrice" | "midPrice",
  longTokenPrices: TokenPrices,
  shortTokenPrices: TokenPrices,
  tokensData: TokensData
) {
  const poolAmount = isLong ? marketInfo.longPoolAmount : marketInfo.shortPoolAmount;
  const tokenAddress = isLong ? marketInfo.longTokenAddress : marketInfo.shortTokenAddress;
  const token = tokensData[tokenAddress];
  const tokenPrices = isLong ? longTokenPrices : shortTokenPrices;

  if (!token || !tokenPrices || !poolAmount) {
    return 0n;
  }

  let price: bigint | undefined;

  if (priceType === "minPrice") {
    price = tokenPrices.minPrice;
  } else if (priceType === "maxPrice") {
    price = tokenPrices.maxPrice;
  } else {
    price = getMidPrice(tokenPrices);
  }

  return convertToUsd(poolAmount, token.decimals, price)!;
}

export function getCappedPoolPnl(p: { marketInfo: MarketInfo; poolUsd: bigint; poolPnl: bigint; isLong: boolean }) {
  const { marketInfo, poolUsd, poolPnl, isLong } = p;

  if (poolPnl < 0) {
    return poolPnl;
  }

  const maxPnlFactor: bigint = isLong ? marketInfo.maxPnlFactorForTradersLong : marketInfo.maxPnlFactorForTradersShort;
  const maxPnl = applyFactor(poolUsd, maxPnlFactor);

  return poolPnl > maxPnl ? maxPnl : poolPnl;
}

export function getMaxLeverageByMinCollateralFactor(minCollateralFactor: bigint | undefined) {
  return getLeverageByCollateralFactor(minCollateralFactor, "floor");
}

const MAX_ALLOWED_LEVERAGE_STEP_BP = 5 * BASIS_POINTS_DIVISOR;

export function getMaxAllowedLeverage({
  minCollateralFactor,
  minCollateralFactorForLiquidation,
  positionFeeFactorForBalanceWasNotImproved,
}: {
  minCollateralFactor: bigint | undefined;
  minCollateralFactorForLiquidation: bigint | undefined;
  positionFeeFactorForBalanceWasNotImproved: bigint | undefined;
}) {
  if (
    minCollateralFactor === undefined ||
    minCollateralFactor === 0n ||
    minCollateralFactorForLiquidation === undefined ||
    minCollateralFactorForLiquidation === 0n ||
    positionFeeFactorForBalanceWasNotImproved === undefined
  ) {
    return 100 * BASIS_POINTS_DIVISOR;
  }

  const openingDenominator = minCollateralFactor + 2n * positionFeeFactorForBalanceWasNotImproved;
  const openingMaxBp = bigMath.mulDiv(PRECISION, BASIS_POINTS_DIVISOR_BIGINT, openingDenominator);

  const liquidationDenominator = 2n * minCollateralFactorForLiquidation;
  const liquidationMaxBp = bigMath.mulDiv(PRECISION, BASIS_POINTS_DIVISOR_BIGINT, liquidationDenominator);

  const rawMaxBp = bigMath.min(openingMaxBp, liquidationMaxBp);

  return Math.floor(Number(rawMaxBp) / MAX_ALLOWED_LEVERAGE_STEP_BP) * MAX_ALLOWED_LEVERAGE_STEP_BP;
}

export function getMaxAllowedLeverageByMinCollateralFactor(
  minCollateralFactor: bigint | undefined,
  p?: {
    minCollateralFactorForLiquidation?: bigint;
    positionFeeFactor?: bigint;
  }
) {
  return getMaxAllowedLeverage({
    minCollateralFactor,
    minCollateralFactorForLiquidation: p?.minCollateralFactorForLiquidation,
    positionFeeFactorForBalanceWasNotImproved: p?.positionFeeFactor,
  });
}

export function getMinLeverageByMaxCollateralFactor(maxCollateralFactor: bigint | undefined) {
  return getLeverageByCollateralFactor(maxCollateralFactor, "ceil");
}

function getLeverageByCollateralFactor(collateralFactor: bigint | undefined, rounding: "floor" | "ceil") {
  if (collateralFactor === undefined) return 100 * BASIS_POINTS_DIVISOR;
  if (collateralFactor === 0n) return 100 * BASIS_POINTS_DIVISOR;

  const leverage = bigMath.mulDiv(PRECISION, BASIS_POINTS_DIVISOR_BIGINT, collateralFactor);
  const step = MAX_ALLOWED_LEVERAGE_STEP_BP;

  return (rounding === "ceil" ? Math.ceil(Number(leverage) / step) : Math.floor(Number(leverage) / step)) * step;
}

export function getOppositeCollateral(marketInfo: MarketInfo, tokenAddress: string) {
  const poolType = getTokenPoolType(marketInfo, tokenAddress);

  if (poolType === "long") {
    return marketInfo.shortToken;
  }

  if (poolType === "short") {
    return marketInfo.longToken;
  }

  return undefined;
}

export function getAvailableUsdLiquidityForCollateral(
  marketInfo: {
    longInterestInTokens: bigint;
    shortInterestUsd: bigint;
    isSpotOnly: boolean;
    longPoolAmount: bigint;
    shortPoolAmount: bigint;
    longTokenAddress: string;
    shortTokenAddress: string;
    indexTokenAddress: string;
    reserveFactorLong: bigint;
    reserveFactorShort: bigint;
  },
  isLong: boolean,
  prices: Record<Address, TokenPrices>,
  tokensData: TokensData
) {
  const poolUsd = getPoolUsdWithoutPnl(
    marketInfo,
    isLong,
    "minPrice",
    prices[marketInfo.longTokenAddress],
    prices[marketInfo.shortTokenAddress],
    tokensData
  );

  if (!poolUsd) {
    return 0n;
  }

  if (marketInfo.isSpotOnly) {
    return poolUsd;
  }

  const reservedUsd = getReservedUsd(
    marketInfo,
    isLong,
    prices[marketInfo.indexTokenAddress],
    tokensData[marketInfo.indexTokenAddress]
  );
  const maxReserveFactor = isLong ? marketInfo.reserveFactorLong : marketInfo.reserveFactorShort;

  if (maxReserveFactor === 0n) {
    return 0n;
  }

  const minPoolUsd = (reservedUsd * PRECISION) / maxReserveFactor;

  const liquidity = poolUsd - minPoolUsd;

  return liquidity;
}

export function getReservedUsd(
  marketInfo: {
    longInterestInTokens: bigint;
    shortInterestUsd: bigint;
  },
  isLong: boolean,
  indexTokenPrices: TokenPrices,
  indexToken: TokenData
) {
  if (!indexTokenPrices || !indexToken) {
    return 0n;
  }

  if (isLong) {
    return convertToUsd(marketInfo.longInterestInTokens, indexToken.decimals, indexTokenPrices.maxPrice) ?? 0n;
  } else {
    return marketInfo.shortInterestUsd ?? 0n;
  }
}

export function getMarketDivisor({
  longTokenAddress,
  shortTokenAddress,
}: {
  longTokenAddress: string;
  shortTokenAddress: string;
}) {
  return longTokenAddress === shortTokenAddress ? 2n : 1n;
}

export function getMarketPnl(
  marketInfo: MarketInfo,
  indexTokenPrices: TokenPrices,
  isLong: boolean,
  forMaxPoolValue: boolean
) {
  const maximize = !forMaxPoolValue;
  const openInterestUsd = getOpenInterestUsd(marketInfo, isLong);
  const openInterestInTokens = getOpenInterestInTokens(marketInfo, isLong);

  if (openInterestUsd === 0n || openInterestInTokens === 0n) {
    return 0n;
  }

  const price = getPriceForPnl(indexTokenPrices, isLong, maximize);

  const openInterestValue = convertToUsd(openInterestInTokens, marketInfo.indexToken.decimals, price)!;
  const pnl = isLong ? openInterestValue - openInterestUsd : openInterestUsd - openInterestValue;

  return pnl;
}

export function getOpenInterestUsd(marketInfo: MarketInfo, isLong: boolean) {
  return (isLong ? marketInfo.longInterestUsd : marketInfo.shortInterestUsd) ?? 0n;
}

export function getOpenInterestInTokens(marketInfo: MarketInfo, isLong: boolean) {
  return (isLong ? marketInfo.longInterestInTokens : marketInfo.shortInterestInTokens) ?? 0n;
}

export function getPriceForPnl(prices: TokenPrices, isLong: boolean, maximize: boolean) {
  // for long positions, pick the larger price to maximize pnl
  // for short positions, pick the smaller price to maximize pnl
  if (isLong) {
    return maximize ? prices.maxPrice : prices.minPrice;
  }

  return maximize ? prices.minPrice : prices.maxPrice;
}

export function getIsMarketAvailableForExpressSwaps(marketInfo: MarketInfo) {
  return [marketInfo.indexToken, marketInfo.longToken, marketInfo.shortToken].every(
    (token) => token.hasPriceFeedProvider
  );
}

export function usdToMarketTokenAmount(
  marketInfo: MarketInfo,
  marketTokenDecimals: number,
  marketTokenTotalSupply: bigint,
  usdValue: bigint
): bigint {
  const supply = marketTokenTotalSupply;
  const poolValue = marketInfo.poolValueMax ?? 0n;

  if (supply === 0n && poolValue === 0n) {
    return convertToTokenAmount(usdValue, marketTokenDecimals, expandDecimals(1, USD_DECIMALS))!;
  }

  if (supply === 0n && poolValue > 0n) {
    return convertToTokenAmount(usdValue + poolValue, marketTokenDecimals, expandDecimals(1, USD_DECIMALS))!;
  }

  if (poolValue === 0n) {
    return 0n;
  }

  return bigMath.mulDiv(supply, usdValue, poolValue);
}

export function marketTokenAmountToUsd(
  marketInfo: MarketInfo,
  marketTokenDecimals: number,
  marketTokenTotalSupply: bigint,
  amount: bigint
): bigint {
  const supply = marketTokenTotalSupply;
  const poolValue = marketInfo.poolValueMax ?? 0n;

  const price =
    supply === 0n
      ? expandDecimals(1, USD_DECIMALS)
      : bigMath.mulDiv(poolValue, expandDecimals(1, marketTokenDecimals), supply);

  return convertToUsd(amount, marketTokenDecimals, price)!;
}

export function getMaxOpenInterestUsd(marketInfo: MarketInfo, isLong: boolean) {
  return (isLong ? marketInfo.maxOpenInterestLong : marketInfo.maxOpenInterestShort) ?? 0n;
}

export const MAX_RESERVED_USD_FRONTEND_BUFFER_BPS = 5n; // 0.05%

export function getMaxReservedUsd(
  marketInfo: MarketInfo,
  isLong: boolean,
  prices: Record<Address, TokenPrices>,
  tokensData: TokensData
) {
  const poolUsd = getPoolUsdWithoutPnl(
    marketInfo,
    isLong,
    "minPrice",
    prices[marketInfo.longTokenAddress],
    prices[marketInfo.shortTokenAddress],
    tokensData
  );

  let reserveFactor = isLong ? marketInfo.reserveFactorLong : marketInfo.reserveFactorShort;

  const openInterestReserveFactor = isLong
    ? marketInfo.openInterestReserveFactorLong
    : marketInfo.openInterestReserveFactorShort;

  if (openInterestReserveFactor < reserveFactor) {
    reserveFactor = openInterestReserveFactor;
  }

  if (!reserveFactor) {
    return 0n;
  }

  const maxReservedUsd = (poolUsd * reserveFactor) / PRECISION;

  return bigMath.mulDiv(
    maxReservedUsd,
    BASIS_POINTS_DIVISOR_BIGINT - MAX_RESERVED_USD_FRONTEND_BUFFER_BPS,
    BASIS_POINTS_DIVISOR_BIGINT
  );
}

export function getAvailableUsdLiquidityForPosition(
  marketInfo: MarketInfo,
  isLong: boolean,
  prices: Record<Address, TokenPrices>,
  tokensData: TokensData
) {
  if (marketInfo.isSpotOnly) {
    return 0n;
  }

  const maxReservedUsd = getMaxReservedUsd(marketInfo, isLong, prices, tokensData);
  const reservedUsd = getReservedUsd(
    marketInfo,
    isLong,
    prices[marketInfo.indexTokenAddress],
    tokensData[marketInfo.indexTokenAddress]
  );

  const maxOpenInterest = getMaxOpenInterestUsd(marketInfo, isLong);
  const currentOpenInterest = getOpenInterestUsd(marketInfo, isLong);

  const availableLiquidityBasedOnMaxReserve = maxReservedUsd - reservedUsd;
  const availableLiquidityBasedOnMaxOpenInterest = maxOpenInterest - currentOpenInterest;

  const result =
    availableLiquidityBasedOnMaxReserve < availableLiquidityBasedOnMaxOpenInterest
      ? availableLiquidityBasedOnMaxReserve
      : availableLiquidityBasedOnMaxOpenInterest;

  return result < 0 ? 0n : result;
}
