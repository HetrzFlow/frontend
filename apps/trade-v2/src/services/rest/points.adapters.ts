export type BackendSeasonResponse = {
  season_id: number;
  season_name: string;
  status: 'active' | 'upcoming' | 'ended';
  start_at: number;
  end_at: number;
  pool_total: string;
  trading_pct: string;
  liquidity_pct: string;
  referral_pct: string;
};

export type BackendXpStatsResponse = {
  season_id: number;
  total_points: string;
  trading_points: string;
  lp_points: string;
  referral_points: string;
  estimated_trading_points: string;
  estimated_lp_points: string;
  is_estimated: boolean;
  last_settled_date: string;
  total_fees_generated_usd: string;
};

export type FrontendSeasonSummary = {
  seasonId: string;
  seasonName: string;
  status: 'active' | 'upcoming' | 'ended';
  startAt: string;
  endAt: string;
  poolTotal?: string;
  tradingPct?: number;
  liquidityPct?: number;
  referralPct?: number;
};

export type FrontendXpStats = {
  total: string;
  trading: string;
  liquidity: string;
  referral: string;
  estimatedTrading: string;
  estimatedLiquidity: string;
  isEstimated: boolean;
  lastSettledDate: string;
  totalFeesGeneratedUsd: string;
};

export const normalizePct = (value: string) => {
  const numeric = Number(value);
  return numeric <= 1 ? numeric * 100 : numeric;
};

export const mapSeasonItem = (
  item: BackendSeasonResponse,
): FrontendSeasonSummary => ({
  seasonId: String(item.season_id),
  seasonName: item.season_name,
  status: item.status,
  startAt: new Date(item.start_at).toISOString(),
  endAt: new Date(item.end_at).toISOString(),
  poolTotal: item.pool_total,
  tradingPct: normalizePct(item.trading_pct),
  liquidityPct: normalizePct(item.liquidity_pct),
  referralPct: normalizePct(item.referral_pct),
});

export const mapXpStats = (item: BackendXpStatsResponse): FrontendXpStats => ({
  total: item.total_points,
  trading: item.trading_points,
  liquidity: item.lp_points,
  referral: item.referral_points,
  estimatedTrading: item.estimated_trading_points,
  estimatedLiquidity: item.estimated_lp_points,
  isEstimated: item.is_estimated,
  lastSettledDate: item.last_settled_date,
  totalFeesGeneratedUsd: item.total_fees_generated_usd,
});
