import { BigNumber } from 'bignumber.js';
import { SafeNumber } from '../types';
import {
  PRICE_AMPLIFICATION_MULTIPLIER,
  PRICE_MULTIPLIER_DECIMAL,
} from '../math';
import { fromDecimalsAmount, toDecimalsAmount } from './numbers';

export type CalculateAcceptablePriceParams = {
  coinPrice: SafeNumber;
  coinDecimals: number;
  isLong: boolean;
  slippage: number;
  priceDecimals?: number;
  operationType?: 'increase' | 'decrease';
};

export type CalculateUnitPriceParams = {
  originPrice: SafeNumber;
  coinDecimals: number;
  priceDecimals?: number;
};

export type CalculateSizeDeltaParams = {
  collateralUsdValue: string;
  leverage: number;
};

export class HertzflowCalc {
  static calculateUnitCoinPriceWithPriceDecimals({
    coinPrice,
    coinDecimals,
    priceDecimals = PRICE_MULTIPLIER_DECIMAL,
  }: {
    coinPrice: SafeNumber;
    coinDecimals: number;
    priceDecimals?: number;
  }) {
    const unitCoinPriceWithPriceDecimals = toDecimalsAmount(
      fromDecimalsAmount(coinPrice, coinDecimals),
      priceDecimals,
    );
    return unitCoinPriceWithPriceDecimals;
  }

  static calculateAcceptablePrice({
    coinPrice,
    coinDecimals,
    isLong,
    slippage,
    priceDecimals = PRICE_MULTIPLIER_DECIMAL,
    operationType = 'increase',
  }: CalculateAcceptablePriceParams) {
    const _slippageBn = new BigNumber(slippage);
    const unitCoinPriceWithPriceDecimals =
      HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
        coinPrice,
        coinDecimals,
        priceDecimals,
      });
    let _unitCoinPriceWithPriceDecimalsAndSlippage: string;
    let priceWithAmplificationMultiplierAndSlippage: string;

    let shouldUseHigherPrice: boolean;

    if (operationType === 'increase') {
      shouldUseHigherPrice = isLong;
    } else {
      shouldUseHigherPrice = !isLong;
    }

    if (shouldUseHigherPrice) {
      _unitCoinPriceWithPriceDecimalsAndSlippage = new BigNumber(
        unitCoinPriceWithPriceDecimals,
      )
        .times(new BigNumber(1).plus(_slippageBn))
        .toString(10);

      priceWithAmplificationMultiplierAndSlippage =
        this.calculateIntegerValueString(
          new BigNumber(
            toDecimalsAmount(
              _unitCoinPriceWithPriceDecimalsAndSlippage,
              PRICE_AMPLIFICATION_MULTIPLIER,
            ),
          ),
        );
    } else {
      _unitCoinPriceWithPriceDecimalsAndSlippage = new BigNumber(
        unitCoinPriceWithPriceDecimals,
      )
        .times(new BigNumber(1).minus(_slippageBn))
        .toString(10);
      priceWithAmplificationMultiplierAndSlippage =
        this.calculateIntegerValueString(
          new BigNumber(
            toDecimalsAmount(
              _unitCoinPriceWithPriceDecimalsAndSlippage,
              PRICE_AMPLIFICATION_MULTIPLIER,
            ),
          ),
        );
    }
    return priceWithAmplificationMultiplierAndSlippage;
  }

  static calculateAmplificationPrice({
    originPrice,
    coinDecimals,
    priceDecimals = PRICE_MULTIPLIER_DECIMAL,
  }: CalculateUnitPriceParams) {
    const unitCoinPriceWithPriceDecimals = toDecimalsAmount(
      fromDecimalsAmount(originPrice, coinDecimals),
      priceDecimals,
    );
    const priceWithAmplificationMultiplier = toDecimalsAmount(
      unitCoinPriceWithPriceDecimals,
      PRICE_AMPLIFICATION_MULTIPLIER,
    );

    return priceWithAmplificationMultiplier;
  }

  static calculateIntegerValueString(originBn: BigNumber) {
    const integerValueString = originBn
      .integerValue(BigNumber.ROUND_FLOOR)
      .toString(10);
    return integerValueString;
  }

  static calculateSizeDelta({
    collateralUsdValue,
    leverage,
  }: CalculateSizeDeltaParams) {
    const _collateralUsdBn = new BigNumber(collateralUsdValue);
    const _leverageBn = new BigNumber(leverage);
    const originSizeDelta = _collateralUsdBn.times(_leverageBn);
    const sizeDeltaIntegerValue =
      HertzflowCalc.calculateIntegerValueString(originSizeDelta);
    return {
      originSizeDelta,
      sizeDeltaIntegerValue,
    };
  }

  static calculateCollateralDelta({
    sizeDelta,
    currentSize,
    currentCollateral,
  }: {
    sizeDelta: BigNumber;
    currentSize: BigNumber;
    currentCollateral: BigNumber;
  }) {
    const originCollateralDelta = currentCollateral
      .times(sizeDelta)
      .div(currentSize);
    const collateralDeltaIntegerValue =
      HertzflowCalc.calculateIntegerValueString(originCollateralDelta);

    return {
      originCollateralDelta,
      collateralDeltaIntegerValue,
    };
  }
}
