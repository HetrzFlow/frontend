export function getClaimMarketInst<T extends { marketTokenAddress?: string }>(
  insts: Record<string, T | undefined>,
  market: string | undefined,
) {
  if (!market) return undefined;

  return (
    insts[market] ||
    Object.entries(insts).find(([address, inst]) => {
      const normalizedMarket = market.toLowerCase();
      return (
        address.toLowerCase() === normalizedMarket ||
        inst?.marketTokenAddress?.toLowerCase() === normalizedMarket
      );
    })?.[1]
  );
}
