import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import { useHzvMarketsDataRequest } from './hooks/useHzvMarketsData';
import { useMarketTokensDataRequest } from './hooks/useMarketTokensData';
import type {
  MarketTokensData,
  HlvInfoData,
} from './types';
import type { Address } from 'viem';

export interface UseMarketTokensDataProviderParams {
  enabled?: boolean;
  refreshInterval?: number;
  withHlv?: boolean;
  marketAddresses?: Address[];
  vaultAddresses?: Address[];
}

export interface UseMarketTokensDataProviderResult {
  marketTokensData: MarketTokensData | undefined;
  hlvData: HlvInfoData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}


export function useMarketTokensDataProvider({
  enabled = true,
  refreshInterval,
  withHlv = true,
  marketAddresses,
  vaultAddresses,
}: UseMarketTokensDataProviderParams = {}): UseMarketTokensDataProviderResult {
  const account = useCurrentAccountAddress();

  const {
    marketTokensData,
    isLoading: isMarketsLoading,
    isFetching: isMarketsFetching,
    refetch: refetchMarkets,
  } = useMarketTokensDataRequest({
    isDeposit: true,
    account: account ?? undefined,
    enabled,
    refreshInterval,
    marketAddresses,
  });

  const {
    hlvData,
    isLoading: isHlvLoading,
    isFetching: isHlvFetching,
    refetch: refetchHlv,
  } = useHzvMarketsDataRequest({
    marketsInfoData: marketTokensData,
    account: account ?? undefined,
    enabled: enabled && withHlv && !!marketTokensData,
    refreshInterval,
    vaultAddresses,
  });

  const refetch = () => {
    refetchMarkets();
    refetchHlv();
  };

  return {
    marketTokensData,
    hlvData,
    isLoading: isMarketsLoading || (withHlv && isHlvLoading),
    isFetching: isMarketsFetching || (withHlv && isHlvFetching),
    refetch,
  };
}
