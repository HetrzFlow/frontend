import { useMemo } from 'react';
import { ZERO_STR } from '@hertzflow/sdk';
import { calc } from '@repo/lib/calc';
import { TOTAL_WEIGHT, DELTA_WEIGHT } from '@/common';

export const useWeightThresholds = (
  currentWeight: number,
  targetWeight: number,
) => {
  return useMemo(() => {
    const currentWeightDecimal = calc(currentWeight);
    const targetWeightDecimal = calc(targetWeight);
    const deltaWeightDecimal = calc(DELTA_WEIGHT).div(TOTAL_WEIGHT);

    const targetWithDelta = targetWeightDecimal.times(
      calc(1).plus(deltaWeightDecimal),
    );
    const canDeposit = currentWeightDecimal.lt(targetWithDelta);

    const targetWithDeltaForWithdraw = targetWeightDecimal.times(
      calc(1).minus(deltaWeightDecimal),
    );
    const canWithdraw = currentWeightDecimal.gt(targetWithDeltaForWithdraw);

    return {
      canDeposit,
      canWithdraw,
      currentWeightPercent: currentWeightDecimal.times(100).toNumber(),
      targetWeightPercent: targetWeightDecimal.times(100).toNumber(),
      deltaWeightPercent: deltaWeightDecimal.times(100).toNumber(),
    };
  }, [currentWeight, targetWeight]);
};

export const useMinOrderCheck = (
  inputAmount: string,
  tokenPrice: string | undefined,
) => {
  return useMemo(() => {
    if (!inputAmount || !tokenPrice) {
      return {
        isValid: false,
        minTokenAmount: ZERO_STR,
        currentUsdValue: ZERO_STR,
      };
    }

    const MIN_ORDER_USD = '0.05';
    const price = calc(tokenPrice);
    const amount = calc(inputAmount);

    const minTokenAmount = calc(MIN_ORDER_USD).div(price);

    const currentUsdValue = amount.times(price);

    const isValid = currentUsdValue.gte(MIN_ORDER_USD);

    return {
      isValid,
      minTokenAmount: minTokenAmount.toString(10),
      currentUsdValue: currentUsdValue.toString(10),
    };
  }, [inputAmount, tokenPrice]);
};
