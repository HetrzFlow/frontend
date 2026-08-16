import { bigMath } from '@hertzflow/sdk-v2/utils/bigmath';
import {
  applySwapImpactWithCap,
  getPriceImpactForSwap,
} from '@hertzflow/sdk-v2/utils/fees/index';
import { getMarketPnl, getReservedUsd } from '@hertzflow/sdk-v2/utils/markets';
import { PRECISION } from '@hertzflow/sdk-v2/utils/numbers';
import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import type { TokenPrices, TokenPricesData } from '@hertzflow/sdk-v2/types/tokens';

function getIndexTokenPrices(
  marketInfo: MarketInfo,
  pricesData: TokenPricesData,
): TokenPrices | undefined {
  const prices = pricesData[marketInfo.indexTokenAddress];
  if (prices) return prices;
  return undefined;
}

export function calculateMaxAumForDeposit(
  marketInfo: MarketInfo,
  usdtPrice?: bigint,
  usdtDecimals?: number,
): bigint {
  const { maxPoolAmount, maxPoolUsdForDeposit, poolDivisor } =
    getDepositTokenPoolAmounts(marketInfo);

  const maxPoolUsd = maxPoolUsdForDeposit * poolDivisor;
  if (!usdtPrice || usdtPrice <= 0n) return maxPoolUsd;

  const decimals = BigInt(usdtDecimals ?? 18);
  const tokenCapUsd =
    (maxPoolAmount * poolDivisor * usdtPrice) / 10n ** decimals;

  return bigMath.min(maxPoolUsd, tokenCapUsd);
}

function getUsdForPoolAmount(
  amount: bigint,
  usdtPrice: bigint,
  usdtDecimals?: number,
): bigint {
  const decimals = BigInt(usdtDecimals ?? 18);
  return (amount * usdtPrice) / 10n ** decimals;
}

function getDepositTokenPoolAmounts(marketInfo: MarketInfo) {
  const isSameCollateral =
    marketInfo.longTokenAddress === marketInfo.shortTokenAddress;
  const poolDivisor = isSameCollateral ? 2n : 1n;

  if (isSameCollateral) {
    return {
      maxPoolAmount:
        marketInfo.maxLongPoolAmount ?? marketInfo.maxShortPoolAmount ?? 0n,
      poolAmount: marketInfo.longPoolAmount ?? marketInfo.shortPoolAmount ?? 0n,
      rawPoolAmount:
        marketInfo.longPoolAmountRaw ??
        marketInfo.shortPoolAmountRaw ??
        (marketInfo.longPoolAmount + marketInfo.shortPoolAmount),
      poolDivisor,
      maxPoolUsdForDeposit:
        marketInfo.maxLongPoolUsdForDeposit ??
        marketInfo.maxShortPoolUsdForDeposit ??
        0n,
      token: marketInfo.longToken ?? marketInfo.shortToken,
      tokenAddress: marketInfo.longTokenAddress ?? marketInfo.shortTokenAddress,
    };
  }

  return {
    maxPoolAmount: marketInfo.maxShortPoolAmount ?? 0n,
    poolAmount: marketInfo.shortPoolAmount ?? 0n,
    rawPoolAmount: marketInfo.shortPoolAmount ?? 0n,
    poolDivisor,
    maxPoolUsdForDeposit: marketInfo.maxShortPoolUsdForDeposit ?? 0n,
    token: marketInfo.shortToken,
    tokenAddress: marketInfo.shortTokenAddress,
  };
}

function getEffectivePoolAmount(rawPoolAmount: bigint, poolDivisor: bigint) {
  return rawPoolAmount / poolDivisor;
}

function getRemainingRawDeltaForEffectiveCap({
  maxEffectivePoolAmount,
  rawPoolAmount,
  poolDivisor,
}: {
  maxEffectivePoolAmount: bigint;
  rawPoolAmount: bigint;
  poolDivisor: bigint;
}): bigint {
  if (poolDivisor <= 0n) return 0n;

  const maxRawPoolAmount =
    maxEffectivePoolAmount * poolDivisor + (poolDivisor - 1n);
  return maxRawPoolAmount > rawPoolAmount
    ? maxRawPoolAmount - rawPoolAmount
    : 0n;
}

export function calculateRemainingDepositTokenCap(
  marketInfo: MarketInfo,
  pricesData?: TokenPricesData,
  uiFeeFactor = 0n,
): bigint {
  const exactCap = calculateRemainingDepositInputTokenCap(
    marketInfo,
    pricesData,
    uiFeeFactor,
  );
  if (exactCap !== undefined) return exactCap;

  const { maxPoolAmount, rawPoolAmount, poolDivisor } =
    getDepositTokenPoolAmounts(marketInfo);
  return getRemainingRawDeltaForEffectiveCap({
    maxEffectivePoolAmount: maxPoolAmount,
    rawPoolAmount,
    poolDivisor,
  });
}

export function calculateRemainingDepositCap(
  marketInfo: MarketInfo,
  usdtPrice?: bigint,
  usdtDecimals?: number,
  pricesData?: TokenPricesData,
  uiFeeFactor = 0n,
): bigint {
  const exactTokenCap = calculateRemainingDepositInputTokenCap(
    marketInfo,
    pricesData,
    uiFeeFactor,
  );
  if (exactTokenCap !== undefined) {
    const { token } = getDepositTokenPoolAmounts(marketInfo);
    const tokenPrice =
      token?.address && pricesData?.[token.address]?.maxPrice
        ? pricesData[token.address]?.maxPrice
        : usdtPrice;
    return tokenPrice && tokenPrice > 0n
      ? getUsdForPoolAmount(exactTokenCap, tokenPrice, token?.decimals)
      : 0n;
  }

  const depositToken = getDepositTokenPoolAmounts(marketInfo);
  const poolUsd = usdtPrice
    ? getUsdForPoolAmount(
        getEffectivePoolAmount(
          depositToken.rawPoolAmount,
          depositToken.poolDivisor,
        ),
        usdtPrice,
        usdtDecimals,
      )
    : (marketInfo.poolValueMax ?? marketInfo.poolValueMin ?? 0n);
  const remainingUsdCap =
    depositToken.maxPoolUsdForDeposit > poolUsd
      ? depositToken.maxPoolUsdForDeposit - poolUsd
      : 0n;

  if (!usdtPrice || usdtPrice <= 0n) {
    return remainingUsdCap;
  }

  const amountCap = getRemainingRawDeltaForEffectiveCap({
    maxEffectivePoolAmount: depositToken.maxPoolAmount,
    rawPoolAmount: depositToken.rawPoolAmount,
    poolDivisor: depositToken.poolDivisor,
  });
  const usdAmountCap = getRemainingRawDeltaForEffectiveCap({
    maxEffectivePoolAmount: getTokenAmountForUsd(
      depositToken.maxPoolUsdForDeposit,
      usdtPrice,
      usdtDecimals,
    ),
    rawPoolAmount: depositToken.rawPoolAmount,
    poolDivisor: depositToken.poolDivisor,
  });
  const inputTokenCap = bigMath.min(amountCap, usdAmountCap);

  return getUsdForPoolAmount(inputTokenCap, usdtPrice, usdtDecimals);
}

function getPoolLimitsForToken(marketInfo: MarketInfo, tokenAddress: string) {
  if (tokenAddress === marketInfo.shortTokenAddress) {
    return {
      maxPoolAmount: marketInfo.maxShortPoolAmount ?? 0n,
      poolAmount: marketInfo.shortPoolAmount ?? 0n,
      maxPoolUsdForDeposit: marketInfo.maxShortPoolUsdForDeposit ?? 0n,
      token: marketInfo.shortToken,
    };
  }

  if (tokenAddress === marketInfo.longTokenAddress) {
    return {
      maxPoolAmount: marketInfo.maxLongPoolAmount ?? 0n,
      poolAmount: marketInfo.longPoolAmount ?? 0n,
      maxPoolUsdForDeposit: marketInfo.maxLongPoolUsdForDeposit ?? 0n,
      token: marketInfo.longToken,
    };
  }

  return undefined;
}

function getDepositFeeFactor(
  marketInfo: MarketInfo,
  balanceWasImproved: boolean,
): bigint {
  return balanceWasImproved
    ? (marketInfo.depositFeeFactorForBalanceWasImproved ?? 0n)
    : (marketInfo.depositFeeFactorForBalanceWasNotImproved ?? 0n);
}

function getDepositNetPoolDelta({
  marketInfo,
  inputAmount,
  tokenInPriceImpactDeltaUsd,
  tokenInPrices,
  tokenInDecimals,
  depositFeeFactor,
  uiFeeFactor,
}: {
  marketInfo: MarketInfo;
  inputAmount: bigint;
  tokenInPriceImpactDeltaUsd: bigint;
  tokenInPrices: TokenPrices;
  tokenInDecimals?: number;
  depositFeeFactor: bigint;
  uiFeeFactor: bigint;
}): bigint | undefined {
  const feeAmount = applyFactor(inputAmount, depositFeeFactor);
  const feeReceiverAmount = applyFactor(
    feeAmount,
    marketInfo.swapFeeReceiverFactor ?? 0n,
  );
  const uiFeeAmount = applyFactor(inputAmount, uiFeeFactor);
  const poolDelta =
    inputAmount > feeReceiverAmount + uiFeeAmount
      ? inputAmount - feeReceiverAmount - uiFeeAmount
      : 0n;

  if (tokenInPriceImpactDeltaUsd >= 0n) {
    return poolDelta;
  }

  const { token } = getDepositTokenPoolAmounts(marketInfo);
  if (!token) return undefined;

  const { impactDeltaAmount } = applySwapImpactWithCap(
    marketInfo,
    { ...token, decimals: tokenInDecimals ?? token.decimals },
    tokenInPrices,
    tokenInPriceImpactDeltaUsd,
  );

  if (impactDeltaAmount >= 0n) return poolDelta + impactDeltaAmount;

  const negativeImpactAmount = -impactDeltaAmount;
  return poolDelta > negativeImpactAmount
    ? poolDelta - negativeImpactAmount
    : 0n;
}

function getPositiveImpactPoolDelta({
  marketInfo,
  priceImpactDeltaUsd,
  tokenOut,
  tokenOutPrices,
}: {
  marketInfo: MarketInfo;
  priceImpactDeltaUsd: bigint;
  tokenOut: MarketInfo['longToken'];
  tokenOutPrices: TokenPrices;
}): bigint | undefined {
  if (priceImpactDeltaUsd <= 0n) return 0n;

  if (!tokenOut) return undefined;

  const { impactDeltaAmount } = applySwapImpactWithCap(
    marketInfo,
    tokenOut,
    tokenOutPrices,
    priceImpactDeltaUsd,
  );
  return impactDeltaAmount > 0n ? impactDeltaAmount : 0n;
}

function calculateRemainingDepositInputTokenCap(
  marketInfo: MarketInfo,
  pricesData?: TokenPricesData,
  uiFeeFactor = 0n,
): bigint | undefined {
  const depositToken = getDepositTokenPoolAmounts(marketInfo);
  const tokenIn = depositToken.token;
  if (!pricesData || !tokenIn?.address) return undefined;

  const tokenInPrices = pricesData[tokenIn.address];
  const longTokenPrices = pricesData[marketInfo.longTokenAddress];
  const shortTokenPrices = pricesData[marketInfo.shortTokenAddress];
  const isDepositTokenLong =
    tokenIn.address.toLowerCase() === marketInfo.longTokenAddress.toLowerCase();
  const tokenOut = isDepositTokenLong
    ? marketInfo.shortToken
    : marketInfo.longToken;
  const tokenOutAddress = isDepositTokenLong
    ? marketInfo.shortTokenAddress
    : marketInfo.longTokenAddress;
  const tokenOutPrices = pricesData[tokenOutAddress];
  if (
    !tokenInPrices ||
    !tokenOutPrices ||
    !longTokenPrices ||
    !shortTokenPrices ||
    tokenInPrices.maxPrice <= 0n
  ) {
    return undefined;
  }

  const tokenOutLimits = getPoolLimitsForToken(
    marketInfo,
    tokenOutAddress,
  );
  if (!tokenOutLimits) return undefined;

  const rawAmountCap = getRemainingRawDeltaForEffectiveCap({
    maxEffectivePoolAmount: depositToken.maxPoolAmount,
    rawPoolAmount: depositToken.rawPoolAmount,
    poolDivisor: depositToken.poolDivisor,
  });
  const rawUsdAmountCap = getRemainingRawDeltaForEffectiveCap({
    maxEffectivePoolAmount: getTokenAmountForUsd(
      depositToken.maxPoolUsdForDeposit,
      tokenInPrices.maxPrice,
      tokenIn.decimals,
    ),
    rawPoolAmount: depositToken.rawPoolAmount,
    poolDivisor: depositToken.poolDivisor,
  });
  let high = bigMath.min(rawAmountCap, rawUsdAmountCap);

  if (high <= 0n) return 0n;

  const canDepositAmount = (inputAmount: bigint): boolean => {
    const inputUsd = getUsdForPoolAmount(
      inputAmount,
      (tokenInPrices.minPrice + tokenInPrices.maxPrice) / 2n,
      tokenIn.decimals,
    );
    const longDeltaUsd = isDepositTokenLong ? inputUsd : 0n;
    const shortDeltaUsd = isDepositTokenLong ? 0n : inputUsd;
    const priceImpactValues = getPriceImpactForSwap(
      marketInfo,
      longTokenPrices,
      shortTokenPrices,
      marketInfo.longToken,
      marketInfo.shortToken,
      longDeltaUsd,
      shortDeltaUsd,
      { fallbackToZero: true },
    );
    const depositFeeFactor = getDepositFeeFactor(
      marketInfo,
      priceImpactValues.balanceWasImproved,
    );
    const tokenInDelta = getDepositNetPoolDelta({
      marketInfo,
      inputAmount,
      tokenInPriceImpactDeltaUsd: priceImpactValues.priceImpactDeltaUsd,
      tokenInPrices,
      tokenInDecimals: tokenIn.decimals,
      depositFeeFactor,
      uiFeeFactor,
    });

    if (tokenInDelta === undefined) return false;

    const nextTokenInRawAmount = depositToken.rawPoolAmount + tokenInDelta;
    const nextTokenInAmount = getEffectivePoolAmount(
      nextTokenInRawAmount,
      depositToken.poolDivisor,
    );

    if (nextTokenInAmount > depositToken.maxPoolAmount) return false;
    const nextTokenInUsd = getUsdForPoolAmount(
      nextTokenInAmount,
      tokenInPrices.maxPrice,
      tokenIn.decimals,
    );
    if (nextTokenInUsd > depositToken.maxPoolUsdForDeposit) return false;

    const tokenOutDelta = getPositiveImpactPoolDelta({
      marketInfo,
      priceImpactDeltaUsd: priceImpactValues.priceImpactDeltaUsd,
      tokenOut,
      tokenOutPrices,
    });

    if (tokenOutDelta === undefined) return false;
    if (tokenOutDelta <= 0n) return true;
    return (
      tokenOutLimits.poolAmount + tokenOutDelta <= tokenOutLimits.maxPoolAmount
    );
  };

  let expansionCount = 0;
  while (canDepositAmount(high) && expansionCount < 128) {
    const nextHigh = high * 2n;
    if (nextHigh <= high) break;
    high = nextHigh;
    expansionCount += 1;
  }

  let low = 0n;
  while (low < high) {
    const mid = (low + high + 1n) / 2n;
    if (canDepositAmount(mid)) {
      low = mid;
    } else {
      high = mid - 1n;
    }
  }

  return low;
}

function getPoolUsdForSide(
  marketInfo: MarketInfo,
  pricesData: TokenPricesData,
  isLong: boolean,
  priceType: 'minPrice' | 'maxPrice',
): bigint | undefined {
  const token = isLong ? marketInfo.longToken : marketInfo.shortToken;
  const prices = pricesData[token.address];
  const amount = isLong ? marketInfo.longPoolAmount : marketInfo.shortPoolAmount;
  const price = prices?.[priceType];

  if (!prices || !price || price <= 0n) return undefined;
  return getUsdForPoolAmount(amount, price, token.decimals);
}

function getTokenAmountForUsd(
  usd: bigint,
  tokenPrice: bigint,
  tokenDecimals?: number,
): bigint {
  if (tokenPrice <= 0n) return 0n;
  const decimals = BigInt(tokenDecimals ?? 18);
  return (usd * 10n ** decimals) / tokenPrice;
}

function applyFactor(value: bigint, factor: bigint): bigint {
  return (value * factor) / PRECISION;
}

function getWithdrawalFeeAmountForPool(
  marketInfo: MarketInfo,
  outputAmount: bigint,
): bigint {
  const feeAmount = applyFactor(
    outputAmount,
    marketInfo.withdrawalFeeFactorForBalanceWasNotImproved ?? 0n,
  );
  const feeReceiverAmount = applyFactor(
    feeAmount,
    marketInfo.swapFeeReceiverFactor ?? 0n,
  );
  return feeAmount > feeReceiverAmount ? feeAmount - feeReceiverAmount : 0n;
}

function getWithdrawalOutputAmount({
  withdrawalUsd,
  sidePoolUsdMax,
  totalPoolUsdMax,
  tokenPrices,
  tokenDecimals,
}: {
  withdrawalUsd: bigint;
  sidePoolUsdMax: bigint;
  totalPoolUsdMax: bigint;
  tokenPrices: TokenPrices;
  tokenDecimals?: number;
}): bigint {
  if (totalPoolUsdMax <= 0n || tokenPrices.maxPrice <= 0n) return 0n;
  const outputUsd = (withdrawalUsd * sidePoolUsdMax) / totalPoolUsdMax;
  return getTokenAmountForUsd(outputUsd, tokenPrices.maxPrice, tokenDecimals);
}

function getNextPoolAmountAfterWithdrawal({
  marketInfo,
  withdrawalUsd,
  poolAmount,
  sidePoolUsdMax,
  totalPoolUsdMax,
  tokenPrices,
  tokenDecimals,
}: {
  marketInfo: MarketInfo;
  withdrawalUsd: bigint;
  poolAmount: bigint;
  sidePoolUsdMax: bigint;
  totalPoolUsdMax: bigint;
  tokenPrices: TokenPrices;
  tokenDecimals?: number;
}): bigint | undefined {
  const outputAmount = getWithdrawalOutputAmount({
    withdrawalUsd,
    sidePoolUsdMax,
    totalPoolUsdMax,
    tokenPrices,
    tokenDecimals,
  });
  const feeAmountForPool = getWithdrawalFeeAmountForPool(
    marketInfo,
    outputAmount,
  );
  const poolAmountDelta =
    outputAmount > feeAmountForPool ? outputAmount - feeAmountForPool : 0n;

  if (poolAmountDelta > poolAmount) return undefined;
  return poolAmount - poolAmountDelta;
}

function isReserveValid(
  reservedUsd: bigint,
  poolUsd: bigint,
  reserveFactor: bigint,
): boolean {
  return reservedUsd <= applyFactor(poolUsd, reserveFactor);
}

function isMaxPnlValid(
  pnl: bigint,
  poolUsd: bigint,
  maxPnlFactor: bigint,
): boolean {
  if (pnl <= 0n || poolUsd <= 0n) return true;
  return (pnl * PRECISION) / poolUsd <= maxPnlFactor;
}

function isLendableValid(
  lentUsd: bigint,
  poolUsd: bigint,
  maxLendableFactor: bigint,
): boolean {
  return lentUsd <= applyFactor(poolUsd, maxLendableFactor);
}

export function calculateRemainingWithdrawalCap(
  marketInfo: MarketInfo,
  pricesData: TokenPricesData,
): bigint | undefined {
  const indexTokenPrices = getIndexTokenPrices(marketInfo, pricesData);
  const longTokenPrices = pricesData[marketInfo.longTokenAddress];
  const shortTokenPrices = pricesData[marketInfo.shortTokenAddress];
  if (!indexTokenPrices || !longTokenPrices || !shortTokenPrices) {
    return undefined;
  }

  const longPoolUsdMin = getPoolUsdForSide(
    marketInfo,
    pricesData,
    true,
    'minPrice',
  );
  const shortPoolUsdMin = getPoolUsdForSide(
    marketInfo,
    pricesData,
    false,
    'minPrice',
  );
  const longPoolUsdMax = getPoolUsdForSide(
    marketInfo,
    pricesData,
    true,
    'maxPrice',
  );
  const shortPoolUsdMax = getPoolUsdForSide(
    marketInfo,
    pricesData,
    false,
    'maxPrice',
  );

  if (
    longPoolUsdMin === undefined ||
    shortPoolUsdMin === undefined ||
    longPoolUsdMax === undefined ||
    shortPoolUsdMax === undefined
  ) {
    return undefined;
  }

  const totalPoolUsdMax = longPoolUsdMax + shortPoolUsdMax;
  if (totalPoolUsdMax <= 0n) return 0n;

  const uPnlLong = getMarketPnl(marketInfo, indexTokenPrices, true, false);
  const uPnlShort = getMarketPnl(marketInfo, indexTokenPrices, false, false);

  const reservedUsdLong = getReservedUsd(
    marketInfo,
    true,
    indexTokenPrices,
    marketInfo.indexToken,
  );
  const reservedUsdShort = getReservedUsd(
    marketInfo,
    false,
    indexTokenPrices,
    marketInfo.indexToken,
  );

  const lentUsd = getUsdForPoolAmount(
    marketInfo.lentPositionImpactPoolAmount ?? 0n,
    indexTokenPrices.maxPrice,
    marketInfo.indexToken.decimals,
  );
  const poolValueCap =
    (marketInfo.withdrawalPoolValueMin ?? marketInfo.poolValueMin) > 0n
      ? (marketInfo.withdrawalPoolValueMin ?? marketInfo.poolValueMin)
      : 0n;
  if (poolValueCap <= 0n) return 0n;

  const canWithdrawUsd = (withdrawalUsd: bigint): boolean => {
    const nextLongPoolAmount = getNextPoolAmountAfterWithdrawal({
      marketInfo,
      withdrawalUsd,
      poolAmount: marketInfo.longPoolAmount,
      sidePoolUsdMax: longPoolUsdMax,
      totalPoolUsdMax,
      tokenPrices: longTokenPrices,
      tokenDecimals: marketInfo.longToken.decimals,
    });
    const nextShortPoolAmount = getNextPoolAmountAfterWithdrawal({
      marketInfo,
      withdrawalUsd,
      poolAmount: marketInfo.shortPoolAmount,
      sidePoolUsdMax: shortPoolUsdMax,
      totalPoolUsdMax,
      tokenPrices: shortTokenPrices,
      tokenDecimals: marketInfo.shortToken.decimals,
    });

    if (
      nextLongPoolAmount === undefined ||
      nextShortPoolAmount === undefined
    ) {
      return false;
    }

    const nextLongPoolUsd = getUsdForPoolAmount(
      nextLongPoolAmount,
      longTokenPrices.minPrice,
      marketInfo.longToken.decimals,
    );
    const nextShortPoolUsd = getUsdForPoolAmount(
      nextShortPoolAmount,
      shortTokenPrices.minPrice,
      marketInfo.shortToken.decimals,
    );

    if (
      !isReserveValid(
        reservedUsdLong,
        nextLongPoolUsd,
        marketInfo.reserveFactorLong,
      ) ||
      !isReserveValid(
        reservedUsdShort,
        nextShortPoolUsd,
        marketInfo.reserveFactorShort,
      )
    ) {
      return false;
    }

    if (
      !isMaxPnlValid(
        uPnlLong,
        nextLongPoolUsd,
        marketInfo.maxPnlFactorForWithdrawalsLong,
      ) ||
      !isMaxPnlValid(
        uPnlShort,
        nextShortPoolUsd,
        marketInfo.maxPnlFactorForWithdrawalsShort,
      )
    ) {
      return false;
    }

    return isLendableValid(
      lentUsd,
      nextLongPoolUsd + nextShortPoolUsd,
      marketInfo.maxLendableImpactFactorForWithdrawals,
    );
  };

  if (!canWithdrawUsd(0n)) return 0n;

  let low = 0n;
  let high = poolValueCap;
  while (low < high) {
    const mid = (low + high + 1n) / 2n;
    if (canWithdrawUsd(mid)) {
      low = mid;
    } else {
      high = mid - 1n;
    }
  }

  return low;
}
