import type { Coin } from '../services/rest/inst';

export function indexCoins(
  coins: Coin[],
  initial: Record<string, Coin> = {},
): Record<string, Coin> {
  const index = { ...initial };

  for (const coin of coins) {
    if (coin.address) {
      index[coin.address] = coin;
    }

    const indexedBySymbol = index[coin.symbol];
    if (
      !indexedBySymbol ||
      (indexedBySymbol.isSynthetic && !coin.isSynthetic)
    ) {
      index[coin.symbol] = coin;
    }
  }

  return index;
}
