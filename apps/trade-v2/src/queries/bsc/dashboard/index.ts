import { useQuery } from '@repo/lib/queryClient';
import { CONFIG_UPDATE_INTERVAL } from '@/common/constants/timeConstants';
import type {
  DashboardCardState,
  DashboardChartFilterState,
  DashboardChartId,
  DashboardOption,
} from '@/containers/dashboard/DashboardChartArea/dashboardChart.types';
import {
  fetchDashboardCards,
  fetchDashboardFees,
  fetchDashboardFundingRate,
  fetchDashboardLiquidations,
  fetchDashboardLossRebate,
  fetchDashboardLpPrice,
  fetchDashboardOpenInterest,
  fetchDashboardRealizedPnl,
  fetchDashboardTopUsers,
  fetchDashboardTradingVolume,
  fetchDashboardTvl,
  fetchDashboardUsers,
  fetchDashboardVolume,
  type DashboardCardsData,
  type DashboardTopUsersSortBy,
  type DashboardViewBy,
} from '@/services/rest/dashboard';

const DASHBOARD_QUERY_SCOPE = ['bsc-data-query', 'dashboard'] as const;
const DEFAULT_TOP_USERS_LIMIT = 100;
const DASHBOARD_CARDS_REFETCH_INTERVAL = 60 * 1000;

export type DashboardChartQueryData = Awaited<
  ReturnType<typeof fetchDashboardChartData>
>;

export function getDashboardStateKey(state: DashboardCardState) {
  if ('sortBy' in state) {
    return `sort:${state.sortBy}`;
  }

  return [
    `mode:${state.modeId}`,
    `selected:${state.selected.slice().sort().join(',')}`,
    `period:${state.period}`,
  ].join('|');
}

function getDashboardQueryStateKey(
  chartId: DashboardChartId,
  state: DashboardCardState,
) {
  if ('sortBy' in state) {
    return `sort:${state.sortBy}`;
  }

  const selectedAffectsRequest =
    state.modeId !== 'all' &&
    [
      'openInterest',
      'totalTradingVolume',
      'annualFundingRate',
      'realizedPnl',
      'lossRebate',
      'liquidations',
      'hzlpPrice',
    ].includes(chartId);

  return [
    `mode:${state.modeId}`,
    selectedAffectsRequest
      ? `selected:${state.selected.slice().sort().join(',')}`
      : 'selected:local',
    `period:${state.period}`,
  ].join('|');
}

function mapModeIdToViewBy(modeId: string): DashboardViewBy | undefined {
  switch (modeId) {
    case 'all':
      return 'all';
    case 'assetTypes':
      return 'asset_type';
    case 'pairs':
      return 'pair';
    default:
      return undefined;
  }
}

function mapSortByToApi(sortBy: string): DashboardTopUsersSortBy {
  return sortBy === 'netPnlPercent' ? 'net_pnl_pct' : 'trading_volume';
}

function encodeSelected(selected: string[]) {
  if (!selected.length) return undefined;
  return selected.join(',');
}

function buildBreakdownParams(state: DashboardChartFilterState) {
  const view_by = mapModeIdToViewBy(state.modeId);
  const selected =
    state.modeId === 'all' ? undefined : encodeSelected(state.selected);

  return {
    period: state.period,
    view_by,
    selected,
  };
}

function buildSelectedParams(state: DashboardChartFilterState) {
  return {
    period: state.period,
    selected: encodeSelected(state.selected),
  };
}

export async function fetchDashboardChartData(
  chartId: DashboardChartId,
  state: DashboardCardState,
) {
  if ('sortBy' in state) {
    return fetchDashboardTopUsers({
      period: 'month',
      sort_by: mapSortByToApi(state.sortBy),
      limit: DEFAULT_TOP_USERS_LIMIT,
    });
  }

  switch (chartId) {
    case 'volume':
      return fetchDashboardVolume({ period: state.period });
    case 'openInterest':
      return fetchDashboardOpenInterest(buildBreakdownParams(state));
    case 'totalTradingVolume':
      return fetchDashboardTradingVolume(buildBreakdownParams(state));
    case 'annualFundingRate':
      return fetchDashboardFundingRate(buildSelectedParams(state));
    case 'realizedPnl':
      return fetchDashboardRealizedPnl({
        ...buildBreakdownParams(state),
        selected:
          state.modeId === 'all'
            ? undefined
            : encodeSelected(state.selected.slice(0, 1)),
      });
    case 'lossRebate':
      return fetchDashboardLossRebate(buildBreakdownParams(state));
    case 'liquidations':
      return fetchDashboardLiquidations(buildBreakdownParams(state));
    case 'fees':
      return fetchDashboardFees({ period: state.period });
    case 'totalValueLocked':
      return fetchDashboardTvl({ period: state.period });
    case 'hzlpPrice':
      return fetchDashboardLpPrice(buildSelectedParams(state));
    case 'users':
      return fetchDashboardUsers({ period: state.period });
    case 'topUsers':
      return fetchDashboardTopUsers({
        period: 'month',
        sort_by: 'trading_volume',
        limit: DEFAULT_TOP_USERS_LIMIT,
      });
    default: {
      const _exhaustive: never = chartId;
      throw new Error(`Unknown dashboard chart: ${_exhaustive}`);
    }
  }
}

function isDashboardInputEmpty(
  value: string | number | null | undefined,
): boolean {
  return value === null || value === undefined || value === '';
}

function parseDashboardFiniteNumber(
  value: string | number | null | undefined,
): number | undefined {
  if (isDashboardInputEmpty(value)) return undefined;
  const normalized = typeof value === 'string' ? value.trim() : value;
  if (normalized === '') return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Parses a human-readable dashboard USD decimal string into a number.
 */
export function normalizeDashboardUsdNumber(
  value: string | number | null | undefined,
): number | undefined {
  return parseDashboardFiniteNumber(value);
}

/** Validates and returns the original human-readable dashboard USD decimal string. */
export function normalizeDashboardUsdString(
  value: string | number | null | undefined,
): string | undefined {
  if (isDashboardInputEmpty(value)) return undefined;
  const raw = typeof value === 'string' ? value.trim() : String(value);
  if (raw === '') return undefined;
  return Number.isFinite(Number(raw)) ? raw : undefined;
}

export function normalizeDashboardNumber(
  value: string | number | null | undefined,
): number | undefined {
  return parseDashboardFiniteNumber(value);
}

/** Percent change strings from dashboard cards: must parse to a finite number. */
export function normalizeDashboardPercentString(
  value: string | number | null | undefined,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? s : undefined;
}

export function useDashboardChartQuery(
  chartId: DashboardChartId,
  state: DashboardCardState,
  enabled = true,
  initialData?: DashboardChartQueryData,
) {
  return useQuery({
    queryKey: [
      ...DASHBOARD_QUERY_SCOPE,
      chartId,
      getDashboardQueryStateKey(chartId, state),
    ],
    queryFn: () => fetchDashboardChartData(chartId, state),
    enabled,
    initialData,
    placeholderData: (previousData) => previousData,
    staleTime: CONFIG_UPDATE_INTERVAL,
    gcTime: CONFIG_UPDATE_INTERVAL,
    refetchOnWindowFocus: false,
  });
}

export function useDashboardCardsQuery(initialData?: DashboardCardsData) {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_SCOPE, 'cards'],
    queryFn: fetchDashboardCards,
    initialData,
    staleTime: DASHBOARD_CARDS_REFETCH_INTERVAL,
    gcTime: DASHBOARD_CARDS_REFETCH_INTERVAL,
    refetchInterval: DASHBOARD_CARDS_REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
  });
}

export function getDefaultPairSelectedValues(options: DashboardOption[]) {
  return [
    'BONK/USD',
    'BTC/USD',
    'DOGE/USD',
    'ETH/USD',
    'FARTCOIN/USD',
    'HYPE/USD',
    'PEPE/USD',
    'SHIB/USD',
    'SOL/USD',
    'USD/JPY',
    'WIF/USD',
    'XRP/USD',
  ].filter((value) => options.some((option) => option.value === value));
}
