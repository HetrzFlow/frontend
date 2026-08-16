import { getAddress, isAddress, type Address } from 'viem';
import { get } from '@repo/lib/rest';
import type { TickerType } from '@/common/stores/priceStore';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import type { CATEGORY } from '@/services/rest/pools';
import type {
  AllClaimableCollaterals,
  PlatformTradeItem,
  UserClaimHistory,
  UserTradeActivityItem,
} from './statsTypes';
import type { TokensData } from '@hertzflow/sdk-v2/types/tokens';

export type {
  AllClaimableCollaterals,
  ClaimableData,
  PlatformTradeItem,
  UserClaimHistory,
  UserTradeActivityItem,
} from './statsTypes';

const STATS_API_BASE_URL = `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc`;

type ApiResponse<T> = { data: T };

type RawTokenResponse = {
  symbol: string;
  token_address: string;
  decimals: number;
  name?: string;
  is_index_token?: boolean;
  is_long_token?: boolean;
  is_short_token?: boolean;
};

export type StatsMarket = {
  category: CATEGORY;
  index_token_address: Address;
  is_view: boolean;
  is_closed: boolean;
  is_market_pausing?: boolean;
  is_default?: boolean;
  long_token_address: Address;
  market_address: Address;
  max_leverage_normal?: number;
  min_leverage_hyper?: number;
  max_leverage_hyper?: number;
  schedule: string;
  short_token_address: Address;
  symbol: string;
  display_name: string;
  px_disp_decimal: number;
};

export function mapStatsTokens(tokens: RawTokenResponse[]): TokensData {
  return tokens.reduce<TokensData>((result, token) => {
    const address = getAddress(token.token_address);
    result[address] = {
      address,
      symbol: token.symbol,
      name: token.name ?? token.symbol,
      decimals: token.decimals,
      isSynthetic:
        token.is_index_token === true &&
        token.is_long_token !== true &&
        token.is_short_token !== true,
    };
    return result;
  }, {});
}

export async function fetchStatsTokens(
  chainId: number,
  apiBaseUrl = STATS_API_BASE_URL,
): Promise<TokensData> {
  const response = await get<ApiResponse<{ tokens: RawTokenResponse[] }>>(
    `${apiBaseUrl}/tokens`,
    { chain_id: chainId },
  );
  const tokens = response.data?.tokens ?? [];

  return mapStatsTokens(tokens);
}

export async function fetchStatsTickers(): Promise<TickerType[]> {
  const response = await get<ApiResponse<{ prices?: TickerType[] }>>(
    `${STATS_API_BASE_URL}/prices/24h`,
  );
  return response.data?.prices ?? [];
}

export async function fetchStatsMarkets(
  apiBaseUrl = STATS_API_BASE_URL,
): Promise<StatsMarket[]> {
  const response = await get<ApiResponse<{ markets?: StatsMarket[] }>>(
    `${apiBaseUrl}/markets`,
  );
  return (response.data?.markets ?? []).map((market) => ({
    ...market,
    market_address: getAddress(market.market_address),
    index_token_address: getAddress(market.index_token_address),
    long_token_address: getAddress(market.long_token_address),
    short_token_address: getAddress(market.short_token_address),
  }));
}

function normalizeTradeAddressFields<
  T extends PlatformTradeItem | UserTradeActivityItem,
>(item: T): T {
  return {
    ...item,
    ...(isAddress(item.market) ? { market: getAddress(item.market) } : {}),
    ...(isAddress(item.collateral_token)
      ? { collateral_token: getAddress(item.collateral_token) }
      : {}),
    ...(item.user_address && isAddress(item.user_address)
      ? { user_address: getAddress(item.user_address) }
      : {}),
  };
}

export async function fetchStatsTradeHistory(params: {
  market_address: Address;
}): Promise<PlatformTradeItem[]> {
  const response = await get<ApiResponse<{ items?: PlatformTradeItem[] }>>(
    `${STATS_API_BASE_URL}/trades`,
    {
      market_address: params.market_address.toLowerCase(),
    },
  );
  return (response.data?.items ?? []).map(normalizeTradeAddressFields);
}

export async function fetchStatsUserTradeHistory(params: {
  user_address: Address;
  market_address?: Address;
  trade_types?: string;
  action_types?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: UserTradeActivityItem[]; next_cursor: string }> {
  const response = await get<
    ApiResponse<{ items?: UserTradeActivityItem[]; next_cursor: string }>
  >(`${STATS_API_BASE_URL}/user/trades`, {
    ...params,
    user_address: params.user_address.toLowerCase(),
    market_address: params.market_address?.toLowerCase(),
    limit: params.limit ?? 20,
  });
  return {
    ...response.data,
    items: (response.data?.items ?? []).map(normalizeTradeAddressFields),
  };
}

export async function fetchStatsClaims(
  userAddress: Address,
): Promise<AllClaimableCollaterals> {
  const response = await get<ApiResponse<{ claims: AllClaimableCollaterals }>>(
    `${STATS_API_BASE_URL}/user/stats`,
    { user_address: userAddress.toLowerCase() },
  );
  return response.data.claims;
}

export async function fetchStatsClaimHistory(params: {
  user_address: Address;
  flat?: boolean;
  limit?: number;
  cursor?: string;
}): Promise<{
  items: UserClaimHistory[];
  has_more: boolean;
  next_cursor: string;
}> {
  const response = await get<
    ApiResponse<{
      items: UserClaimHistory[];
      has_more: boolean;
      next_cursor: string;
    }>
  >(`${STATS_API_BASE_URL}/user/claims`, {
    ...params,
    user_address: params.user_address.toLowerCase(),
    limit: params.limit ?? 20,
  });

  return {
    ...response.data,
    items: (response.data?.items ?? []).map((item) => {
      if ('details' in item && Array.isArray(item.details)) {
        return {
          ...item,
          details: item.details.map((detail) =>
            isAddress(detail.market)
              ? { ...detail, market: getAddress(detail.market) }
              : detail,
          ),
        };
      }
      if ('market_address' in item && isAddress(item.market_address)) {
        return {
          ...item,
          market_address: getAddress(item.market_address),
        };
      }
      return item;
    }),
  };
}
