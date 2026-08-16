import { useEffect, useMemo } from 'react';
import { getAddress, type Address } from 'viem';
import { useInstStore } from '@/common/stores/instStore';
import { useMarketTokensQuery } from '../queries/useMarketTokensQuery';
import type { MarketTokensData } from '../types';

export interface UseMarketTokensDataRequestParams {
  isDeposit: boolean;
  account?: Address;
  enabled?: boolean;
  refreshInterval?: number;
  marketAddresses?: Address[];
}

export interface UseMarketTokensDataRequestResult {
  marketTokensData: MarketTokensData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
  dataUpdatedAt: number;
}

export function useMarketTokensDataRequest({
  isDeposit,
  account,
  enabled = true,
  refreshInterval,
  marketAddresses,
}: UseMarketTokensDataRequestParams): UseMarketTokensDataRequestResult {
  const instsMap = useInstStore((state) => state.insts.map);
  const requestInsts = useInstStore((state) => state.getInsts);

  useEffect(() => {
    requestInsts();
  }, [requestInsts]);

  // Get market addresses from instsMap - only extract valid marketTokenAddress
  const resolvedMarketAddresses = useMemo(() => {
    const addresses = new Set<Address>();
    if (marketAddresses) {
      marketAddresses.forEach((addr) => {
        try {
          addresses.add(getAddress(addr) as Address);
        } catch {
          addresses.add(addr as Address);
        }
      });
      return Array.from(addresses).sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase()),
      );
    }
    Object.values(instsMap).forEach((inst) => {
      if (inst.marketTokenAddress) {
        try {
          addresses.add(getAddress(inst.marketTokenAddress) as Address);
        } catch {
          addresses.add(inst.marketTokenAddress as Address);
        }
      }
    });
    return Array.from(addresses).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
  }, [instsMap, marketAddresses]);

  const shouldFetch = enabled && resolvedMarketAddresses.length > 0;

  const {
    data: queryResult,
    isLoading,
    isFetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useMarketTokensQuery({
    marketAddresses: resolvedMarketAddresses,
    account,
    isDeposit,
    enabled: shouldFetch,
    refreshInterval,
  });

  const marketTokensData = useMemo(() => {
    return queryResult?.marketTokensData;
  }, [queryResult]);

  return {
    marketTokensData,
    isLoading,
    isFetching,
    isError,
    refetch,
    dataUpdatedAt,
  };
}
