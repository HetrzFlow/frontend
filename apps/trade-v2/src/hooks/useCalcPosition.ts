import { useMemo } from 'react';
import { calc } from '@repo/lib/calc';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
  getCreditAwareUsdPriceSymbol,
  Inst,
  Position,
  useInstStore,
  useMarketConfigs,
  useMarketValues,
  usePositionConstants,
  usePositions,
} from '@/common';
import { MARKET_PX } from '@/constants/trade';
import { getLossRebateAdjustedPnl } from '@/lib/credit/creditDisplay';
import { getEffectiveReferralDiscountRate } from '@/lib/credit/creditReferral';
import { isCreditMarketInst } from '@/lib/credit/creditTrade';
import {
  useMarketActionAndCloseExecutionPrices,
  usePriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';
import {
  calcLiqPx,
  calcNetPriceImpactUsdForDecrease,
  calcPriceImpactUsd,
  getPositionFeeRate,
} from '@/lib/trade/formulas';
import { findPositionByMode } from '@/lib/trade/position';
import { useReferralDiscountRate } from './useReferralDiscount';

// calc final position info
export const useCalcFinalPosition = ({
  inst,
  isLong,
  deltaSize,
  deltaCollateralAmount,
  collateralTokenAddress,
  px,
  position: _position,
  isZFP,
}: {
  isLong: boolean;
  inst?: Inst;
  deltaSize: string;
  deltaCollateralAmount: string;
  collateralTokenAddress: string;
  px: string;
  position?: Position;
  isZFP?: boolean;
}) => {
  const coins = useInstStore((state) => state.getCoins());
  const { data: positions } = usePositions();

  const isDecreaseInput =
    calc(deltaSize).lt(0) || calc(deltaCollateralAmount).lt(0);
  const { actionExecutionPx, closeExecutionPx } =
    useMarketActionAndCloseExecutionPrices({
      symbol: inst?.symbol,
      indexTokenAddress: inst?.indexTokenAddress,
      isIncrease: !isDecreaseInput,
      isLong,
      throttleWait: 5000,
    });
  const position = useMemo(
    () =>
      _position ??
      (positions && inst?.marketTokenAddress
        ? findPositionByMode({
            positions,
            marketAddress: inst.marketTokenAddress,
            isLong,
            isZFP,
          })
        : undefined),
    [inst, positions, _position, isLong, isZFP],
  );

  const orderPx = px === MARKET_PX ? actionExecutionPx : px;

  const {
    entryPrice: curEntryPx,
    sizeInUsd: curSize,
    collateralAmount: curCollateralAmount,
    pendingBorrowingFeesUsd = '0',
    fundingFeeAmount = '0',
    pendingImpactAmount = '0',
    pendingLossRebateUsd = '0',
  } = position || {};

  const collateralToken = coins[collateralTokenAddress];
  const effectiveIsZFP = position?.isZFP ?? isZFP ?? false;
  const isCreditMarket = position?.isCreditMarket ?? isCreditMarketInst(inst);
  const indexTokenDecimals = inst?.indexTokenAddress
    ? coins[inst.indexTokenAddress]?.decimals
    : undefined;

  const collateralTokenUsdPx = usePriceTickerExecutionPrice({
    symbol: getCreditAwareUsdPriceSymbol({
      isCreditMarket,
      tokenSymbol: collateralToken?.symbol,
    }),
    isIncrease: false,
    isLong,
    priceType: 'min',
    throttleWait: 5000,
  });

  const { data: marketConfigs } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();
  const { data: referralDiscountRate = '0' } = useReferralDiscountRate();

  return useMemo(() => {
    const effectiveReferralDiscountRate = getEffectiveReferralDiscountRate({
      isCreditMarket,
      referralDiscountRate: referralDiscountRate || '0',
    });
    const feeDiscountFactor = calc(1).minus(effectiveReferralDiscountRate);
    const borrowFee = calc(pendingBorrowingFeesUsd);
    const fundingFee = calc(fundingFeeAmount).times(collateralTokenUsdPx || '');

    const curCollateralUsd =
      curCollateralAmount && collateralTokenUsdPx
        ? calc(curCollateralAmount).times(collateralTokenUsdPx)
        : calc(0);
    const inputCollateralDeltaUsd = calc(deltaCollateralAmount).times(
      collateralTokenUsdPx || '',
    );
    const curLeverage = calc(curSize || '').div(curCollateralUsd);
    const curRealFees = calc(borrowFee).plus(fundingFee);
    const finalCurCollateral = curCollateralUsd.isNaN()
      ? calc(0)
      : calc(curCollateralUsd).minus(curRealFees);

    const isDecreaseSize = calc(deltaSize).lt(0);
    const isDecrease = isDecreaseSize || calc(deltaCollateralAmount).lt(0);
    const priceImpact = calcNetPriceImpactUsdForDecrease({
      marketConfigs,
      marketValues,
      positionSizeInUsd: curSize || '0',
      sizeDeltaUsd: curSize || '0',
      pendingImpactAmount,
      indexTokenPrice: closeExecutionPx || '0',
      indexTokenDecimals,
      isLong,
    });
    const totalPriceImpact = priceImpact.totalPriceImpactDeltaUsd;

    // max price impact for liquidation
    const maxPriceImpactForLiquidation = calc(curSize || '0')
      .times(
        marketConfigs?.maxPositionImpactFactorForLiquidations?.toString() ||
          '0',
      )
      .div(CONTRACT_PRECISION_MULTIPLIER)
      .times(-1);
    let totalPriceImpactForLiquidation = totalPriceImpact;
    if (totalPriceImpact.gt(0)) {
      totalPriceImpactForLiquidation = calc(0);
    } else if (
      totalPriceImpactForLiquidation.lt(maxPriceImpactForLiquidation)
    ) {
      totalPriceImpactForLiquidation = maxPriceImpactForLiquidation;
    }

    const feeRate = getPositionFeeRate({
      marketConfigs,
      balanceWasImproved: priceImpact.balanceWasImproved,
      isZFP: effectiveIsZFP,
    });
    const curCloseFee = effectiveIsZFP
      ? calc(0)
      : calc(curSize || 0)
          .times(feeRate)
          .times(feeDiscountFactor);
    const minCollateralUsdForLiquidation = calc(
      positionConstants?.minCollateralUsd?.toString() || 0,
    ).div(CONTRACT_USD_MULTIPLIER);
    const liquidationFactor = effectiveIsZFP
      ? marketConfigs?.minZFPCollateralFactorForLiquidation
      : marketConfigs?.minCollateralFactorForLiquidation;
    const liquidationCollateralUsd = liquidationFactor
      ? calc(curSize || 0)
          .times(liquidationFactor.toString())
          .div(CONTRACT_PRECISION_MULTIPLIER)
      : 0;

    const curLiqPx = calcLiqPx({
      collateral: finalCurCollateral,
      fees: calc(totalPriceImpactForLiquidation).times(-1).plus(curCloseFee),
      liquidationUsd: minCollateralUsdForLiquidation.gt(
        liquidationCollateralUsd,
      )
        ? minCollateralUsdForLiquidation
        : liquidationCollateralUsd,
      size: curSize || '0',
      isLong,
      entryPrice: curEntryPx ?? '',
    });

    const deltaDecreasePriceImpact = isDecreaseSize
      ? calcNetPriceImpactUsdForDecrease({
          marketConfigs,
          marketValues,
          positionSizeInUsd: curSize || '0',
          sizeDeltaUsd: calc(deltaSize).abs(),
          pendingImpactAmount,
          indexTokenPrice: orderPx || closeExecutionPx || '0',
          indexTokenDecimals,
          isLong,
        })
      : null;
    const deltaIncreasePriceImpact = isDecrease
      ? null
      : calcPriceImpactUsd({
          marketConfigs,
          marketValues,
          sizeInUsd: deltaSize,
          isLong: isLong,
          isIncrease: true,
        });
    const proportionalPriceImpact = deltaDecreasePriceImpact
      ? deltaDecreasePriceImpact.totalPriceImpactDeltaUsd
      : calc(0);

    const deltaFeeRate = getPositionFeeRate({
      marketConfigs,
      balanceWasImproved: deltaDecreasePriceImpact
        ? deltaDecreasePriceImpact.balanceWasImproved
        : (deltaIncreasePriceImpact?.balanceWasImproved ?? true),
      isZFP: effectiveIsZFP,
    });
    let uPnl = calc(0);
    // calc uPnl when decrease position
    if (isDecreaseSize) {
      uPnl =
        orderPx && curEntryPx
          ? calc(deltaSize)
              .abs()
              .times(
                calc(orderPx)
                  .minus(curEntryPx)
                  .div(curEntryPx)
                  .times(isLong ? 1 : -1),
              )
          : calc(0);

      uPnl = calc(
        getLossRebateAdjustedPnl({
          uPnl: uPnl.toFixed(),
          pendingLossRebateUsd,
          // CloseDialog passes signed collateral deltas into this shared hook.
          // Loss rebate proration uses the absolute collateral slice being closed.
          collateralDeltaAmount: calc(deltaCollateralAmount).abs().toFixed(),
          collateralAmount: curCollateralAmount || '0',
          isCreditMarket,
        }),
      );
    }
    const effectiveDeltaFeeRate = effectiveIsZFP
      ? calc(0)
      : calc(deltaFeeRate).times(feeDiscountFactor);
    const deltaSizeFees = calc(deltaSize)
      .abs()
      .times(effectiveDeltaFeeRate)
      .minus(uPnl)
      .minus(proportionalPriceImpact);

    const nextSize = calc(curSize || 0).plus(deltaSize || 0);
    // Partial decreases do not change the entry price of the remaining
    // position. Only increases should average the entry with the new size.
    const nextEntryPx =
      !isDecrease && orderPx && deltaSize && !calc(deltaSize).eq(0)
        ? calc(curSize || 0)
            .plus(deltaSize)
            .div(
              calc(curSize || 0)
                .div(curEntryPx || orderPx)
                .plus(calc(deltaSize).div(orderPx)),
            )
            .toFixed()
        : curEntryPx || orderPx;
    const totalFees = curRealFees.plus(deltaSizeFees);
    const decreaseCollateralUsd = calc.max(
      calc(inputCollateralDeltaUsd).abs(),
      calc.max(totalFees, 0),
    );
    const nextCollateralUsd = calc.max(
      0,
      nextSize.lte(0)
        ? 0
        : isDecreaseSize
          ? calc(curCollateralUsd).minus(decreaseCollateralUsd)
          : calc(inputCollateralDeltaUsd)
              .plus(curCollateralUsd)
              .minus(totalFees),
    );

    const nextLeverage = calc(nextSize).div(nextCollateralUsd);
    const nextPriceImpact = calcNetPriceImpactUsdForDecrease({
      marketConfigs,
      marketValues,
      positionSizeInUsd: nextSize || '0',
      sizeDeltaUsd: nextSize || '0',
      pendingImpactAmount: isDecreaseSize
        ? deltaDecreasePriceImpact?.remainingPendingImpactAmount || calc(0)
        : pendingImpactAmount,
      indexTokenPrice: closeExecutionPx || '0',
      indexTokenDecimals,
      isLong,
    });

    const nextTotalPriceImpact = nextPriceImpact.totalPriceImpactDeltaUsd;
    // max price impact for liquidation
    const nextMaxPriceImpactForLiquidation = calc(nextSize || '0')
      .times(
        marketConfigs?.maxPositionImpactFactorForLiquidations?.toString() ||
          '0',
      )
      .div(CONTRACT_PRECISION_MULTIPLIER)
      .times(-1);
    let nextTotalPriceImpactForLiquidation = nextTotalPriceImpact;
    if (nextTotalPriceImpact.gt(0)) {
      nextTotalPriceImpactForLiquidation = calc(0);
    } else if (
      nextTotalPriceImpactForLiquidation.lt(nextMaxPriceImpactForLiquidation)
    ) {
      nextTotalPriceImpactForLiquidation = nextMaxPriceImpactForLiquidation;
    }
    const nextFeeRate = getPositionFeeRate({
      marketConfigs,
      balanceWasImproved: nextPriceImpact.balanceWasImproved,
      isZFP: effectiveIsZFP,
    });
    const nextCloseFee = effectiveIsZFP
      ? calc(0)
      : calc(nextSize || 0)
          .times(nextFeeRate)
          .times(feeDiscountFactor);
    const nextLiquidationFactor = effectiveIsZFP
      ? marketConfigs?.minZFPCollateralFactorForLiquidation
      : marketConfigs?.minCollateralFactorForLiquidation;
    const nextLiquidationCollateralUsd = nextLiquidationFactor
      ? calc(nextSize)
          .times(nextLiquidationFactor.toString())
          .div(CONTRACT_PRECISION_MULTIPLIER)
      : 0;
    const nextLiqPx = calcLiqPx({
      collateral: nextCollateralUsd,
      fees: calc(nextTotalPriceImpactForLiquidation)
        .times(-1)
        .plus(nextCloseFee),
      liquidationUsd: minCollateralUsdForLiquidation.gt(
        nextLiquidationCollateralUsd,
      )
        ? minCollateralUsdForLiquidation
        : nextLiquidationCollateralUsd,
      size: nextSize,
      isLong,
      entryPrice: nextEntryPx || '',
    });

    return {
      curEntryPx: curEntryPx,
      curSize: curSize,
      curCollateralUsd: curCollateralUsd,
      curLeverage: curLeverage,
      curLiqPx: curLiqPx.toFixed(),
      curBorrowFee: borrowFee,
      curFundingFee: fundingFee,
      curCloseFee: curCloseFee,
      curTotalPriceImpact: totalPriceImpact,
      deltaCollateralUsd: nextCollateralUsd.minus(curCollateralUsd),
      nextEntryPx: nextEntryPx,
      nextSize: nextSize.toFixed(),
      nextCollateralUsd: nextCollateralUsd.toFixed(),
      nextLeverage: nextLeverage,
      nextLiqPx: nextLiqPx.toFixed(),
      nextCloseFee: nextCloseFee,
      nextTotalPriceImpact: nextTotalPriceImpact,
    };
  }, [
    collateralTokenUsdPx,
    curCollateralAmount,
    curEntryPx,
    curSize,
    deltaCollateralAmount,
    deltaSize,
    fundingFeeAmount,
    indexTokenDecimals,
    isLong,
    orderPx,
    closeExecutionPx,
    pendingBorrowingFeesUsd,
    pendingImpactAmount,
    pendingLossRebateUsd,
    marketConfigs,
    marketValues,
    positionConstants?.minCollateralUsd,
    referralDiscountRate,
    effectiveIsZFP,
    isCreditMarket,
  ]);
};
