import { MarketInfo } from "types/markets";
import { TokenData, TokenPrices } from "types/tokens";
import { DepositAmounts } from "types/trade";
import { bigMath } from "utils/bigmath";
import { getDepositFee, getPriceImpactForSwap, applySwapImpactWithCap } from "utils/fees";
import { usdToMarketTokenAmount } from "utils/markets";
import { applyFactor } from "utils/numbers";
import { convertToTokenAmount, convertToUsd, getMidPrice } from "utils/tokens";

export type TokenDataWithPrices = TokenData & {
  prices: TokenPrices;
};

/**
 * Market token data interface for deposit calculations
 * Contains prices from SyntheticsReader.getMarketTokenPrice(), totalSupply, and decimals
 */
export interface MarketTokenData {
  decimals: number;
  prices: TokenPrices;
  totalSupply: bigint;
}

/**
 * HLV token data interface for HLV deposit calculations
 * Contains decimals and prices for HLV token conversion
 */
export interface HlvTokenData {
  decimals: number;
  prices: TokenPrices;
}

export type GetDepositAmountsParams = {
  /** Market configuration and state */
  marketInfo: MarketInfo;
  marketToken: MarketTokenData;
  /** Long token data with prices */
  longToken: TokenDataWithPrices;
  /** Short token data with prices */
  shortToken: TokenDataWithPrices;
  /** Long token amount to deposit */
  longTokenAmount: bigint;
  /** Short token amount to deposit */
  shortTokenAmount: bigint;
  /** UI fee factor */
  uiFeeFactor: bigint;
  /** Market token amount*/
  marketTokenAmount?: bigint;
  /** HLV token data with prices  */
  hlvToken?: HlvTokenData;
  isMarketTokenDeposit?: boolean;
};

export function getDepositAmounts(p: GetDepositAmountsParams): DepositAmounts {
  const {
    marketInfo,
    marketToken,
    longToken,
    shortToken,
    longTokenAmount,
    shortTokenAmount,
    uiFeeFactor,
    marketTokenAmount = 0n,
    hlvToken,
    isMarketTokenDeposit = false,
  } = p;
  const longTokenPrices = longToken.prices;
  const shortTokenPrices = shortToken.prices;
  const marketTokenDecimals = marketToken.decimals;
  const longTokenPrice = getMidPrice(longTokenPrices);
  const shortTokenPrice = getMidPrice(shortTokenPrices);

  const values: DepositAmounts = {
    longTokenAmount: 0n,
    longTokenUsd: 0n,
    shortTokenAmount: 0n,
    shortTokenUsd: 0n,
    marketTokenAmount: 0n,
    hlvTokenAmount: 0n,
    hlvTokenUsd: 0n,
    marketTokenUsd: 0n,
    swapFeeUsd: 0n,
    uiFeeUsd: 0n,
    swapPriceImpactDeltaUsd: 0n,
  };

  if (isMarketTokenDeposit && hlvToken && marketTokenAmount > 0n) {
    const inputMarketTokenUsd = convertToUsd(marketTokenAmount, marketTokenDecimals, marketToken.prices.minPrice) ?? 0n;
    const outputHlvTokenAmount =
      convertToTokenAmount(inputMarketTokenUsd, hlvToken.decimals, hlvToken.prices.minPrice) ?? 0n;
    const outputHlvTokenUsd = convertToUsd(outputHlvTokenAmount, hlvToken.decimals, hlvToken.prices.minPrice) ?? 0n;

    values.marketTokenAmount = marketTokenAmount;
    values.marketTokenUsd = inputMarketTokenUsd;
    values.hlvTokenAmount = outputHlvTokenAmount;
    values.hlvTokenUsd = outputHlvTokenUsd;

    return values;
  }

  if (longTokenAmount === 0n && shortTokenAmount === 0n) {
    return values;
  }

  values.longTokenAmount = longTokenAmount;
  values.longTokenUsd = convertToUsd(longTokenAmount, longToken.decimals, longTokenPrice) ?? 0n;

  values.shortTokenAmount = shortTokenAmount;
  values.shortTokenUsd = convertToUsd(shortTokenAmount, shortToken.decimals, shortTokenPrice) ?? 0n;

  const priceImpactValues = getPriceImpactForSwap(
    marketInfo,
    longTokenPrices,
    shortTokenPrices,
    longToken,
    shortToken,
    values.longTokenUsd,
    values.shortTokenUsd
  );
  values.swapPriceImpactDeltaUsd = priceImpactValues.priceImpactDeltaUsd;

  const totalDepositUsd = values.longTokenUsd + values.shortTokenUsd;
  const balanceWasImprovedForDepositFee = priceImpactValues.balanceWasImproved;

  if (values.longTokenUsd > 0n) {
    const swapFeeUsd = getDepositFee(marketInfo, values.longTokenUsd, balanceWasImprovedForDepositFee);
    values.swapFeeUsd = values.swapFeeUsd + swapFeeUsd;
    const uiFeeUsd = applyFactor(values.longTokenUsd, uiFeeFactor);
    values.uiFeeUsd = values.uiFeeUsd + uiFeeUsd;
    values.marketTokenAmount += getMarketTokenAmountByCollateral({
      marketInfo,
      marketToken,
      tokenIn: longToken,
      tokenOut: shortToken,
      amount: values.longTokenAmount,
      priceImpactDeltaUsd:
        totalDepositUsd > 0n
          ? bigMath.mulDiv(values.swapPriceImpactDeltaUsd, values.longTokenUsd, totalDepositUsd)
          : 0n,
      swapFeeUsd,
      uiFeeUsd,
    });
  }

  if (values.shortTokenUsd > 0n) {
    const swapFeeUsd = getDepositFee(marketInfo, values.shortTokenUsd, balanceWasImprovedForDepositFee);
    values.swapFeeUsd = values.swapFeeUsd + swapFeeUsd;
    const uiFeeUsd = applyFactor(values.shortTokenUsd, uiFeeFactor);
    values.uiFeeUsd = values.uiFeeUsd + uiFeeUsd;
    values.marketTokenAmount += getMarketTokenAmountByCollateral({
      marketInfo,
      marketToken,
      tokenIn: shortToken,
      tokenOut: longToken,
      amount: values.shortTokenAmount,
      priceImpactDeltaUsd:
        totalDepositUsd > 0n
          ? bigMath.mulDiv(values.swapPriceImpactDeltaUsd, values.shortTokenUsd, totalDepositUsd)
          : 0n,
      swapFeeUsd,
      uiFeeUsd,
    });
  }

  values.marketTokenUsd =
    convertToUsd(values.marketTokenAmount, marketTokenDecimals, marketToken.prices.minPrice) ?? 0n;
  if (hlvToken) {
    values.hlvTokenUsd = values.marketTokenUsd;
    values.hlvTokenAmount = convertToTokenAmount(values.hlvTokenUsd, hlvToken.decimals, hlvToken.prices.minPrice) ?? 0n;
  }
  return values;
}

type GetMarketTokenAmountByCollateralParams = {
  marketInfo: MarketInfo;
  marketToken: MarketTokenData;
  tokenIn: TokenDataWithPrices;
  tokenOut: TokenDataWithPrices;
  amount: bigint;
  priceImpactDeltaUsd: bigint;
  swapFeeUsd: bigint;
  uiFeeUsd: bigint;
};


function getMarketTokenAmountByCollateral(p: GetMarketTokenAmountByCollateralParams): bigint {
  const { marketInfo, marketToken, tokenIn, tokenOut, amount, priceImpactDeltaUsd, swapFeeUsd, uiFeeUsd } = p;

  const marketTokenDecimals = marketToken.decimals;
  const marketTokenTotalSupply = marketToken.totalSupply;
  const tokenInPrices = tokenIn.prices;
  const tokenOutPrices = tokenOut.prices;

  const swapFeeAmount = convertToTokenAmount(swapFeeUsd, tokenIn.decimals, tokenInPrices.minPrice) ?? 0n;
  const uiFeeAmount = convertToTokenAmount(uiFeeUsd, tokenIn.decimals, tokenInPrices.minPrice) ?? 0n;

  let amountInAfterFees = amount - swapFeeAmount - uiFeeAmount;
  let mintAmount = 0n;

  if (priceImpactDeltaUsd > 0n) {
    const { impactDeltaAmount: positiveImpactAmount } = applySwapImpactWithCap(
      marketInfo,
      tokenOut,
      tokenOutPrices,
      priceImpactDeltaUsd
    );

    const usdValue = convertToUsd(positiveImpactAmount, tokenOut.decimals, tokenOutPrices.maxPrice) ?? 0n;

    mintAmount = mintAmount + usdToMarketTokenAmount(marketInfo, marketTokenDecimals, marketTokenTotalSupply, usdValue);
  } else {
    const { impactDeltaAmount: negativeImpactAmount } = applySwapImpactWithCap(
      marketInfo,
      tokenIn,
      tokenInPrices,
      priceImpactDeltaUsd
    );
    amountInAfterFees = amountInAfterFees + negativeImpactAmount;
  }

  const usdValue = convertToUsd(amountInAfterFees, tokenIn.decimals, tokenInPrices.minPrice) ?? 0n;
  mintAmount = mintAmount + usdToMarketTokenAmount(marketInfo, marketTokenDecimals, marketTokenTotalSupply, usdValue);

  return mintAmount;
}
