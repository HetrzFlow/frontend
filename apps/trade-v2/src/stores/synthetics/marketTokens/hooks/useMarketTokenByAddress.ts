import { useMemo } from 'react';
import { getAddress, type Address } from 'viem';
import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import { useMarketTokensQuery } from '../queries/useMarketTokensQuery';
import type { MarketTokenData } from '../types';

export type UseMarketTokenByAddressParams = {
  marketAddress?: string | Address;
  isDeposit: boolean;
  enabled?: boolean;
  account?: Address;
  includeAccount?: boolean;
  refreshInterval?: number;
};

export type UseMarketTokenByAddressResult = {
  marketTokenData: MarketTokenData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
};

export function useMarketTokenByAddress({
  marketAddress,
  isDeposit,
  enabled = true,
  account,
  includeAccount = true,
  refreshInterval,
}: UseMarketTokenByAddressParams): UseMarketTokenByAddressResult {
  const accountFromWallet = useCurrentAccountAddress();
  const checksumAddress = useMemo(() => {
    if (!marketAddress) return undefined;
    try {
      return getAddress(marketAddress) as Address;
    } catch {
      return marketAddress as Address;
    }
  }, [marketAddress]);

  const shouldFetch = enabled && !!checksumAddress;
  const resolvedAccount = includeAccount
    ? (account ?? accountFromWallet ?? undefined)
    : undefined;

  const {
    data: queryData,
    isLoading,
    isFetching,
    refetch,
  } = useMarketTokensQuery({
    marketAddresses: checksumAddress ? [checksumAddress] : [],
    account: resolvedAccount,
    isDeposit,
    enabled: shouldFetch,
    refreshInterval,
  });

  const queryDataByAddress = useMemo(() => {
    if (!checksumAddress) return undefined;
    return queryData?.marketTokensData?.[checksumAddress];
  }, [checksumAddress, queryData?.marketTokensData]);

  const marketTokenData = useMemo(() => {
    return queryDataByAddress;
  }, [queryDataByAddress]);

  return {
    marketTokenData,
    isLoading: shouldFetch ? isLoading : false,
    isFetching: shouldFetch ? isFetching : false,
    refetch,
  };
}
