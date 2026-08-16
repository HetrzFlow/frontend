'use client';

import { useMemo } from 'react';
import { calc } from '@repo/lib/calc';
import { useBalancesQuery, useCurrentAccountAddress } from '@/common/chainClient';
import type { Coin } from '@/common/services/rest/inst';
import { useInstStore } from '@/common/stores';

interface UseNativeBalanceOptions {
  /**
   * Minimum native amount (human-readable, e.g. "0.0001") required to consider
   * the wallet capable of sending a tx. Defaults to "0" so any positive
   * balance counts as sufficient.
   */
  minAmount?: string | number;
}

interface UseNativeBalanceResult {
  nativeCoin: Coin | undefined;
  symbol: string;
  decimals: number;
  rawBalance: string;
  balance: ReturnType<typeof calc>;
  isConnected: boolean;
  isLoading: boolean;
  hasSufficientBalance: boolean;
  insufficientHint: string;
}

const DEFAULT_DECIMALS = 18;

export const useNativeBalance = (
  options: UseNativeBalanceOptions = {},
): UseNativeBalanceResult => {
  const { minAmount = '0' } = options;
  const account = useCurrentAccountAddress();
  const { data: tokensData, isLoading: isBalancesLoading } =
    useBalancesQuery(account);
  const coinsMap = useInstStore((state) => state.getCoins());

  const nativeCoin = useMemo(() => {
    const coins = Object.values(coinsMap ?? {});
    return coins.find((coin) => coin.isNative);
  }, [coinsMap]);

  const decimals = nativeCoin?.decimals ?? DEFAULT_DECIMALS;
  const symbol = nativeCoin?.symbol ?? '';

  const rawBalance = useMemo(() => {
    if (!tokensData || !nativeCoin?.address) return '0';
    const value = tokensData[nativeCoin.address];
    return value !== undefined && value !== null ? value.toString() : '0';
  }, [tokensData, nativeCoin?.address]);

  const balance = useMemo(
    () => calc(rawBalance).div(Math.pow(10, decimals)),
    [rawBalance, decimals],
  );

  const isConnected = !!account;
  const isLoading = isConnected && (isBalancesLoading || !tokensData);
  const hasSufficientBalance =
    isConnected && !isLoading && balance.gt(minAmount);

  const insufficientHint = symbol
    ? `Insufficient ${symbol} for gas fee`
    : 'Insufficient gas fee';

  return {
    nativeCoin,
    symbol,
    decimals,
    rawBalance,
    balance,
    isConnected,
    isLoading,
    hasSufficientBalance,
    insufficientHint,
  };
};
