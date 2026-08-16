import { useMemo } from 'react';
import { calc } from '@repo/lib/calc';
import { CONTRACT_USD_MULTIPLIER } from '@/common/constants';
import type {
  MarketConfig,
  MarketValues,
} from '@hertzflow/sdk-v2/types/markets';

interface LossRebateEstimateParams {
  collateral: string | number;
  sizeDelta: string | number;
  marketConfig: MarketConfig | undefined;
  marketValues: MarketValues | undefined;
  isLong: boolean;
  isZFP: boolean;
}

export interface LossRebateEstimateResult {
  rebateUsd: ReturnType<typeof calc>;
  branch: 1 | 2 | 3;
  isEligible: boolean;
}

const ZERO = calc(0);

export const useLossRebateEstimate = ({
  collateral,
  sizeDelta,
  marketConfig,
  marketValues,
  isLong,
  isZFP,
}: LossRebateEstimateParams): LossRebateEstimateResult => {
  return useMemo(() => {
    const ineligible = {
      rebateUsd: ZERO,
      branch: 3 as const,
      isEligible: false,
    };

    // Guard: Hyper mode or missing data
    if (isZFP || !marketConfig || !marketValues) return ineligible;
    if (!marketConfig.lossRebateRate) return ineligible;

    const longOi = calc(marketValues.longInterestUsd.toString()).div(
      CONTRACT_USD_MULTIPLIER,
    );
    const shortOi = calc(marketValues.shortInterestUsd.toString()).div(
      CONTRACT_USD_MULTIPLIER,
    );

    // Determine weak side (pre-trade OI — actual determined at execution)
    const isUserWeakSide =
      (isLong && longOi.lt(shortOi)) || (!isLong && shortOi.lt(longOi));
    if (!isUserWeakSide) return ineligible;

    const oiDiff = longOi.minus(shortOi).abs();
    const sd = calc(sizeDelta);
    const coll = calc(collateral);
    // Convert lr_factor from contract precision to decimal (e.g. 8% = 0.08)
    const lrFactor = calc(marketConfig.lossRebateRate.toString()).div(
      CONTRACT_USD_MULTIPLIER,
    );

    if (sd.isZero() || coll.isZero()) return ineligible;

    // Branch 1: No flip (sizeDelta <= OI_diff)
    if (sd.lte(oiDiff)) {
      return {
        rebateUsd: coll.times(lrFactor),
        branch: 1 as const,
        isEligible: true,
      };
    }

    // Check flip limit: sizeDelta <= (strong^2 - weak^2) / weak
    const strong = isLong ? shortOi : longOi;
    const weak = isLong ? longOi : shortOi;

    // When weak OI is 0, contract skips threshold check — any size qualifies
    if (weak.isZero()) {
      const collateralPart = coll.times(oiDiff).div(sd);
      return {
        rebateUsd: collateralPart.times(lrFactor),
        branch: 2 as const,
        isEligible: true,
      };
    }

    const flipLimit = strong.pow(2).minus(weak.pow(2)).div(weak);

    // Branch 2: Flip within limit
    // collateralPart = coll × min(sizeDelta, oiDiff) / sizeDelta
    // Since Branch 2 is only reached when sd > oiDiff, min(sd, oiDiff) = oiDiff
    if (sd.lte(flipLimit)) {
      const collateralPart = coll.times(oiDiff).div(sd);
      return {
        rebateUsd: collateralPart.times(lrFactor),
        branch: 2 as const,
        isEligible: true,
      };
    }

    // Branch 3: Flip exceeds limit
    return ineligible;
  }, [collateral, sizeDelta, marketConfig, marketValues, isLong, isZFP]);
};
