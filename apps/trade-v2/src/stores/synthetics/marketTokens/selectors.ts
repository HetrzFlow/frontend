import { useMemo } from 'react';
import type { Inst } from '@/common';
import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import type { CATEGORY } from '@/services/rest/pools';
import { useHzvMarketsDataRequest } from './hooks/useHzvMarketsData';
import { useMarketTokensDataRequest } from './hooks/useMarketTokensData';
import type {
  MarketTokenData,
  MarketTokensData,
  HlvInfoData,
  HlvInfo,
  TokenView,
  TokensViewData,
} from './types';
import type { Address } from 'viem';

export interface PoolsListItem {
  category: CATEGORY | undefined;
  displayName: string | undefined;
  symbol: string | undefined;
  inst?: Inst;
  marketAddress: Address | undefined;
  indexTokenAddress: Address | undefined;
  longTokenAddress: Address | undefined;
  shortTokenAddress: Address | undefined;
  tvl: bigint | undefined;
  supply: bigint | undefined;
  feeApy: string | undefined;
  aprHistory: Array<{ fee_apr: string; timestamp: number }> | undefined;
  isDisabled?: boolean;
  isClosed?: boolean;
}

function getByAddress<T>(
  data: Record<string, T> | undefined,
  address: Address | undefined,
): T | undefined {
  if (!data || !address) return undefined;
  return (
    data[address] ??
    data[address.toLowerCase()] ??
    data[String(address).toLowerCase()]
  );
}

function useMarketTokensData({
  enabled = true,
  refreshInterval,
  marketAddresses,
}: {
  enabled?: boolean;
  refreshInterval?: number;
  marketAddresses?: Address[];
} = {}): MarketTokensData | undefined {
  const account = useCurrentAccountAddress();
  const { marketTokensData } = useMarketTokensDataRequest({
    isDeposit: true,
    account: account ?? undefined,
    enabled,
    refreshInterval,
    marketAddresses,
  });

  return marketTokensData;
}

// ============================================================================
// HLV Selectors
// ============================================================================

export function useHlvDataSnapshot({
  enabled = true,
  marketAddresses,
  vaultAddresses,
}: {
  enabled?: boolean;
  marketAddresses?: Address[];
  vaultAddresses?: Address[];
} = {}) {
  const account = useCurrentAccountAddress();
  const marketTokensQuery = useMarketTokensDataRequest({
    isDeposit: true,
    account: account ?? undefined,
    enabled,
    marketAddresses,
  });
  const hlvQuery = useHzvMarketsDataRequest({
    marketsInfoData: marketTokensQuery.marketTokensData,
    account: account ?? undefined,
    enabled: enabled && !!marketTokensQuery.marketTokensData,
    vaultAddresses,
  });

  return {
    hlvData: hlvQuery.hlvData,
    hlvDataUpdatedAt: hlvQuery.dataUpdatedAt,
    hlvIsFetching: hlvQuery.isFetching,
    hlvIsError: hlvQuery.isError,
    marketTokensData: marketTokensQuery.marketTokensData,
    marketTokensDataUpdatedAt: marketTokensQuery.dataUpdatedAt,
    marketTokensIsFetching: marketTokensQuery.isFetching,
    marketTokensIsError: marketTokensQuery.isError,
  };
}

export function useHlvData({
  enabled = true,
  marketAddresses,
  vaultAddresses,
}: {
  enabled?: boolean;
  marketAddresses?: Address[];
  vaultAddresses?: Address[];
} = {}): HlvInfoData | undefined {
  const { hlvData } = useHlvDataSnapshot({
    enabled,
    marketAddresses,
    vaultAddresses,
  });

  return hlvData;
}

function useHlvInfo(
  address: Address | undefined,
  options?: {
    enabled?: boolean;
    marketAddresses?: Address[];
    vaultAddresses?: Address[];
  },
): HlvInfo | undefined {
  const hlvData = useHlvData(options);

  return getByAddress(hlvData, address);
}

export function useHlvWalletBalance(
  address: Address | undefined,
  options?: {
    enabled?: boolean;
    marketAddresses?: Address[];
    vaultAddresses?: Address[];
  },
): bigint | undefined {
  const hlvInfo = useHlvInfo(address, options);

  return hlvInfo?.hlvToken?.balance;
}

// ============================================================================
// Market token + HLV token-view unified selectors (HF-aligned)
// ============================================================================

export function useMarketAndHlvTokensData(
  p: {
    withHlv?: boolean;
    refreshInterval?: number;
    marketAddresses?: Address[];
    vaultAddresses?: Address[];
  } = {},
): TokensViewData | undefined {
  const { withHlv = true, refreshInterval, marketAddresses, vaultAddresses } =
    p;

  const account = useCurrentAccountAddress();
  const marketTokensData = useMarketTokensData({
    refreshInterval,
    marketAddresses,
  });
  const { hlvData } = useHzvMarketsDataRequest({
    marketsInfoData: marketTokensData,
    account: account ?? undefined,
    enabled: withHlv && !!marketTokensData,
    refreshInterval,
    vaultAddresses,
  });

  return useMemo(() => {
    if (!marketTokensData && (!withHlv || !hlvData)) {
      return undefined;
    }

    const result: TokensViewData = {};

    if (marketTokensData) {
      (
        Object.entries(marketTokensData) as Array<[Address, MarketTokenData]>
      ).forEach(([address, marketToken]) => {
        const tokenView: TokenView = {
          address: marketToken.address ?? address,
          name: marketToken.name,
          symbol: marketToken.symbol,
          decimals: marketToken.decimals,
          prices: marketToken.prices,
          totalSupply: marketToken.totalSupply,
          balance: marketToken.walletBalance,
          tokenKind: 'hzlp',
        };
        result[address] = tokenView;
      });
    }

    if (withHlv && hlvData) {
      Object.values(hlvData).forEach((hlvInfo) => {
        const hlvTokenAddress = hlvInfo.hlvTokenAddress;
        const hlvToken = hlvInfo.hlvToken;

        const tokenView: TokenView = {
          address: hlvTokenAddress,
          name: hlvInfo.name ?? hlvToken.name,
          symbol: hlvToken.contractSymbol || hlvToken.symbol,
          decimals: hlvToken.decimals,
          prices: hlvToken.prices,
          totalSupply: hlvToken.totalSupply ?? hlvInfo.totalSupply,
          balance: hlvToken.balance ?? hlvInfo.walletBalance,
          tokenKind: 'hlv',
        };

        result[hlvTokenAddress] = tokenView;
      });
    }

    return result;
  }, [marketTokensData, hlvData, withHlv]);
}

export { usePoolDetailData } from './selectors/usePoolDetailData';
export type { PoolDetailData } from './selectors/usePoolDetailData';
