import { formatUnits } from 'viem';
import { calc } from '@repo/lib/calc';

import type { SwapToken } from './useSwapTokens';

export const getSupportedWalletTokenGroups = (tokens: SwapToken[]) => {
  const groups: { tokens: SwapToken[]; hiddenTokens: SwapToken[] } = {
    tokens: [],
    hiddenTokens: [],
  };
  const seen = new Set<string>();

  tokens.forEach((token) => {
    const address = token.address.toLowerCase();
    if (seen.has(address) || !token.balance || !calc(token.balance).gt(0)) {
      return;
    }

    seen.add(address);
    const group =
      token.usdValue && calc(token.usdValue).gte(1)
        ? groups.tokens
        : groups.hiddenTokens;
    group.push(token);
  });

  groups.tokens.sort((a, b) =>
    calc(b.usdValue ?? 0).comparedTo(calc(a.usdValue ?? 0)),
  );
  return groups;
};

export const getSwapTokenValue = (
  token: SwapToken,
  rawBalance = 0n,
  price = token.price,
) => {
  const balance = formatUnits(rawBalance, token.decimals);

  return {
    balance,
    usdValue: calc(balance)
      .times(price || 0)
      .toString(),
  };
};
