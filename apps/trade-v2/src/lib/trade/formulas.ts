import { MarketConfig, MarketValues } from '@hertzflow/sdk-v2/types/markets';
import {
  capPositionImpactUsdByMaxPriceImpactFactor,
  getCappedPositionImpactUsd,
  getProportionalPendingImpactValues,
  getPriceImpactForPosition,
} from '@hertzflow/sdk-v2/utils/fees/priceImpact';
import { getNetPriceImpactDeltaUsdForDecrease } from '@hertzflow/sdk-v2/utils/positions';
import { convertToUsd } from '@hertzflow/sdk-v2/utils/tokens';
import BigNumber from 'bignumber.js';
import { BN, calc, ROUND_MODE } from '@repo/lib/calc';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
  Position,
} from '@/common';

type Num = BigNumber | string | number;
type MinimalIndexToken = {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
};
type MinimalDecreaseImpactMarketInfo = {
  indexToken: MinimalIndexToken;
  positionImpactPoolAmount: bigint;
  maxPositionImpactFactorPositive: bigint;
  maxPositionImpactFactorNegative: bigint;
  longInterestUsd: bigint;
  shortInterestUsd: bigint;
  positionImpactFactorPositive: bigint;
  positionImpactFactorNegative: bigint;
  positionImpactExponentFactor: bigint;
  virtualInventoryForPositions: bigint;
};

const buildContractPrice = (price: Num) =>
  BigInt(
    calc(price || 0)
      .times(CONTRACT_USD_MULTIPLIER)
      .toFixed(0),
  );

const buildTokenAmount = (amount: Num, decimals: number) =>
  BigInt(
    calc(amount || 0)
      .times(calc(10).pow(decimals))
      .toFixed(0),
  );

/**
 * Calculate 24h price change percentage and direction.
 * @param last - current/last price
 * @param open24h - 24h open price
 * @returns { chg, isUp, isDown } where chg is the raw change ratio (e.g. "0.0312")
 */
export const calcPriceChange = (last: string, open24h: string) => {
  const lastObj = calc(last);
  const chg = lastObj.minus(open24h).div(open24h).toFixed(4, ROUND_MODE.DOWN);
  return {
    chg,
    isUp: lastObj.gt(open24h),
    isDown: lastObj.lt(open24h),
  };
};

export const calcPriceImpactUsd = ({
  marketConfigs,
  marketValues,
  sizeInUsd,
  isLong,
}: {
  marketConfigs?: MarketConfig;
  marketValues?: MarketValues;
  sizeInUsd: Num;
  isLong: boolean;
  isIncrease: true;
}) => {
  const priceImpact =
    marketConfigs && marketValues && sizeInUsd
      ? getCappedPositionImpactUsd(
          {
            maxPositionImpactFactorPositive:
              marketConfigs.maxPositionImpactFactorPositive,
            maxPositionImpactFactorNegative:
              marketConfigs.maxPositionImpactFactorNegative,
            longInterestUsd: marketValues.longInterestUsd,
            shortInterestUsd: marketValues.shortInterestUsd,
            positionImpactFactorPositive:
              marketConfigs.positionImpactFactorPositive,
            positionImpactFactorNegative:
              marketConfigs.positionImpactFactorNegative,
            positionImpactExponentFactor:
              marketConfigs.positionImpactExponentFactor,
            virtualInventoryForPositions:
              marketValues.virtualInventoryForPositions,
          },
          BigInt(
            calc(sizeInUsd).abs().times(CONTRACT_USD_MULTIPLIER).toFixed(0),
          ),
          isLong,
          true,
          {
            fallbackToZero: true,
            shouldCapNegativeImpact: false,
          },
        )
      : {
          priceImpactDeltaUsd: 0n,
          balanceWasImproved: true,
        };

  const priceImpactDeltaUsd = calc(
    priceImpact.priceImpactDeltaUsd.toString(),
  ).div(CONTRACT_USD_MULTIPLIER);

  return {
    priceImpactDeltaUsd,
    balanceWasImproved: priceImpact.balanceWasImproved,
  };
};

export const calcPriceImpactUsdForLiquidation = ({
  marketConfigs,
  marketValues,
  sizeInUsd,
  pendingImpactAmount,
  indexTokenPrice,
  indexTokenDecimals,
  isLong,
}: {
  marketConfigs?: MarketConfig;
  marketValues?: MarketValues;
  sizeInUsd: Num;
  pendingImpactAmount: Num;
  indexTokenPrice?: Num;
  indexTokenDecimals?: number;
  isLong: boolean;
}) => {
  if (
    !marketConfigs ||
    !marketValues ||
    !indexTokenPrice ||
    indexTokenDecimals === undefined
  ) {
    return {
      totalPriceImpactDeltaUsd: calc(0),
      balanceWasImproved: true,
    };
  }

  const sizeInUsdBigInt = BigInt(
    calc(sizeInUsd).abs().times(CONTRACT_USD_MULTIPLIER).toFixed(0),
  );

  const marketInfo: MinimalDecreaseImpactMarketInfo = {
    indexToken: {
      name: '',
      symbol: '',
      address: '',
      decimals: indexTokenDecimals,
    },
    positionImpactPoolAmount: marketValues.positionImpactPoolAmount,
    maxPositionImpactFactorPositive:
      marketConfigs.maxPositionImpactFactorPositive,
    maxPositionImpactFactorNegative:
      marketConfigs.maxPositionImpactFactorNegative,
    longInterestUsd: marketValues.longInterestUsd,
    shortInterestUsd: marketValues.shortInterestUsd,
    positionImpactFactorPositive: marketConfigs.positionImpactFactorPositive,
    positionImpactFactorNegative: marketConfigs.positionImpactFactorNegative,
    positionImpactExponentFactor: marketConfigs.positionImpactExponentFactor,
    virtualInventoryForPositions: marketValues.virtualInventoryForPositions,
  };

  const priceImpact = getPriceImpactForPosition(
    marketInfo,
    -sizeInUsdBigInt,
    isLong,
    {
      fallbackToZero: true,
    },
  );

  let priceImpactDeltaUsd = calc(priceImpact.priceImpactDeltaUsd.toString());

  if (priceImpactDeltaUsd.gt(0)) {
    const cappedImpactUsd = capPositionImpactUsdByMaxPriceImpactFactor(
      marketInfo,
      sizeInUsdBigInt,
      priceImpact.priceImpactDeltaUsd,
    );
    priceImpactDeltaUsd = calc(cappedImpactUsd.toString());
  }

  const pendingImpactUsd = convertToUsd(
    BigInt(calc(pendingImpactAmount).toFixed(0)),
    indexTokenDecimals,
    buildContractPrice(indexTokenPrice),
  );

  return {
    totalPriceImpactDeltaUsd: priceImpactDeltaUsd.plus(
      calc(pendingImpactUsd?.toString() || 0).div(CONTRACT_USD_MULTIPLIER),
    ),
    balanceWasImproved: priceImpact.balanceWasImproved,
  };
};

export const calcNetPriceImpactUsdForDecrease = ({
  marketConfigs,
  marketValues,
  positionSizeInUsd,
  sizeDeltaUsd,
  pendingImpactAmount,
  indexTokenPrice,
  indexTokenDecimals,
  isLong,
}: {
  marketConfigs?: MarketConfig;
  marketValues?: MarketValues;
  positionSizeInUsd: Num;
  sizeDeltaUsd: Num;
  pendingImpactAmount: Num;
  indexTokenPrice?: Num;
  indexTokenDecimals?: number;
  isLong: boolean;
}) => {
  if (
    !marketConfigs ||
    !marketValues ||
    !indexTokenPrice ||
    indexTokenDecimals === undefined
  ) {
    return {
      totalPriceImpactDeltaUsd: calc(0),
      rawTotalPriceImpactDeltaUsd: calc(0),
      remainingPendingImpactAmount: calc(0),
      balanceWasImproved: true,
    };
  }

  const sizeInUsdBigInt = BigInt(
    calc(positionSizeInUsd).abs().times(CONTRACT_USD_MULTIPLIER).toFixed(0),
  );
  const sizeDeltaUsdBigInt = BigInt(
    calc(sizeDeltaUsd).abs().times(CONTRACT_USD_MULTIPLIER).toFixed(0),
  );
  const contractIndexTokenPrice = buildContractPrice(indexTokenPrice);
  const pendingImpactAmountBigInt = buildTokenAmount(
    pendingImpactAmount,
    indexTokenDecimals,
  );

  const marketInfo: MinimalDecreaseImpactMarketInfo = {
    indexToken: {
      name: '',
      symbol: '',
      address: '',
      decimals: indexTokenDecimals,
    },
    positionImpactPoolAmount: marketValues.positionImpactPoolAmount,
    maxPositionImpactFactorPositive:
      marketConfigs.maxPositionImpactFactorPositive,
    maxPositionImpactFactorNegative:
      marketConfigs.maxPositionImpactFactorNegative,
    longInterestUsd: marketValues.longInterestUsd,
    shortInterestUsd: marketValues.shortInterestUsd,
    positionImpactFactorPositive: marketConfigs.positionImpactFactorPositive,
    positionImpactFactorNegative: marketConfigs.positionImpactFactorNegative,
    positionImpactExponentFactor: marketConfigs.positionImpactExponentFactor,
    virtualInventoryForPositions: marketValues.virtualInventoryForPositions,
  };

  const rawPriceImpact = getPriceImpactForPosition(
    marketInfo,
    -sizeDeltaUsdBigInt,
    isLong,
    {
      fallbackToZero: true,
    },
  );

  const { proportionalPendingImpactDeltaAmount } =
    getProportionalPendingImpactValues({
      sizeInUsd: sizeInUsdBigInt,
      pendingImpactAmount: pendingImpactAmountBigInt,
      sizeDeltaUsd: sizeDeltaUsdBigInt,
      indexToken: marketInfo.indexToken,
      indexTokenPrices: {
        minPrice: contractIndexTokenPrice,
        maxPrice: contractIndexTokenPrice,
      },
    });

  const netPriceImpact = getNetPriceImpactDeltaUsdForDecrease({
    marketInfo,
    indexTokenPrices: {
      minPrice: contractIndexTokenPrice,
      maxPrice: contractIndexTokenPrice,
    },
    sizeInUsd: sizeInUsdBigInt,
    pendingImpactAmount: pendingImpactAmountBigInt,
    sizeDeltaUsd: sizeDeltaUsdBigInt,
    priceImpactDeltaUsd: rawPriceImpact.priceImpactDeltaUsd,
  });

  const effectiveTotalImpactDeltaUsd =
    netPriceImpact.totalImpactDeltaUsd + netPriceImpact.priceImpactDiffUsd;

  return {
    totalPriceImpactDeltaUsd: calc(effectiveTotalImpactDeltaUsd.toString()).div(
      CONTRACT_USD_MULTIPLIER,
    ),
    rawTotalPriceImpactDeltaUsd: calc(
      netPriceImpact.totalImpactDeltaUsd.toString(),
    ).div(CONTRACT_USD_MULTIPLIER),
    remainingPendingImpactAmount: calc(pendingImpactAmount).minus(
      calc(proportionalPendingImpactDeltaAmount.toString()).div(
        calc(10).pow(indexTokenDecimals),
      ),
    ),
    balanceWasImproved: rawPriceImpact.balanceWasImproved,
  };
};

export const getPositionFeeRate = ({
  marketConfigs,
  balanceWasImproved,
  isZFP,
}: {
  marketConfigs?: MarketConfig;
  balanceWasImproved: boolean;
  isZFP?: boolean;
}) => {
  if (isZFP) {
    return calc(0);
  }

  return calc(
    (
      (balanceWasImproved
        ? marketConfigs?.positionFeeFactorForBalanceWasImproved
        : marketConfigs?.positionFeeFactorForBalanceWasNotImproved) ?? 0n
    ).toString(),
  ).div(CONTRACT_PRECISION_MULTIPLIER);
};

/**
 * calc liq price
 * @param collateral collateral usd after fees and minCollateralFactorForLiquidation
 * @param size position size usd
 * @param isLong long or short
 * @param entryPrice average price
 * @param maxLevel maxLevel
 */
export const calcLiqPx = ({
  collateral,
  size,
  isLong,
  entryPrice,
  fees,
  liquidationUsd,
}: {
  collateral: Num;
  size: Num;
  isLong: boolean;
  entryPrice: Num;
  fees: Num;
  liquidationUsd: Num;
}) => {
  // liq px
  // long:  entryPrice * (1 - (collateral - fees - liquidationUsd) / size)
  // short: entryPrice * (1 + (collateral - fees - liquidationUsd) / size)
  return calc.max(
    calc(entryPrice).minus(
      calc(collateral)
        .minus(fees)
        .minus(liquidationUsd)
        .div(size)
        .times(entryPrice)
        .times(isLong ? 1 : -1),
    ),
    0,
  );
};

/**
 * calc liq price by position
 * @param position position
 * @param collateralTokenPx collateral token price
 * @param indexTokenPx index token price
 * @param marketConfigs marketConfigs
 * @param marketValues marketValues
 */
export const calcLiqPxByPosition = ({
  position,
  collateralTokenPx,
  indexTokenPx,
  indexTokenDecimals,
  marketConfigs,
  marketValues,
  minCollateralUsd,
  positionFeeDiscountRate = 0,
}: {
  position: Position;
  indexTokenPx?: string;
  indexTokenDecimals?: number;
  collateralTokenPx?: string;
  marketConfigs?: MarketConfig;
  marketValues?: MarketValues;
  minCollateralUsd?: bigint;
  positionFeeDiscountRate?: Num;
}) => {
  const {
    sizeInUsd,
    isLong,
    collateralAmount,
    entryPrice,
    pendingBorrowingFeesUsd,
    fundingFeeAmount,
    pendingImpactAmount,
  } = position;

  const borrowFee = pendingBorrowingFeesUsd;
  const fundingFee = calc(fundingFeeAmount).times(collateralTokenPx || '');

  const curCollateralUsd = calc(collateralAmount || '').times(
    collateralTokenPx || '',
  );

  const finalCurCollateral = curCollateralUsd.isNaN()
    ? calc(0)
    : calc(curCollateralUsd).minus(borrowFee).minus(fundingFee);

  const priceImpact = calcNetPriceImpactUsdForDecrease({
    marketConfigs,
    marketValues,
    positionSizeInUsd: sizeInUsd,
    sizeDeltaUsd: sizeInUsd,
    pendingImpactAmount,
    indexTokenPrice: indexTokenPx,
    indexTokenDecimals,
    isLong,
  });
  const totalPriceImpact = priceImpact.totalPriceImpactDeltaUsd;

  // max price impact for liquidation
  const maxPriceImpactForLiquidation = calc(sizeInUsd)
    .times(
      marketConfigs?.maxPositionImpactFactorForLiquidations?.toString() || '0',
    )
    .div(CONTRACT_PRECISION_MULTIPLIER)
    .times(-1);
  let totalPriceImpactForLiquidation = totalPriceImpact;
  if (totalPriceImpact.gt(0)) {
    totalPriceImpactForLiquidation = calc(0);
  } else if (totalPriceImpactForLiquidation.lt(maxPriceImpactForLiquidation)) {
    totalPriceImpactForLiquidation = maxPriceImpactForLiquidation;
  }

  const feeRate = getPositionFeeRate({
    marketConfigs,
    balanceWasImproved: priceImpact.balanceWasImproved,
    isZFP: position.isZFP,
  });
  const curCloseFee = position.isZFP
    ? calc(0)
    : calc(sizeInUsd || 0)
        .times(feeRate)
        .times(calc(1).minus(positionFeeDiscountRate || 0));
  // min collateral factor for liquidation
  const minCollateralUsdForLiquidation = calc(
    minCollateralUsd?.toString() || 0,
  ).div(CONTRACT_USD_MULTIPLIER);
  const collateralFactorForLiquidation = position.isZFP
    ? marketConfigs?.minZFPCollateralFactorForLiquidation
    : marketConfigs?.minCollateralFactorForLiquidation;
  const liquidationCollateralUsd = collateralFactorForLiquidation
    ? calc(sizeInUsd || 0)
        .times(collateralFactorForLiquidation.toString())
        .div(CONTRACT_PRECISION_MULTIPLIER)
    : 0;

  return calcLiqPx({
    collateral: finalCurCollateral,
    fees: calc(totalPriceImpactForLiquidation).times(-1).plus(curCloseFee),
    liquidationUsd: minCollateralUsdForLiquidation.gt(liquidationCollateralUsd)
      ? minCollateralUsdForLiquidation
      : liquidationCollateralUsd,
    size: sizeInUsd || '0',
    isLong,
    entryPrice: entryPrice ?? '',
  });
};

export const calcCapTpPx = ({
  collateralUsd,
  sizeUsd,
  maxProfitRate,
  allFeeUsd,
  entryPx,
  isLong,
}: {
  collateralUsd: string | BN;
  sizeUsd: string;
  maxProfitRate: number;
  allFeeUsd: string | BN;
  entryPx: string;
  isLong: boolean;
}) => {
  return calc(collateralUsd)
    .times(maxProfitRate)
    .plus(allFeeUsd)
    .div(sizeUsd)
    .times(isLong ? 1 : -1)
    .plus(1)
    .times(entryPx);
};

export const calcCapSlPx = ({
  collateralUsd,
  sizeUsd,
  maxLossRate,
  allFeeUsd,
  entryPx,
  isLong,
}: {
  collateralUsd: string | BN;
  sizeUsd: string;
  maxLossRate: number;
  allFeeUsd: string | BN;
  entryPx: string;
  isLong: boolean;
}) => {
  return calc(collateralUsd)
    .times(maxLossRate)
    .minus(allFeeUsd)
    .div(sizeUsd)
    .times(isLong ? -1 : 1)
    .plus(1)
    .times(entryPx);
};

export const calcCapTpPxAndSlPxOfPosition = ({
  position,
  maxProfitRate,
  maxLossRate,
  minLossRate,
  collateralTokenPx,
  indexTokenPx,
  indexTokenDecimals,
  marketConfigs,
  marketValues,
}: {
  position: Position;
  maxProfitRate: number;
  maxLossRate: number;
  /** Min loss rate for hyper mode SL floor (e.g. 0.3 = -30%). Only applied when position is hyper mode. */
  minLossRate?: number;
  collateralTokenPx?: string;
  indexTokenPx?: string;
  indexTokenDecimals?: number;
  marketConfigs?: MarketConfig;
  marketValues?: MarketValues;
}) => {
  const {
    sizeInUsd,
    isLong,
    collateralAmount,
    entryPrice,
    pendingBorrowingFeesUsd,
    fundingFeeAmount,
    pendingImpactAmount,
  } = position;

  const borrowFee = pendingBorrowingFeesUsd;
  const fundingFee = calc(fundingFeeAmount).times(collateralTokenPx || '');

  const curCollateralUsd = calc(collateralAmount || '').times(
    collateralTokenPx || '',
  );

  const finalCurCollateral = curCollateralUsd.isNaN()
    ? calc(0)
    : calc(curCollateralUsd).minus(borrowFee).minus(fundingFee);

  const priceImpact = calcNetPriceImpactUsdForDecrease({
    marketConfigs,
    marketValues,
    positionSizeInUsd: sizeInUsd,
    sizeDeltaUsd: sizeInUsd,
    pendingImpactAmount,
    indexTokenPrice: indexTokenPx,
    indexTokenDecimals,
    isLong,
  });
  const totalPriceImpact = priceImpact.totalPriceImpactDeltaUsd;

  const feeRate = getPositionFeeRate({
    marketConfigs,
    balanceWasImproved: priceImpact.balanceWasImproved,
    isZFP: position.isZFP,
  });
  const curCloseFee = position.isZFP
    ? calc(0)
    : calc(sizeInUsd || 0).times(feeRate);
  const allFeeUsd = calc(curCloseFee).minus(totalPriceImpact);

  const isZFP = position.isZFP;

  return {
    tpCapPx: calcCapTpPx({
      collateralUsd: finalCurCollateral,
      sizeUsd: sizeInUsd,
      maxProfitRate,
      allFeeUsd,
      entryPx: entryPrice,
      isLong,
    }),
    slCapPx: calcCapSlPx({
      collateralUsd: finalCurCollateral,
      sizeUsd: sizeInUsd,
      maxLossRate,
      allFeeUsd,
      entryPx: entryPrice,
      isLong,
    }),
    slFloorPx:
      isZFP && minLossRate !== undefined
        ? calcCapSlPx({
            collateralUsd: finalCurCollateral,
            sizeUsd: sizeInUsd,
            maxLossRate: minLossRate,
            allFeeUsd,
            entryPx: entryPrice,
            isLong,
          })
        : undefined,
  };
};

export const calcPositionFees = ({
  position,
  collateralTokenPx,
  indexTokenPx,
  indexTokenDecimals,
  marketConfigs,
  marketValues,
  isZFP,
}: {
  position: Position;
  collateralTokenPx?: string;
  indexTokenPx?: string;
  indexTokenDecimals?: number;
  marketConfigs?: MarketConfig;
  marketValues?: MarketValues;
  isZFP?: boolean;
}) => {
  const {
    sizeInUsd,
    isLong,
    pendingBorrowingFeesUsd,
    fundingFeeAmount,
    pendingImpactAmount,
  } = position;

  // Hyper mode: open/close fees = 0, borrow/funding fees still apply
  const borrowFee = calc(pendingBorrowingFeesUsd);
  const fundingFee = calc(fundingFeeAmount).times(collateralTokenPx || '');

  const priceImpact = calcNetPriceImpactUsdForDecrease({
    marketConfigs,
    marketValues,
    positionSizeInUsd: sizeInUsd,
    sizeDeltaUsd: sizeInUsd,
    pendingImpactAmount,
    indexTokenPrice: indexTokenPx,
    indexTokenDecimals,
    isLong,
  });
  const totalPriceImpact = priceImpact.totalPriceImpactDeltaUsd;

  const feeRate = getPositionFeeRate({
    marketConfigs,
    balanceWasImproved: priceImpact.balanceWasImproved,
    isZFP,
  });
  // Hyper mode: close fee = 0
  const closeFee = isZFP ? calc(0) : calc(sizeInUsd || 0).times(feeRate);

  return {
    fundingFee,
    borrowFee,
    totalPriceImpact,
    closeFee,
  };
};

/**
 * Calculate Loss Rebate for Normal mode positions
 * Loss Rebate = Loss * LossRebateFactor
 * Only applies to positions on the weaker OI side
 */
export const calcLossRebate = ({
  collateralUsd,
  lossRebateRate,
  pnlPercent,
}: {
  collateralUsd: Num;
  lossRebateRate: number;
  pnlPercent: Num;
}) => {
  // Only apply loss rebate when position is at a loss
  if (calc(pnlPercent).gte(0)) return calc(0);
  return calc(collateralUsd).times(lossRebateRate).abs();
};

/**
 * Calculate Profit Share for Hyper mode positions
 * Fee = Profit * ProfitShareFactor
 * Only applies when position is profitable
 */
export const calcProfitShare = ({
  profit,
  profitShareRate,
}: {
  profit: Num;
  profitShareRate: number;
}) => {
  if (calc(profit).lte(0)) return calc(0);
  return calc(profit).times(profitShareRate);
};
