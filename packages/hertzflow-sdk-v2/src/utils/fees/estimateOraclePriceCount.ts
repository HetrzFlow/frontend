
export function estimateDepositOraclePriceCount(swapsCount: number): bigint {
  return 3n + BigInt(swapsCount);
}

export function estimateWithdrawalOraclePriceCount(swapsCount: number): bigint {
  return 3n + BigInt(swapsCount);
}

export function estimateOrderOraclePriceCount(swapsCount: number): bigint {
  return 3n + BigInt(swapsCount);
}

export function estimateShiftOraclePriceCount(): bigint {
  return 4n;
}

export function estimateHlvDepositOraclePriceCount(marketCount: bigint, swapsCount = 0n) {
  return 2n + marketCount + swapsCount;
}

export function estimateHlvWithdrawalOraclePriceCount(marketCount: bigint, swapsCount = 0n) {
  return 2n + marketCount + swapsCount;
}
