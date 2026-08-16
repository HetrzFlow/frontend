import { get } from '@repo/lib/rest';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toChecksumAddress, toLowerAddressParam } from '@/lib/address';
import { LiqTradeType } from '@/stores/pools/trade';

const SUCCESS_CODE = 200;

export enum CATEGORY {
  all = 'all',
  favorites = 'favorites',
  crypto = 'crypto',
  forex = 'forex',
  equities = 'equities',
  indices = 'indices',
  commodities = 'commodities',
  memes = 'memes',
  newest = 'newest',
  credit = 'credit',
}
export const DEFAULT_POOLS_LIST_PAGE_SIZE = 10;

export type PoolsListSortBy = 'tvl_usd' | 'fee_apy';
export type PoolsListSortOrder = 'asc' | 'desc';

export type PoolsListReq = {
  category?: CATEGORY;
  wallet_address?: string;
  period?: APY_PERIOD | string;
  sort_by?: PoolsListSortBy;
  sort_order?: PoolsListSortOrder;
  search?: string;
  in_wallet?: boolean;
  is_view?: boolean;
  favorites?: string[] | string;
  page?: number;
  page_size?: number;
};
export type PoolItem = {
  category: CATEGORY;
  market_address: string;
  display_name: string;
  symbol: string;
  index_token_address: string;
  long_token_address: string;
  short_token_address: string;
  tvl_usd: string;
  lp_supply: string;
  fee_apy: string;
  fee_apr_30d: string;
  tokens_balance: string;
  is_disabled: boolean;
  is_view: boolean;
  realized_pnl: string;
  unrealized_pnl: string;
  total_bought: string;
  average_deposit_price: string;
  fee_apr_history: Array<{ fee_apr: string; timestamp: number }>;
};
export type PoolsListRes = {
  data: {
    pools: Array<PoolItem>;
    total_count: number;
    page: number;
    page_size: number;
  };
};

type PoolsListApiResponse = Omit<PoolsListRes, 'data'> & {
  data: Omit<PoolsListRes['data'], 'pools'> & {
    pools: PoolsListRes['data']['pools'] | null;
  };
};

type PoolAddressFields = Pick<
  PoolItem,
  | 'market_address'
  | 'index_token_address'
  | 'long_token_address'
  | 'short_token_address'
>;

const mapPoolItem = <T extends PoolAddressFields>(item: T): T => ({
  ...item,
  market_address: toChecksumAddress(item.market_address),
  index_token_address: toChecksumAddress(item.index_token_address),
  long_token_address: toChecksumAddress(item.long_token_address),
  short_token_address: toChecksumAddress(item.short_token_address),
});

export const fetchPoolsList = async (req: PoolsListReq) => {
  const { category, period, favorites, ...rest } = req;
  const params: Omit<PoolsListReq, 'category' | 'period' | 'favorites'> & {
    category?: CATEGORY;
    period?: string;
    favorites?: string;
  } = {
    is_view: true,
    ...rest,
    wallet_address: toLowerAddressParam(rest.wallet_address),
  };

  if (
    category &&
    category !== CATEGORY.all &&
    category !== CATEGORY.favorites
  ) {
    params.category = category;
  }

  if (period) {
    params.period = normalizeApyPeriod(period);
  }

  if (favorites) {
    params.favorites = Array.isArray(favorites)
      ? favorites
          .map((address) => toLowerAddressParam(address))
          .filter(Boolean)
          .join(',')
      : favorites
          .split(',')
          .map((address) => toLowerAddressParam(address))
          .filter(Boolean)
          .join(',');
  }

  const response = await get<PoolsListApiResponse>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/pools/list`,
    params,
  );
  return {
    ...response.data,
    pools: (response.data.pools ?? []).map(mapPoolItem),
  };
};

export type PoolsOverviewReq = {
  wallet_address?: string;
};

export type PoolsOverviewRes = {
  data: {
    total_tvl: string;
    total_earned_fees_usd: string;
    your_deposits: string;
    your_earnings: string;
  };
};

export const fetchPoolsOverview = async (req?: PoolsOverviewReq) => {
  const response = await get<PoolsOverviewRes>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/pools/overview`,
    {
      ...req,
      wallet_address: toLowerAddressParam(req?.wallet_address),
    },
  );
  return response.data;
};

export enum APY_PERIOD {
  '7D' = '7D',
  '30D' = '30D',
  '90D' = '90D',
  '180D' = '180D',
  'ALL TIME' = 'ALL TIME',
}
export const normalizeApyPeriod = (period: APY_PERIOD | string) => {
  const normalized = period.toString().toLowerCase();
  return normalized === 'all time' ? 'total' : normalized;
};
export type PoolApyReq = {
  market_address: string;
  period: APY_PERIOD;
};

export type PoolApyRes = {
  data: {
    market_address: string;
    period: APY_PERIOD;
    fee_apy: string;
    fee_apr: string;
    calculated_at: number;
  };
};

export const fetchPoolApyData = async (req: PoolApyReq) => {
  const { market_address, period } = req;
  const poolAddressParam = market_address.toLowerCase();
  const response = await get<PoolApyRes>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/pools/${poolAddressParam}/apy`,
    { period: normalizeApyPeriod(period) },
  );
  return {
    ...response.data,
    market_address: toChecksumAddress(response.data.market_address),
  };
};

export enum CHART_TYPE {
  tvl = 'tvl',
  fee_apr = 'fee_apr',
}
export type PoolChartReq = {
  market_address: string;
  chart_type: CHART_TYPE;
  period: APY_PERIOD;
};
export type PoolChartRes = {
  data: {
    market_address: string;
    chart_type: CHART_TYPE;
    period: APY_PERIOD;
    data_points: Array<{ value: string; timestamp: number }>;
  };
};

export const fetchPoolChartData = async (req: PoolChartReq) => {
  const { market_address, chart_type, period } = req;
  const poolAddressParam = market_address.toLowerCase();
  const response = await get<PoolChartRes>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/pools/${poolAddressParam}/chart`,
    {
      chart_type,
      period: normalizeApyPeriod(period),
    },
  );
  return {
    ...response.data,
    market_address: toChecksumAddress(response.data.market_address),
  };
};

export type HistoryAction =
  | 'all'
  | 'deposit'
  | 'withdraw'
  | 'cancelled_deposit'
  | 'cancelled_withdraw';

export type HistoryReq = {
  market_address: string;
  cursor?: string;
  limit?: number;
  wallet_address?: string;
  action?: HistoryAction;
};

export enum HistoryStatus {
  Success = 'success',
  Cancelled = 'cancelled',
  Pending = 'pending',
}
export type HistoryItemDetail = {
  key: string;
  executed_tx_hash: string;
  status: string;
  symbol: string;
  lp_shares: string;
  delta_usd: string;
  lp_price: string;
  timestamp: number;
};

export type HistoryItem = {
  action: LiqTradeType;
  status: HistoryStatus | '';
  tx_hash: string;
  executed_tx_hash?: string;
  wallet_address: string;
  market_address?: string;
  symbol?: string;
  vault_name?: string;
  lp_shares: string;
  delta_usd: string;
  fees_earned_usd: string;
  timestamp: number;
  details?: HistoryItemDetail[];
  sub_entries?: HistoryItemDetail[];
};

export type HistoryRes = {
  market_address: string;
  next_cursor: string;
  has_more: boolean;
  actions: Array<HistoryItem>;
};

export type HistoryApiResponse = Omit<HistoryRes, 'actions'> & {
  actions: HistoryRes['actions'] | null;
};

export type HistoryApiEnvelope = {
  code?: number;
  error?: string;
  message?: string;
  msg?: string;
  data?: HistoryApiResponse;
};

const mapHistoryItem = <T extends HistoryItem>(item: T): T => ({
  ...item,
  wallet_address: toChecksumAddress(item.wallet_address),
  market_address: item.market_address
    ? toChecksumAddress(item.market_address)
    : undefined,
});

export const parseHistoryApiResponse = (
  response: HistoryApiEnvelope,
): HistoryRes => {
  const errorMessage =
    response.error ||
    (response.code !== undefined && response.code !== SUCCESS_CODE
      ? response.msg || response.message || 'Failed to fetch liquidity history'
      : undefined);
  if (errorMessage || !response.data) {
    throw new Error(errorMessage || 'Missing liquidity history data');
  }

  return {
    ...response.data,
    market_address: toChecksumAddress(response.data.market_address),
    actions: (response.data.actions ?? []).map(mapHistoryItem),
  };
};

export function getHistoryNextPageParam(lastPage?: HistoryRes) {
  if (!lastPage?.has_more || !lastPage.next_cursor) {
    return undefined;
  }
  if (lastPage.actions.length === 0) {
    return undefined;
  }
  return lastPage.next_cursor;
}

export const fetchPoolHistoryData = async (req: HistoryReq) => {
  const { market_address, cursor, limit, wallet_address, action } = req;
  const poolAddressParam = market_address.toLowerCase();
  const response = await get<HistoryApiEnvelope>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/pools/${poolAddressParam}/history`,
    {
      cursor,
      limit,
      wallet_address: toLowerAddressParam(wallet_address),
      action,
    },
  );
  return parseHistoryApiResponse(response);
};

export type PoolDetailReq = {
  market_address: string;
  wallet_address?: string;
};
type PoolDetailItem = Omit<PoolItem, 'fee_apr_history'> & {
  fee_apy_7d_ago: string;
  last_update_time_ms: number;
  total_earned_fees_usd: string;
  open_interest_long_usd?: string;
  open_interest_short_usd?: string;
  utilization?: string;
  reserve_factor?: string;
  traders_open_pnl_usd?: string;
};

export type PoolDetail = {
  code?: number;
  message?: string;
  msg?: string;
  data?: {
    pool?: PoolDetailItem;
  };
};
export const fetchPoolDetailData = async (req: PoolDetailReq) => {
  const { market_address, wallet_address } = req;
  const poolAddressParam = market_address.toLowerCase();
  const response = await get<PoolDetail>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/pools/${poolAddressParam}`,
    {
      wallet_address: toLowerAddressParam(wallet_address),
    },
  );
  const errorMessage =
    response.code !== undefined && response.code !== SUCCESS_CODE
      ? response.msg || response.message || 'Failed to fetch pool detail'
      : undefined;
  const pool = response.data?.pool;

  if (errorMessage || !pool) {
    throw new Error(errorMessage || 'Pool not found');
  }

  return {
    ...(response.data ?? {}),
    pool: mapPoolItem(pool),
  };
};
