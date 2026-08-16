import { useMemo } from 'react';
import { getAddress, type Address } from 'viem';
import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import { useMarketTokensQuery } from '../queries/useMarketTokensQuery';
import type { MarketTokensData } from '../types';

export type UseMarketTokensByAddressesParams = {
  marketAddresses?: Array<string | Address>;
  isDeposit: boolean;
  enabled?: boolean;
  account?: Address;
  includeAccount?: boolean;
  refreshInterval?: number;
};

export type UseMarketTokensByAddressesResult = {
  marketTokensData: MarketTokensData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
};

export function useMarketTokensByAddresses({
  marketAddresses,
  isDeposit,
  enabled = true,
  account,
  includeAccount = true,
  refreshInterval,
}: UseMarketTokensByAddressesParams): UseMarketTokensByAddressesResult {
  const accountFromWallet = useCurrentAccountAddress();

  const normalizedAddresses = useMemo(() => {
    if (!marketAddresses || marketAddresses.length === 0) return [];
    const set = new Set<Address>();
    for (const raw of marketAddresses) {
      if (!raw) continue;
      try {
        set.add(getAddress(raw) as Address);
      } catch {
        set.add(raw as Address);
      }
    }
    return Array.from(set);
  }, [marketAddresses]);

  const shouldFetch = enabled && normalizedAddresses.length > 0;
  const resolvedAccount = includeAccount
    ? (account ?? accountFromWallet ?? undefined)
    : undefined;

  const {
    data: queryData,
    isLoading,
    isFetching,
    refetch,
  } = useMarketTokensQuery({
    marketAddresses: normalizedAddresses,
    account: resolvedAccount,
    isDeposit,
    enabled: shouldFetch,
    refreshInterval,
  });

  const marketTokensData = useMemo(() => {
    return queryData?.marketTokensData;
  }, [queryData?.marketTokensData]);

  return {
    marketTokensData,
    isLoading: shouldFetch ? isLoading : false,
    isFetching: shouldFetch ? isFetching : false,
    refetch,
  };
}
