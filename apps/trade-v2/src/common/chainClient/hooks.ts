'use client';

import { useContext, useMemo } from 'react';

import { type Address } from 'viem';
import { useQuery } from '@repo/lib/queryClient';

import { toast } from '@repo/ui';
import { DYNAMIC_DATA_CACHE_TIME } from '../constants/timeConstants';
import { useInstStore } from '../stores';
import { HzSdkContext } from './HzSdkProvider';
import { useActiveWallet, usePrivy } from './privyCompat';
import type { TokenBalancesData } from '@hertzflow/sdk-v2/types/tokens';

export const useHzSdk = () => {
  const sdk = useContext(HzSdkContext);
  return sdk;
};

export const useChainId = () => {
  const hzSdk = useHzSdk();
  const chainId = useMemo(() => hzSdk?.chainId, [hzSdk?.chainId]);
  return chainId;
};

export const useCurrentAccount = () => {
  const { authenticated, user } = usePrivy();
  const { wallet } = useActiveWallet();

  return authenticated && user?.id
    ? {
        address: wallet?.address ?? '',
      }
    : undefined;
};

export const useCurrentAccountAddress = (): Address => {
  const { address } = useCurrentAccount() || {};

  return (address ?? '') as Address;
};

export const useIsConnect = () => {
  const currentAccount = useCurrentAccount();

  return !!currentAccount?.address;
};

export type ConnectionStatus = 'unknown' | 'disconnected' | 'connected';

export const useConnectionStatus = (): ConnectionStatus => {
  const { ready, authenticated } = usePrivy();
  const { wallet } = useActiveWallet();

  if (!ready) return 'unknown';
  if (!authenticated) return 'disconnected';
  if (!wallet?.address) return 'disconnected';
  return 'connected';
};

export const normalizeStructTag = (coinType: string) => {
  return coinType;
};

type BalanceItem = {
  address: string;
  totalBalance: string;
  symbol: string;
  name: string;
  decimals: number;
};

export const useBalancesQuery = (owner?: string) => {
  const hzSdk = useHzSdk();
  const account = owner || hzSdk?.account;
  const coinsArr = useInstStore((state) => state.getCoinsArr());
  const balanceCoins = useMemo(
    () => coinsArr.filter((coin) => !coin.isSynthetic),
    [coinsArr],
  );
  const coinsKey = useMemo(
    () =>
      balanceCoins.length > 0
        ? balanceCoins
            .map((c) => String(c.address).toLowerCase())
            .sort()
            .join('-')
        : '',
    [balanceCoins],
  );
  const enabled = !!hzSdk && !!account && balanceCoins.length > 0;

  const result = useQuery<TokenBalancesData>({
    queryKey: ['balances', hzSdk?.chainId, account, coinsKey],
    enabled,
    queryFn: async () => {
      if (!hzSdk || !account) {
        throw new Error('Balances query executed before prerequisites loaded');
      }
      try {
        const TokenBalancesData = await hzSdk.tokens.getTokensBalances(
          account,
          balanceCoins.map((coin) => ({
            address: coin.address,
            isSynthetic: coin.isSynthetic,
          })),
        );
        if (!TokenBalancesData) {
          throw new Error('Failed to fetch token balances');
        }
        return TokenBalancesData;
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-balances' });
        throw error;
      }
    },
    staleTime: 5_000,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return result;
};

export const useBalances = () => {
  const userAddress = useCurrentAccountAddress();
  const { data: tokensData } = useBalancesQuery(userAddress);
  const coins = useInstStore((state) => state.getCoins());

  return useMemo(() => {
    if (!tokensData) {
      return [] as BalanceItem[];
    }

    return Object.entries(tokensData).map(([address, amount]) => ({
      address: address,
      totalBalance: amount ? amount.toString() : '0',
      symbol: coins[address]?.symbol || '',
      name: coins[address]?.name || '',
      decimals: coins[address]?.decimal || '',
    }));
  }, [tokensData, coins]);
};
