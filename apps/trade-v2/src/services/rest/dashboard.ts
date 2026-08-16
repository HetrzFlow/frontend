import { get } from '@repo/lib/rest';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { normalizeAddressRecordKeys, toChecksumAddress } from '@/lib/address';
type DashboardPeriod = 'day' | 'week' | 'month' | 'all';

export type DashboardViewBy = 'all' | 'asset_type' | 'pair';

export type DashboardTopUsersSortBy = 'trading_volume' | 'net_pnl_pct';

/**
 * Runtime responses may differ from doc examples (e.g. `code: 200`, `msg` instead of `message`).
 * Callers only use `data`; other fields are optional for typing.
 */
type DashboardApiResponse<T> = {
  code: number;
  data: T;
  message?: string;
  msg?: string;
};

type DashboardPeriodReq = {
  period?: DashboardPeriod;
};

type DashboardBreakdownReq = DashboardPeriodReq & {
  view_by?: DashboardViewBy;
  selected?: string;
};

type DashboardSelectedReq = DashboardPeriodReq & {
  selected?: string;
};

type DashboardTopUsersReq = DashboardPeriodReq & {
  sort_by?: DashboardTopUsersSortBy;
  limit?: number;
};

export type DashboardCheckpoint = {
  last_agg_ts: number;
  data_cutoff_ts: number;
  block_number: number;
  block_timestamp: number;
};

export type DashboardCardsData = {
  total_volume: string;
  total_volume_change_24h: string;
  total_volume_change_pct_24h: string;
  total_volume_change_14d: string;
  total_volume_sparkline_14d: string[];
  open_interest: string;
  open_interest_change_24h: string;
  open_interest_change_pct_24h: string;
  open_interest_change_14d: string;
  open_interest_sparkline_14d: string[];
  total_users: number;
  total_users_change_24h: number;
  total_users_change_pct_24h: string;
  total_users_change_14d: number;
  total_users_sparkline_14d: number[];
  total_value_locked: string;
  total_value_locked_change_24h: string;
  total_value_locked_change_pct_24h: string;
  total_value_locked_change_14d: string | null;
  total_value_locked_sparkline_14d: string[] | null;
  total_fees: string;
  total_fees_change_24h: string;
  total_fees_change_pct_24h: string;
  total_fees_change_14d: string;
  total_fees_sparkline_14d: string[];
  checkpoint: DashboardCheckpoint | null;
};

type DashboardVolumeItem = {
  timestamp: number;
  perps_trading_volume: string;
  lp_providing_volume: string;
  lp_removing_volume: string;
  daily_total: string;
  cumulative: string;
};

export type DashboardVolumeData = {
  items: DashboardVolumeItem[];
};

type DashboardOpenInterestItem = {
  timestamp: number;
  long_oi?: string;
  short_oi?: string;
  daily_total: string;
  breakdown?: Record<string, string>;
  others?: string;
};

export type DashboardOpenInterestData = {
  items: DashboardOpenInterestItem[];
};

type DashboardBreakdownItem = {
  timestamp: number;
  daily_total: string;
  cumulative: string;
  breakdown?: Record<string, string>;
  others?: string;
};

export type DashboardBreakdownData = {
  items: DashboardBreakdownItem[];
};

/** `GET /dashboard/liquidations` — uses `daily_liquidation_size`, not `daily_total`. */
type DashboardLiquidationsItem = {
  timestamp: number;
  daily_liquidation_size: string;
  cumulative: string;
  breakdown?: Record<string, string>;
  others?: string;
};

export type DashboardLiquidationsData = {
  items: DashboardLiquidationsItem[];
};

type DashboardFundingRateItem = {
  timestamp: number;
  rates: Record<string, string>;
};

export type DashboardFundingRateData = {
  items: DashboardFundingRateItem[];
};

type DashboardRealizedPnlItem = {
  timestamp: number;
  net_profit: string;
  net_loss: string;
  cumulative_pnl: string;
};

export type DashboardRealizedPnlData = {
  items: DashboardRealizedPnlItem[];
};

type DashboardFeesItem = {
  timestamp: number;
  trading_fee: string;
  borrow_fee: string;
  liquidation_fee: string;
  profit_sharing: string;
  keeper_fee: string;
  daily_total: string;
  cumulative: string;
};

export type DashboardFeesData = {
  items: DashboardFeesItem[];
};

type DashboardTvlItem = {
  timestamp: number;
  tvl: string;
};

export type DashboardTvlData = {
  items: DashboardTvlItem[];
};

type DashboardLpPriceItem = {
  timestamp: number;
  prices: Record<string, string>;
};

export type DashboardLpPriceData = {
  items: DashboardLpPriceItem[];
};

type DashboardUsersItem = {
  timestamp: number;
  daily_total?: number;
  new_users: number;
  recurring_users: number;
  cumulative_users: number;
};

export type DashboardUsersData = {
  items: DashboardUsersItem[];
};

type DashboardTopUsersItem = {
  rank: number;
  address: string;
  trading_volume: string;
  net_pnl_pct: string;
};

export type DashboardTopUsersData = {
  items: DashboardTopUsersItem[];
};

type NullableItems<T extends { items: unknown[] }> = Omit<T, 'items'> & {
  items: T['items'] | null;
};

function normalizeBreakdownItems<
  T extends { breakdown?: Record<string, string> },
>(data: { items: T[] | null }) {
  return {
    ...data,
    items: (data.items ?? []).map((item) => ({
      ...item,
      breakdown: normalizeAddressRecordKeys(item.breakdown),
    })),
  };
}

function normalizeFundingRateData(
  data: NullableItems<DashboardFundingRateData>,
): DashboardFundingRateData {
  return {
    ...data,
    items: (data.items ?? []).map((item) => ({
      ...item,
      rates: normalizeAddressRecordKeys(item.rates) ?? {},
    })),
  };
}

function normalizeLpPriceData(
  data: NullableItems<DashboardLpPriceData>,
): DashboardLpPriceData {
  return {
    ...data,
    items: (data.items ?? []).map((item) => ({
      ...item,
      prices: normalizeAddressRecordKeys(item.prices) ?? {},
    })),
  };
}

function normalizeTopUsersData(
  data: NullableItems<DashboardTopUsersData>,
): DashboardTopUsersData {
  return {
    ...data,
    items: (data.items ?? []).map((item) => ({
      ...item,
      address: toChecksumAddress(item.address),
    })),
  };
}

async function fetchDashboardData<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
) {
  const response = await get<DashboardApiResponse<T>>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc${path}`,
    params,
  );
  return response.data;
}

export const fetchDashboardCards = async () => {
  return fetchDashboardData<DashboardCardsData>('/dashboard/cards');
};

export const fetchDashboardVolume = async (req: DashboardPeriodReq) => {
  return fetchDashboardData<DashboardVolumeData>('/dashboard/volume', req);
};

export const fetchDashboardOpenInterest = async (
  req: DashboardBreakdownReq,
) => {
  const data = await fetchDashboardData<
    NullableItems<DashboardOpenInterestData>
  >(
    '/dashboard/open-interest',
    req,
  );
  return normalizeBreakdownItems(data);
};

export const fetchDashboardTradingVolume = async (
  req: DashboardBreakdownReq,
) => {
  const data = await fetchDashboardData<NullableItems<DashboardBreakdownData>>(
    '/dashboard/trading-volume',
    req,
  );
  return normalizeBreakdownItems(data);
};

export const fetchDashboardFundingRate = async (req: DashboardSelectedReq) => {
  const data = await fetchDashboardData<
    NullableItems<DashboardFundingRateData>
  >(
    '/dashboard/funding-rate',
    req,
  );
  return normalizeFundingRateData(data);
};

export const fetchDashboardRealizedPnl = async (req: DashboardBreakdownReq) => {
  return fetchDashboardData<DashboardRealizedPnlData>(
    '/dashboard/realized-pnl',
    req,
  );
};

export const fetchDashboardLossRebate = async (req: DashboardBreakdownReq) => {
  const data = await fetchDashboardData<NullableItems<DashboardBreakdownData>>(
    '/dashboard/loss-rebate',
    req,
  );
  return normalizeBreakdownItems(data);
};

export const fetchDashboardLiquidations = async (
  req: DashboardBreakdownReq,
) => {
  const data = await fetchDashboardData<
    NullableItems<DashboardLiquidationsData>
  >(
    '/dashboard/liquidations',
    req,
  );
  return normalizeBreakdownItems(data);
};

export const fetchDashboardFees = async (req: DashboardPeriodReq) => {
  return fetchDashboardData<DashboardFeesData>('/dashboard/fees', req);
};

export const fetchDashboardTvl = async (req: DashboardPeriodReq) => {
  return fetchDashboardData<DashboardTvlData>('/dashboard/tvl', req);
};

export const fetchDashboardLpPrice = async (req: DashboardSelectedReq) => {
  const data = await fetchDashboardData<NullableItems<DashboardLpPriceData>>(
    '/dashboard/lp-price',
    req,
  );
  return normalizeLpPriceData(data);
};

export const fetchDashboardUsers = async (req: DashboardPeriodReq) => {
  return fetchDashboardData<DashboardUsersData>('/dashboard/users', req);
};

export const fetchDashboardTopUsers = async (req: DashboardTopUsersReq) => {
  const data = await fetchDashboardData<NullableItems<DashboardTopUsersData>>(
    '/dashboard/top-users',
    req,
  );
  return normalizeTopUsersData(data);
};
