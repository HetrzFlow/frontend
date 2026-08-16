import { getAddress } from 'viem';
import type {
  AllClaimableCollaterals,
  ClaimableData,
} from './statsTypes';

export type ClaimStatsConstants = {
  claimableCollateralDelay: bigint;
  claimableCollateralReductionFactor: bigint;
  claimableCollateralTimeDivisor: bigint;
};

const CLAIM_FACTOR_PRECISION = 10n ** 30n;

export function normalizeClaimStats(
  claims: AllClaimableCollaterals,
  positionsConstants: ClaimStatsConstants,
): { claimablePriceImpact: ClaimableData[]; totalClaimedUsd: string } {
  const claimablePriceImpact = claims.claimable_price_impact.flatMap((item) => {
    const factorByTime = BigInt(item.factor_by_time);
    const reductionFactor = BigInt(item.reduction_factor || 0);
    const timeKey = BigInt(item.time_key);
    const value = BigInt(item.amount);
    let factor = BigInt(item.factor);

    if (factorByTime > factor) factor = factorByTime;

    if (
      factor === 0n &&
      reductionFactor === 0n &&
      BigInt(Math.floor(Date.now() / 1000)) -
        timeKey * positionsConstants.claimableCollateralTimeDivisor >
        positionsConstants.claimableCollateralDelay
    ) {
      factor = CLAIM_FACTOR_PRECISION;
    }

    factor = factor > reductionFactor ? factor - reductionFactor : 0n;
    const amount = (value * factor) / CLAIM_FACTOR_PRECISION;

    if (factor <= 0n || amount <= 0n) return [];

    return [
      {
        ...item,
        market_address: getAddress(item.market_address),
        token_address: getAddress(item.token_address),
        amount: amount.toString(),
      },
    ];
  });

  return {
    claimablePriceImpact,
    totalClaimedUsd: claims.total_claimed_usd,
  };
}
