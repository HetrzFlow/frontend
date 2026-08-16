'use client';

import { zeroAddress } from 'viem';
import { useQuery } from '@repo/lib/queryClient';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient/hooks';
import { useSwapPricesQuery } from '@/queries/bsc/swap';

import { getSwapTokenValue } from './tokenValue';
import { BNB_TOKEN, type SwapToken } from './useSwapTokens';

const uniqueTokens = (tokens: SwapToken[]) => {
  const unique = new Map<string, SwapToken>();
  tokens.forEach((token) => unique.set(token.address, token));
  return Array.from(unique.values());
};

export const getSwapTokenBalancesQueryKey = (
  chainId?: number,
  account?: string,
) => ['peach', 'swap-token-balances', chainId, account] as const;

export const useSwapTokenValues = (tokens: SwapToken[], enabled: boolean) => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const unique = uniqueTokens(tokens);
  const balanceAddresses = Array.from(
    new Set(
      unique.map((token) =>
        token.address === BNB_TOKEN.address ? zeroAddress : token.address,
      ),
    ),
  ).sort();
  const balancesQuery = useQuery({
    queryKey: [
      ...getSwapTokenBalancesQueryKey(hzSdk?.chainId, account),
      ...balanceAddresses,
    ],
    enabled: enabled && !!hzSdk && !!account && balanceAddresses.length > 0,
    queryFn: () =>
      hzSdk!.tokens.getTokensBalances(
        account,
        balanceAddresses.map((address) => ({ address })),
      ),
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
  const pricesQuery = useSwapPricesQuery(
    unique.map((token) => token.address),
    enabled,
  );
  const priceByAddress = new Map(
    (pricesQuery.data ?? []).map((item) => [item.address, item.price]),
  );

  const values = Object.fromEntries(
    unique.map((token) => {
      const balanceAddress =
        token.address === BNB_TOKEN.address ? zeroAddress : token.address;
      const price = priceByAddress.get(token.address) || token.price;

      return [
        token.address,
        {
          price,
          ...getSwapTokenValue(
            token,
            balancesQuery.data?.[balanceAddress] ?? 0n,
            price,
          ),
        },
      ];
    }),
  );

  return {
    values,
    isLoading:
      enabled &&
      !!hzSdk &&
      !!account &&
      balanceAddresses.length > 0 &&
      (balancesQuery.isLoading || pricesQuery.isLoading),
  };
};
