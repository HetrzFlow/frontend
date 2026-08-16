import { useMemo } from 'react';
import { ZERO_STR } from '@hertzflow/sdk';
import { calc, type BN } from '@repo/lib/calc';
import { TOTAL_WEIGHT, DELTA_WEIGHT } from '../constants/common';
import { useTvl } from './useTvl';

export const useMaxDepositWithdraw = () => {
  const { tvl: realTimeTvl } = useTvl();

  // calc TVL
  const getTvl = useMemo(() => {
    return realTimeTvl;
  }, [realTimeTvl]);

  // weight convert
  const convertWeights = useMemo(() => {
    return (
      currentWeight: number,
      targetWeight: number,
      deltaWeight: number = DELTA_WEIGHT,
    ) => {
      const currentWeightDecimal = calc(currentWeight);
      const targetWeightDecimal = calc(targetWeight);
      const deltaWeightDecimal = calc(deltaWeight).div(TOTAL_WEIGHT);
      return {
        current: currentWeightDecimal,
        target: targetWeightDecimal,
        delta: deltaWeightDecimal,
      };
    };
  }, []);

  // format Impact
  const createImpactResult = useMemo(() => {
    return (impactValue: BN): { impact: string; isHighImpact: boolean } => {
      const isHighImpact = impactValue
        .abs()
        .gt(calc(DELTA_WEIGHT / TOTAL_WEIGHT));
      return {
        impact: impactValue.toString(10),
        isHighImpact,
      };
    };
  }, []);

  const calculateMaxDepositInput = useMemo(() => {
    return ({
      currentWeight, // c%a - CoinIn current weight
      targetWeight, // t%a - CoinIn target weight
      tokenPrice,
      deltaWeight = DELTA_WEIGHT,
    }: {
      currentWeight: number;
      targetWeight: number;
      tokenPrice?: string;
      deltaWeight?: number;
    }): { coinAmount: string; usdValue: string } => {
      const tvl = getTvl;
      if (!tvl || !tokenPrice)
        return {
          coinAmount: ZERO_STR,
          usdValue: ZERO_STR,
        };

      try {
        const weights = convertWeights(
          currentWeight,
          targetWeight,
          deltaWeight,
        );

        const price = calc(tokenPrice);

        if (tvl.lte(0) || price.lte(0)) {
          return {
            coinAmount: ZERO_STR,
            usdValue: ZERO_STR,
          };
        }

        const targetWithDelta = weights.target.times(
          calc(1).plus(weights.delta),
        );
        const condition = weights.current.lt(targetWithDelta);

        if (!condition)
          return {
            coinAmount: ZERO_STR,
            usdValue: ZERO_STR,
          };

        const numerator = tvl.times(targetWithDelta.minus(weights.current));
        const denominator = price.times(calc(1).minus(targetWithDelta));

        if (denominator.lte(0))
          return {
            coinAmount: ZERO_STR,
            usdValue: ZERO_STR,
          };

        const coinAmount = calc.max(calc(0), numerator.div(denominator));

        const usdValue = coinAmount.times(price);

        return {
          coinAmount: coinAmount.toString(10),
          usdValue: usdValue.toString(10),
        };
      } catch (error) {
        console.error('Max deposit calculation error:', error);
        return {
          coinAmount: ZERO_STR,
          usdValue: ZERO_STR,
        };
      }
    };
  }, [getTvl, convertWeights]);

  const calculateMaxWithdrawal = useMemo(() => {
    return ({
      currentWeight, // c%a - CoinIn current weight
      targetWeight, // t%a - CoinIn target weight
      tokenPrice,
      deltaWeight = DELTA_WEIGHT,
    }: {
      currentWeight: number;
      targetWeight: number;
      tokenPrice?: string;
      deltaWeight?: number;
    }): { coinAmount: string; usdValue: string } => {
      const tvl = getTvl;

      if (!tvl || !tokenPrice)
        return {
          coinAmount: ZERO_STR,
          usdValue: ZERO_STR,
        };

      try {
        const weights = convertWeights(
          currentWeight,
          targetWeight,
          deltaWeight,
        );
        const price = calc(tokenPrice);

        if (tvl.lte(0) || price.lte(0))
          return {
            coinAmount: ZERO_STR,
            usdValue: ZERO_STR,
          };

        const targetWithDelta = weights.target.times(
          calc(1).minus(weights.delta),
        );

        const condition = weights.current.gt(targetWithDelta);

        if (!condition)
          return {
            coinAmount: ZERO_STR,
            usdValue: ZERO_STR,
          };

        const numerator = tvl.times(weights.current.minus(targetWithDelta));
        const denominator = price.times(calc(1).minus(targetWithDelta));

        if (denominator.lte(0))
          return {
            coinAmount: ZERO_STR,
            usdValue: ZERO_STR,
          };

        const coinAmount = calc.max(calc(0), numerator.div(denominator));
        const usdValue = coinAmount.times(price);
        return {
          coinAmount: coinAmount.toString(10),
          usdValue: usdValue.toString(10),
        };
      } catch (error) {
        console.error('Max withdrawal calculation error:', error);
        return {
          coinAmount: ZERO_STR,
          usdValue: ZERO_STR,
        };
      }
    };
  }, [getTvl, convertWeights]);

  const calculateMaxSwapSize = useMemo(() => {
    return ({
      coinInCurrentWeight, // c%a - CoinIn current weight
      coinInTargetWeight, // t%a - CoinIn target weight
      coinOutCurrentWeight, // c%b - CoinOut current weight
      coinOutTargetWeight, // t%b - CoinOut target weight
      coinOutUsdValue, // Y - CoinOut USD
      coinInPrice,
      deltaWeight = DELTA_WEIGHT,
    }: {
      coinInCurrentWeight: number;
      coinInTargetWeight: number;
      coinOutCurrentWeight: number;
      coinOutTargetWeight: number;
      coinOutUsdValue: string;
      coinInPrice?: string;
      deltaWeight?: number;
    }): { maxCoinInAmount: string; maxCoinInUsd: string } => {
      if (!realTimeTvl || realTimeTvl.lte(0) || !coinInPrice)
        return {
          maxCoinInAmount: ZERO_STR,
          maxCoinInUsd: ZERO_STR,
        };

      try {
        const tvl0 = realTimeTvl;

        // (e.g. 0.2 = 20%)
        const currentWeightA = calc(coinInCurrentWeight); // c%a
        const currentWeightB = calc(coinOutCurrentWeight); // c%b
        const targetWeightA = calc(coinInTargetWeight);
        const targetWeightB = calc(coinOutTargetWeight);
        const deltaWeightDecimal = calc(deltaWeight).div(TOTAL_WEIGHT); // 20%

        // target weight upper and lower
        const tPercentAUpper = targetWeightA.times(
          calc(1).plus(deltaWeightDecimal),
        ); // t%ₐ = t%a * (1 + 20%)

        const tPercentBLower = targetWeightB.times(
          calc(1).minus(deltaWeightDecimal),
        ); // t%_b = t%b * (1 - 20%)

        const Sa = tvl0.times(currentWeightA); // S_a = TVL * c%a
        const Sb = tvl0.times(currentWeightB); // S_b = TVL * c%b

        const Y = calc(coinOutUsdValue); // Y - CoinOut USD
        const priceA = calc(coinInPrice);

        if (tvl0.lte(0) || priceA.lte(0))
          return { maxCoinInAmount: ZERO_STR, maxCoinInUsd: ZERO_STR };

        // formula: Max{0, min{(t%ₐ·(TVL₀-Y)-Sₐ)/(1-t%ₐ), (Sᵦ-t%ᵦ·TVL₀+(t%ᵦ-1)Y)/t%ᵦ}}

        // (t%ₐ·(TVL₀-Y)-Sₐ)/(1-t%ₐ)
        const numerator1 = tPercentAUpper.times(tvl0.minus(Y)).minus(Sa);
        const denominator1 = calc(1).minus(tPercentAUpper);
        const term1 = denominator1.gt(0)
          ? numerator1.div(denominator1)
          : calc(0);

        // (Sᵦ-t%ᵦ·TVL₀+(t%ᵦ-1)Y)/t%ᵦ
        const numerator2 = Sb.minus(tPercentBLower.times(tvl0)).plus(
          tPercentBLower.minus(1).times(Y),
        );
        const term2 = tPercentBLower.gt(0)
          ? numerator2.div(tPercentBLower)
          : calc(0);

        // Max{0, min{term1, term2}}
        const minValue = calc.min(term1, term2);
        const maxSwapUsd = calc.max(calc(0), minValue);

        // coin amount
        const maxSwapCoinAmount = maxSwapUsd.div(priceA);

        return {
          maxCoinInAmount: maxSwapCoinAmount.toString(),
          maxCoinInUsd: maxSwapUsd.toString(),
        };
      } catch (error) {
        console.error('calculateMaxSwap error:', error);
        return {
          maxCoinInAmount: ZERO_STR,
          maxCoinInUsd: ZERO_STR,
        };
      }
    };
  }, [realTimeTvl]);

  const calculateSwapImpactOnWeightage = useMemo(() => {
    return ({
      coinInCurrentWeight, // c%a - CoinIn current weight
      coinInTargetWeight, // t%a - CoinIn target weight
      coinOutCurrentWeight, // c%b - CoinOut current weight
      coinOutTargetWeight, // t%b - CoinOut target weight
      coinInUsd, // X - CoinIn USD
      coinOutUsd, // Y - CoinOut USD
      deltaWeight = DELTA_WEIGHT,
    }: {
      coinInCurrentWeight: number;
      coinInTargetWeight: number;
      coinOutCurrentWeight: number;
      coinOutTargetWeight: number;
      coinInUsd: string;
      coinOutUsd: string;
      deltaWeight?: number;
    }): { impact: string; isHighImpact: boolean } => {
      const tvl = getTvl;
      if (!tvl)
        return {
          impact: ZERO_STR,
          isHighImpact: false,
        };

      try {
        const X = calc(coinInUsd); // CoinIn USD
        const Y = calc(coinOutUsd); // CoinOut USD

        // if is 0, return
        if (X.lte(0) || Y.lte(0)) {
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };
        }

        const currentWeightA = calc(coinInCurrentWeight); // c%a
        const currentWeightB = calc(coinOutCurrentWeight); // c%b
        const targetWeightA = calc(coinInTargetWeight);
        const targetWeightB = calc(coinOutTargetWeight);
        const deltaWeightDecimal = calc(deltaWeight).div(TOTAL_WEIGHT); // 20%
        if (tvl.lte(0) || targetWeightA.lte(0) || targetWeightB.lte(0))
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };

        // upper and lower
        const tPercentAUpper = targetWeightA.times(
          calc(1).plus(deltaWeightDecimal),
        ); // t%ₐ = t%a * (1 + 20%)
        const tPercentBLower = targetWeightB.times(
          calc(1).minus(deltaWeightDecimal),
        ); // t%_b = t%b * (1 - 20%)

        const Sa = tvl.times(currentWeightA); // S_a = TVL * c%a
        const Sb = tvl.times(currentWeightB); // S_b = TVL * c%b

        // min { (t%ₐ·(TVL₀-Y)-Sₐ)/(1-t%ₐ), (Sᵦ-t%_ᵦ·TVL₀+(t%_ᵦ-1)Y)/t%_ᵦ }

        // (t%ₐ·(TVL₀-Y)-Sₐ)/(1-t%ₐ)
        const numerator1 = tPercentAUpper.times(tvl.minus(Y)).minus(Sa);
        const denominator1 = calc(1).minus(tPercentAUpper);
        const term1 = denominator1.gt(0)
          ? numerator1.div(denominator1)
          : calc(0);

        // (Sᵦ-t%_ᵦ·TVL₀+(t%_ᵦ-1)Y)/t%_ᵦ
        const numerator2 = Sb.minus(tPercentBLower.times(tvl)).plus(
          tPercentBLower.minus(1).times(Y),
        );
        const term2 = tPercentBLower.gt(0)
          ? numerator2.div(tPercentBLower)
          : calc(0);

        // max X
        const maxAllowedX = calc.min(term1, term2);

        // X <= maxAllowedX, not display Impact
        if (X.lte(maxAllowedX)) {
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };
        }

        const newTvl = tvl.plus(X).minus(Y); // TVL + X - Y

        if (newTvl.lte(0))
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };

        // calc Impact_a
        // Impact_a = ((c_a% * TVL + X) / (TVL + X - Y) * 100% - t_a%) / t_a% * 100%
        const newWeightA = currentWeightA.times(tvl).plus(X).div(newTvl); // (c_a% * TVL + X) / (TVL + X - Y)
        const impactA = newWeightA.minus(targetWeightA).div(targetWeightA); // (new weight - target weight) / target weight

        // calc Impact_b
        // Impact_b = ((c_b% * TVL - Y) / (TVL + X - Y) * 100% - t_b%) / t_b% * 100%
        const newWeightB = currentWeightB.times(tvl).minus(Y).div(newTvl); // (c_b% * TVL - Y) / (TVL + X - Y)
        const impactB = newWeightB.minus(targetWeightB).div(targetWeightB); // (new weight - target weight) / target weight

        // max Impact
        const absImpactA = impactA.abs();
        const absImpactB = impactB.abs();

        const finalImpact = absImpactA.gt(absImpactB) ? impactA : impactB;

        return createImpactResult(finalImpact);
      } catch (error) {
        console.error('calculateSwapImpact error:', error);
        return {
          impact: ZERO_STR,
          isHighImpact: false,
        };
      }
    };
  }, [getTvl, createImpactResult]);

  const calculateBorrowImpactOnWeightage = useMemo(() => {
    return ({
      borrowCoinCurrentWeight,
      borrowCoinTargetWeight,
      collateralUsd,
      leverage,
      deltaWeight = DELTA_WEIGHT,
    }: {
      borrowCoinCurrentWeight: number; // c%
      borrowCoinTargetWeight: number; // t%
      collateralUsd: string; // USD
      leverage: number;
      deltaWeight?: number; // δ% - default 20%
    }): { impact: string; isHighImpact: boolean } => {
      const tvl = getTvl;
      if (!tvl)
        return {
          impact: ZERO_STR,
          isHighImpact: false,
        };

      try {
        const collateralUsdValue = calc(collateralUsd);
        const borrowSize = collateralUsdValue.times(leverage - 1); // Collateral_USD * (Leverage - 1)

        // if is 0, return
        if (collateralUsdValue.lte(0) || borrowSize.lte(0)) {
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };
        }

        // current weight
        const currentWeight = calc(borrowCoinCurrentWeight); // c%

        // target weight
        const targetWeight = calc(borrowCoinTargetWeight);
        const deltaWeightDecimal = calc(deltaWeight).div(TOTAL_WEIGHT); // δ%

        if (tvl.lte(0) || targetWeight.lte(0))
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };

        // formula: TVL × (c% - t% × (1 - δ%)) / (1 - t% × (1 - δ%))
        const numerator = currentWeight.minus(
          targetWeight.times(calc(1).minus(deltaWeightDecimal)),
        );
        const denominator = calc(1).minus(
          targetWeight.times(calc(1).minus(deltaWeightDecimal)),
        );

        if (denominator.lte(0))
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };

        const borrowThreshold = tvl.times(numerator.div(denominator));

        // not display Impact
        if (borrowSize.lte(borrowThreshold)) {
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };
        }

        // X = 0, Y = borrowSize
        const X = calc(0);
        const Y = borrowSize;
        const newTvl = tvl.plus(X).minus(Y); // TVL + 0 - borrowSize

        if (newTvl.lte(0))
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };

        // Impact = ((c% * TVL - Y) / (TVL - Y) * 100% - t%) / t% * 100%
        const newWeight = currentWeight.times(tvl).minus(Y).div(newTvl);
        const impact = newWeight.minus(targetWeight).div(targetWeight);

        return createImpactResult(impact);
      } catch (error) {
        console.error('calculateBorrowImpactOnWeightage error:', error);
        return {
          impact: ZERO_STR,
          isHighImpact: false,
        };
      }
    };
  }, [getTvl, createImpactResult]);

  const calculateHzLPImpactOnWeightage = useMemo(() => {
    return ({
      tokenCurrentWeight, // c%
      tokenTargetWeight, // t%
      operationUsd, // Deposit_USD or Withdraw_USD
      isBuy, // true=deposit HzLP, false=withdraw HzLP
      deltaWeight = DELTA_WEIGHT, // δ% - default 20%
    }: {
      tokenCurrentWeight: number;
      tokenTargetWeight: number;
      operationUsd: string;
      isBuy: boolean;
      deltaWeight?: number;
    }): { impact: string; isHighImpact: boolean } => {
      const tvl = getTvl;
      if (!tvl)
        return {
          impact: ZERO_STR,
          isHighImpact: false,
        };

      try {
        const operationAmount = calc(operationUsd);

        // if is 0, return
        if (operationAmount.lte(0)) {
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };
        }

        const weights = convertWeights(
          tokenCurrentWeight,
          tokenTargetWeight,
          deltaWeight,
        );

        if (tvl.lte(0) || weights.target.lte(0)) {
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };
        }

        let maxAllowed: BN;

        if (isBuy) {
          // MaxDeposit: TVL × (t% × (1 + δ%) - c%) / (1 - t% × (1 + δ%))
          const numerator = weights.target
            .times(calc(1).plus(weights.delta))
            .minus(weights.current);
          const denominator = calc(1).minus(
            weights.target.times(calc(1).plus(weights.delta)),
          );

          if (denominator.lte(0)) {
            return {
              impact: ZERO_STR,
              isHighImpact: false,
            };
          }

          maxAllowed = tvl.times(numerator.div(denominator));
        } else {
          // MaxWithdraw: TVL × (c% - t% × (1 - δ%)) / (1 - t% × (1 - δ%))
          const numerator = weights.current.minus(
            weights.target.times(calc(1).minus(weights.delta)),
          );
          const denominator = calc(1).minus(
            weights.target.times(calc(1).minus(weights.delta)),
          );

          if (denominator.lte(0)) {
            return {
              impact: ZERO_STR,
              isHighImpact: false,
            };
          }

          maxAllowed = tvl.times(numerator.div(denominator));
        }

        // not display
        if (operationAmount.lte(maxAllowed)) {
          return {
            impact: ZERO_STR,
            isHighImpact: false,
          };
        }

        let newWeight: BN;
        if (isBuy) {
          // ratio = ((c% × TVL + Deposit_usd) / (TVL + Deposit_usd) × 100% - t%) / t% × 100%
          const newTvl = tvl.plus(operationAmount);
          newWeight = weights.current
            .times(tvl)
            .plus(operationAmount)
            .div(newTvl);
        } else {
          // ratio = ((c% × TVL - Withdraw_usd) / (TVL - Withdraw_usd) × 100% - t%) / t% × 100%
          const newTvl = tvl.minus(operationAmount);

          if (newTvl.lte(0))
            return {
              impact: ZERO_STR,
              isHighImpact: false,
            };

          newWeight = weights.current
            .times(tvl)
            .minus(operationAmount)
            .div(newTvl);
        }

        const weightDeviation = newWeight
          .minus(weights.target)
          .div(weights.target);

        return createImpactResult(calc(weightDeviation));
      } catch (error) {
        console.error('calculateHzLPImpactOnWeightage error:', error);
        return {
          impact: ZERO_STR,
          isHighImpact: false,
        };
      }
    };
  }, [getTvl, createImpactResult, convertWeights]);

  return {
    calculateMaxDepositInput,
    calculateMaxWithdrawal,
    calculateMaxSwapSize,
    calculateSwapImpactOnWeightage,
    calculateBorrowImpactOnWeightage,
    calculateMaxBorrowSize: calculateMaxWithdrawal,
    calculateHzLPImpactOnWeightage,
  };
};
