export function getMaxPoolTradeAmount({
  remainingCapacity,
  remainingAmountCapacity,
  payTokenLimitPriceUsd,
  payTokenDecimals,
}: {
  remainingCapacity?: bigint;
  remainingAmountCapacity?: bigint;
  payTokenLimitPriceUsd?: bigint | null;
  payTokenDecimals: number;
}) {
  const candidates: bigint[] = [];

  if (remainingAmountCapacity !== undefined) {
    candidates.push(remainingAmountCapacity);
  }
  if (
    remainingCapacity !== undefined &&
    payTokenLimitPriceUsd != null &&
    payTokenLimitPriceUsd > 0n
  ) {
    candidates.push(
      (remainingCapacity * 10n ** BigInt(payTokenDecimals)) /
        payTokenLimitPriceUsd,
    );
  }

  if (!candidates.length) return undefined;
  return candidates.reduce((min, value) => (value < min ? value : min));
}
