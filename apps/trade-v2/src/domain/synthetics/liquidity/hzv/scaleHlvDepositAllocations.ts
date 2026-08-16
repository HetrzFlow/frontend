import type { HlvDepositAllocation } from '@hertzflow/sdk-v2/types/liquidity';

type ScaleHlvDepositAllocationsParams = {
  allocations: HlvDepositAllocation[];
  totalLongTokenAmount: bigint;
  totalShortTokenAmount: bigint;
  scaleAmount: (amount: bigint) => bigint;
};

/**
 * Converts per-market amounts while preserving the aggregate long/short totals.
 * The final allocation receives any integer-rounding remainder.
 */
export function scaleHlvDepositAllocations({
  allocations,
  totalLongTokenAmount,
  totalShortTokenAmount,
  scaleAmount,
}: ScaleHlvDepositAllocationsParams): HlvDepositAllocation[] {
  let allocatedLongTokenAmount = 0n;
  let allocatedShortTokenAmount = 0n;

  return allocations.map((allocation, index) => {
    const isLastAllocation = index === allocations.length - 1;
    const longTokenAmount = isLastAllocation
      ? totalLongTokenAmount - allocatedLongTokenAmount
      : scaleAmount(allocation.longTokenAmount);
    const shortTokenAmount = isLastAllocation
      ? totalShortTokenAmount - allocatedShortTokenAmount
      : scaleAmount(allocation.shortTokenAmount);

    allocatedLongTokenAmount += longTokenAmount;
    allocatedShortTokenAmount += shortTokenAmount;

    return {
      ...allocation,
      longTokenAmount,
      shortTokenAmount,
    };
  });
}
