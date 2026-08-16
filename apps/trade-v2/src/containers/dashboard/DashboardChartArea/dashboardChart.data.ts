import { useMemo } from 'react';
import { msg } from '@lingui/core/macro';
import { dateFormat } from '@repo/lib/format';
import { getCategoryLabelMessage } from '@/lib/market/categoryLabels';
import {
  getDefaultPairSelectedValues,
  getDashboardStateKey,
  normalizeDashboardNumber,
  normalizeDashboardUsdNumber,
  type DashboardChartQueryData,
  useDashboardChartQuery,
} from '@/queries/bsc/dashboard';
import type {
  DashboardBreakdownData,
  DashboardFeesData,
  DashboardFundingRateData,
  DashboardLiquidationsData,
  DashboardLpPriceData,
  DashboardOpenInterestData,
  DashboardRealizedPnlData,
  DashboardTopUsersData,
  DashboardTvlData,
  DashboardUsersData,
  DashboardVolumeData,
} from '@/services/rest/dashboard';
import { CATEGORY } from '@/services/rest/pools';
import type {
  DashboardAreaChartModel,
  DashboardBaseDatum,
  DashboardCardState,
  DashboardChartDefinition,
  DashboardChartFilterState,
  DashboardChartPeriod,
  DashboardComposedChartModel,
  DashboardFilterModeDefinition,
  DashboardMultiLineChartModel,
  DashboardOption,
  DashboardPresenterModel,
  DashboardSeriesDefinition,
  DashboardTableFilterState,
  DashboardTableModel,
  DashboardTopUsersRow,
} from './dashboardChart.types';

const SERIES_PALETTE = [
  '#1C5561',
  '#0F6C83',
  '#008383',
  '#63BCBC',
  '#9BCFE5',
] as const;
const OTHERS_COLOR = '#A0ADB3';
const OTHERS_KEY = 'others';
const CUMULATIVE_COLOR = '#FF8000';
const LONG_COLOR = 'var(--color-dashboard-blue)';
const SHORT_COLOR = 'var(--color-dashboard-red)';
const TVL_COLOR = SERIES_PALETTE[0];

type BreakdownSourceKey = 'byAssetType' | 'byPair';

interface VolumeRow {
  timestamp: number;
  perpsTrading: number;
  liquidityProviding: number;
  liquidityRemoving: number;
  dailyTotal: number;
  cumulative: number;
}

interface OpenInterestRow {
  timestamp: number;
  /** Present when `modeId === 'all'`; omitted in breakdown modes. */
  longOi?: number;
  shortOi?: number;
  dailyTotal: number;
  byAssetType: Record<string, number>;
  byPair: Record<string, number>;
  others?: number;
}

interface BreakdownRow {
  timestamp: number;
  dailyTotal: number;
  cumulative: number;
  byAssetType: Record<string, number>;
  byPair: Record<string, number>;
  others?: number;
}

interface MultiSeriesRow {
  timestamp: number;
  values: Record<string, number>;
}

interface RealizedPnlRow {
  timestamp: number;
  netProfit: number;
  netLoss: number;
  cumulative: number;
}

interface FeesRow {
  timestamp: number;
  trading: number;
  borrow: number;
  liquidation: number;
  profitSharing: number;
  keeper: number;
  dailyTotal: number;
  cumulative: number;
}

interface TvlRow {
  timestamp: number;
  tvl: number;
}

interface UsersRow {
  timestamp: number;
  recurringUsers: number;
  newUsers: number;
  dailyTotal: number;
  cumulative: number;
}

interface TopUsersPayload {
  rows: DashboardTopUsersRow[];
}

export const DASHBOARD_PERIOD_OPTIONS: DashboardOption[] = [
  { value: 'day', label: 'D' },
  { value: 'week', label: 'W' },
  { value: 'month', label: 'M' },
  { value: 'all', label: 'ALL' },
];

const ACTION_TYPE_OPTIONS: DashboardOption[] = [
  { value: 'perpsTrading', label: msg`Perps Trading` },
  { value: 'liquidityProviding', label: msg`Liquidity Providing` },
  { value: 'liquidityRemoving', label: msg`Liquidity Removing` },
  { value: 'cumulative', label: msg`Cumulative` },
];

const ASSET_TYPE_OPTIONS: DashboardOption[] = [
  { value: 'crypto', label: getCategoryLabelMessage(CATEGORY.crypto) },
  { value: 'forex', label: getCategoryLabelMessage(CATEGORY.forex) },
  { value: 'equities', label: getCategoryLabelMessage(CATEGORY.equities) },
  { value: 'indices', label: getCategoryLabelMessage(CATEGORY.indices) },
  {
    value: 'commodities',
    label: getCategoryLabelMessage(CATEGORY.commodities),
  },
  { value: 'meme', label: getCategoryLabelMessage(CATEGORY.memes) },
  // TODO: temporarily hide "Newly Listed"
  // { value: 'newest', label: msg`Newly Listed` },
];

const DEFAULT_ASSET_TYPE_SELECTION = ASSET_TYPE_OPTIONS.map(
  (option) => option.value,
);

const PAIR_OPTIONS: DashboardOption[] = [
  { value: 'BTC/USD', label: 'BTC/USD' },
  { value: 'ETH/USD', label: 'ETH/USD' },
  { value: 'SOL/USD', label: 'SOL/USD' },
  { value: 'DOGE/USD', label: 'DOGE/USD' },
  { value: 'XRP/USD', label: 'XRP/USD' },
  { value: 'WIF/USD', label: 'WIF/USD' },
  { value: 'SHIB/USD', label: 'SHIB/USD' },
  { value: 'PEPE/USD', label: 'PEPE/USD' },
  { value: 'BONK/USD', label: 'BONK/USD' },
  { value: 'FARTCOIN/USD', label: 'FARTCOIN/USD' },
  { value: 'HYPE/USD', label: 'HYPE/USD' },
  { value: 'USD/JPY', label: 'USD/JPY' },
];

const FEE_TYPE_OPTIONS: DashboardOption[] = [
  { value: 'trading', label: msg`Trading Fee` },
  { value: 'borrow', label: msg`Borrow Fee` },
  { value: 'liquidation', label: msg`Liquidation Fee` },
  { value: 'profitSharing', label: msg`Profit Sharing` },
  { value: 'keeper', label: msg`Keeper Fee` },
  { value: 'cumulative', label: msg`Cumulative` },
];

const OPEN_INTEREST_ALL_OPTIONS: DashboardOption[] = [
  { value: 'longOi', label: msg`Long OI` },
  { value: 'shortOi', label: msg`Short OI` },
  { value: 'dailyTotal', label: msg`Daily Total` },
];

const TOTAL_AND_CUMULATIVE_OPTIONS: DashboardOption[] = [
  { value: 'dailyTotal', label: msg`Daily Total` },
  { value: 'cumulative', label: msg`Cumulative` },
];

const REALIZED_PNL_OPTIONS: DashboardOption[] = [
  { value: 'netProfit', label: msg`Net Profit` },
  { value: 'netLoss', label: msg`Net Loss` },
  { value: 'cumulative', label: msg`Cumulative` },
];

const USERS_OPTIONS: DashboardOption[] = [
  { value: 'recurringUsers', label: msg`Recurring Users` },
  { value: 'newUsers', label: msg`New Users` },
  { value: 'cumulative', label: msg`Cumulative Users` },
];

const TOP_USERS_SORT_OPTIONS: DashboardOption[] = [
  { value: 'tradingVolume', label: msg`Trading Volume` },
  { value: 'netPnlPercent', label: msg`Net PnL%` },
];

function round(value: number) {
  return Number(value.toFixed(6));
}

function toChartTimestamp(timestamp: number) {
  return timestamp * 1000;
}

function mapUsdBreakdown(
  values: Record<string, string> | undefined,
): Record<string, number> | null {
  if (!values) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    const n = normalizeDashboardUsdNumber(value);
    if (n === undefined) return null;
    result[key] = n;
  }
  return result;
}

function getDynamicOptionsFromRows(rows: MultiSeriesRow[]) {
  const seen = new Set<string>();

  for (const row of rows) {
    for (const value of Object.keys(row.values)) {
      seen.add(value);
    }
  }

  return Array.from(seen)
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({
      value,
      label: value,
    }));
}

function getDynamicBreakdownOptions<
  T extends Record<BreakdownSourceKey, Record<string, number>>,
>(rows: T[], sourceKey: BreakdownSourceKey) {
  const seen = new Set<string>();

  for (const row of rows) {
    for (const value of Object.keys(row[sourceKey])) {
      seen.add(value);
    }
  }

  return Array.from(seen)
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({
      value,
      label: value,
    }));
}

function mergeDynamicOptions(
  options: DashboardOption[],
  values: string[],
): DashboardOption[] {
  const seen = new Set(options.map((option) => option.value));
  const missingOptions = values.flatMap((value) => {
    if (value === OTHERS_KEY || seen.has(value)) return [];
    seen.add(value);
    return [{ value, label: value }];
  });

  return [...options, ...missingOptions];
}

function mergeOptions(
  primaryOptions: DashboardOption[],
  fallbackOptions: DashboardOption[],
): DashboardOption[] {
  const seen = new Set(primaryOptions.map((option) => option.value));
  return [
    ...primaryOptions,
    ...fallbackOptions.filter((option) => !seen.has(option.value)),
  ];
}

function buildChartRows<T extends { timestamp: number }>(rows: T[]) {
  return rows.map(
    (row) =>
      ({
        ...(row as Record<string, string | number | undefined>),
        label: dateFormat(row.timestamp, 'yyyy-MM-dd'),
      }) as DashboardBaseDatum,
  );
}

function selectRowsByPeriod<T extends { timestamp: number }>(
  rows: T[],
  period: DashboardChartPeriod,
) {
  if (period === 'all') return rows;
  if (period === 'month') return rows.slice(-30);
  if (period === 'week') return rows.slice(-7);
  return rows.slice(-24);
}

function getXAxisFormatForPeriod(period: DashboardChartPeriod) {
  return period === 'day' ? ('hour' as const) : ('adaptiveDate' as const);
}

function sortSelectedOptions(options: DashboardOption[], selected: string[]) {
  const selectedSet = new Set(selected);
  return options.filter((option) => selectedSet.has(option.value));
}

function sortOptionsByOrder(options: DashboardOption[], order: string[]) {
  const orderIndex = new Map(order.map((value, index) => [value, index]));
  return [...options].sort((left, right) => {
    const leftIndex = orderIndex.get(left.value) ?? Number.POSITIVE_INFINITY;
    const rightIndex = orderIndex.get(right.value) ?? Number.POSITIVE_INFINITY;
    return leftIndex - rightIndex;
  });
}

function isZeroBreakdownPoint({
  dailyTotal,
  others,
}: {
  dailyTotal: number;
  others?: number;
}) {
  return dailyTotal === 0 && (others === undefined || others === 0);
}

function isDailyTotalCoveredByOthers(dailyTotal: number, others: number) {
  return Math.abs(dailyTotal - others) <= 0.000001;
}

function resolveBreakdownValues(
  values: Record<string, string> | undefined,
  {
    dailyTotal,
    others,
  }: {
    dailyTotal: number;
    others?: number;
  },
) {
  if (values !== undefined) {
    return mapUsdBreakdown(values);
  }

  if (others !== undefined && isDailyTotalCoveredByOthers(dailyTotal, others)) {
    return {};
  }

  return isZeroBreakdownPoint({ dailyTotal, others }) ? {} : null;
}

function buildGroupedBarSeriesRows<
  T extends {
    timestamp: number;
    others?: number;
  } & Record<BreakdownSourceKey, Record<string, number>>,
>(
  rows: T[],
  sourceKey: BreakdownSourceKey,
  options: DashboardOption[],
  selected: string[],
  visible: string[],
  yAxisId: 'left' | 'right',
  orderRows = rows,
) {
  void orderRows;
  const orderedOptions = options;
  const orderedSelected = sortSelectedOptions(orderedOptions, selected);
  const selectedSet = new Set(orderedSelected.map((option) => option.value));
  const visibleSet = new Set(visible);

  const data = rows.map((row) => {
    const point: DashboardBaseDatum = {
      timestamp: row.timestamp,
      label: dateFormat(row.timestamp, 'yyyy-MM-dd'),
    };

    orderedSelected.forEach((option) => {
      point[option.value] = row[sourceKey][option.value] ?? 0;
    });

    const others =
      row.others ??
      options.reduce((sum, option) => {
        if (selectedSet.has(option.value)) return sum;
        return sum + (row[sourceKey][option.value] ?? 0);
      }, 0);

    if (others > 0) {
      point.others = round(others);
    }

    return point;
  });

  const series: DashboardSeriesDefinition[] = orderedOptions.flatMap(
    (option, index) =>
      selectedSet.has(option.value)
        ? [
            {
              key: option.value,
              label: option.label,
              color: SERIES_PALETTE[index % SERIES_PALETTE.length]!,
              type: 'bar' as const,
              stackId: 'grouped',
              yAxisId,
              valueFormat: 'currencyCompact' as const,
              hide: !visibleSet.has(option.value),
              showInTooltip: visibleSet.has(option.value),
            },
          ]
        : [],
  );

  if (data.some((row) => Number(row.others ?? 0) > 0)) {
    series.push({
      key: 'others',
      label: msg`Others`,
      color: OTHERS_COLOR,
      type: 'bar',
      stackId: 'grouped',
      yAxisId,
      valueFormat: 'currencyCompact',
      hide: !visibleSet.has(OTHERS_KEY),
      showInTooltip: visibleSet.has(OTHERS_KEY),
    });
  }

  return { data, series };
}

function buildLineSeriesRows(
  rows: MultiSeriesRow[],
  options: DashboardOption[],
  selected: string[],
  valueFormat: DashboardSeriesDefinition['valueFormat'],
): { data: DashboardBaseDatum[]; lines: DashboardSeriesDefinition[] } | null {
  const orderedOptions = sortOptionsByOrder(
    options,
    chipOrderFromMultiSeries(rows),
  );
  const orderedSelected = sortSelectedOptions(orderedOptions, selected);
  if (!orderedSelected.length) {
    return {
      data: rows.map((row) => ({
        timestamp: row.timestamp,
        label: dateFormat(row.timestamp, 'yyyy-MM-dd'),
      })),
      lines: [],
    };
  }

  const data: DashboardBaseDatum[] = [];

  for (const row of rows) {
    const point: DashboardBaseDatum = {
      timestamp: row.timestamp,
      label: dateFormat(row.timestamp, 'yyyy-MM-dd'),
    };

    for (const option of orderedSelected) {
      const v = row.values[option.value];
      if (v !== undefined && Number.isFinite(v)) {
        point[option.value] = v;
      }
    }

    data.push(point);
  }

  const selectedSet = new Set(selected);
  const lines: DashboardSeriesDefinition[] = orderedOptions.flatMap(
    (option, index) =>
      selectedSet.has(option.value)
        ? [
            {
              key: option.value,
              label: option.label,
              color: SERIES_PALETTE[index % SERIES_PALETTE.length]!,
              type: 'line',
              yAxisId: 'left',
              strokeWidth: 2,
              valueFormat,
            },
          ]
        : [],
  );

  return { data, lines };
}

function getChartFilterState(state: DashboardCardState) {
  return state as DashboardChartFilterState;
}

function getLegendSelected(state: DashboardChartFilterState) {
  return state.legendSelected ?? state.selected;
}

function buildOrderFromTotals(values: Array<{ key: string; total: number }>) {
  return [...values]
    .sort((left, right) => right.total - left.total)
    .map((item) => item.key);
}

function chipOrderFromBreakdown(
  rows: Array<{
    timestamp: number;
    byAssetType: Record<string, number>;
    byPair: Record<string, number>;
  }>,
  modeId: string,
) {
  const sourceKey =
    modeId === 'pairs' || modeId === 'byPair' ? 'byPair' : 'byAssetType';
  const totals = new Map<string, number>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row[sourceKey])) {
      totals.set(key, (totals.get(key) ?? 0) + Math.abs(value));
    }
  }
  return buildOrderFromTotals(
    Array.from(totals.entries()).map(([key, total]) => ({ key, total })),
  );
}

function chipOrderFromMultiSeries(rows: MultiSeriesRow[]) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row.values)) {
      totals.set(key, (totals.get(key) ?? 0) + Math.abs(value));
    }
  }
  return buildOrderFromTotals(
    Array.from(totals.entries()).map(([key, total]) => ({ key, total })),
  );
}

export function computeChipOrder(
  chartId: DashboardChartDefinition['id'],
  data: unknown,
  state: DashboardChartFilterState,
): string[] | undefined {
  if (state.modeId === 'all') return undefined;
  if (state.modeId === 'assetTypes' || state.modeId === 'pairs') {
    return undefined;
  }

  switch (chartId) {
    case 'openInterest': {
      const rows = adaptOpenInterestRows(
        data as DashboardOpenInterestData,
        state,
      );
      if (!rows) return undefined;
      return chipOrderFromBreakdown(rows, state.modeId);
    }
    case 'totalTradingVolume':
    case 'lossRebate': {
      const rows = adaptBreakdownRows(data as DashboardBreakdownData, state);
      if (!rows) return undefined;
      return chipOrderFromBreakdown(rows, state.modeId);
    }
    case 'liquidations': {
      const rows = adaptLiquidationsRows(
        data as DashboardLiquidationsData,
        state,
      );
      if (!rows) return undefined;
      return chipOrderFromBreakdown(rows, state.modeId);
    }
    case 'annualFundingRate': {
      const rows = adaptFundingRateRows(data as DashboardFundingRateData);
      if (!rows) return undefined;
      return chipOrderFromMultiSeries(selectRowsByPeriod(rows, state.period));
    }
    case 'hzlpPrice': {
      const rows = adaptLpPriceRows(data as DashboardLpPriceData);
      if (!rows) return undefined;
      return chipOrderFromMultiSeries(selectRowsByPeriod(rows, state.period));
    }
    case 'realizedPnl':
      // Single-select mode chips don't need value-based reordering.
      return undefined;
    default:
      return undefined;
  }
}

function getTableFilterState(state: DashboardCardState) {
  return state as DashboardTableFilterState;
}

function adaptVolumeRows(data: DashboardVolumeData): VolumeRow[] | null {
  if (!data.items?.length) return [];
  const out: VolumeRow[] = [];
  for (const item of data.items) {
    if (!Number.isFinite(item.timestamp)) return null;
    const perpsTrading = normalizeDashboardUsdNumber(item.perps_trading_volume);
    const liquidityProviding = normalizeDashboardUsdNumber(
      item.lp_providing_volume,
    );
    const liquidityRemoving = normalizeDashboardUsdNumber(
      item.lp_removing_volume,
    );
    const dailyTotal = normalizeDashboardUsdNumber(item.daily_total);
    const cumulative = normalizeDashboardUsdNumber(item.cumulative);
    if (
      perpsTrading === undefined ||
      liquidityProviding === undefined ||
      liquidityRemoving === undefined ||
      dailyTotal === undefined ||
      cumulative === undefined
    ) {
      return null;
    }
    out.push({
      timestamp: toChartTimestamp(item.timestamp),
      perpsTrading,
      liquidityProviding,
      liquidityRemoving,
      dailyTotal,
      cumulative,
    });
  }
  return out;
}

function adaptOpenInterestRows(
  data: DashboardOpenInterestData,
  state: DashboardChartFilterState,
): OpenInterestRow[] | null {
  if (!data.items?.length) return [];
  const out: OpenInterestRow[] = [];

  for (const item of data.items) {
    if (!Number.isFinite(item.timestamp)) return null;
    const dailyTotal = normalizeDashboardUsdNumber(item.daily_total);
    if (dailyTotal === undefined) return null;
    const others =
      item.others === undefined
        ? undefined
        : normalizeDashboardUsdNumber(item.others);
    if (item.others !== undefined && others === undefined) return null;

    let byAssetType: Record<string, number> = {};
    let byPair: Record<string, number> = {};

    if (state.modeId === 'assetTypes') {
      const bd = resolveBreakdownValues(item.breakdown, {
        dailyTotal,
        others,
      });
      if (bd === null) return null;
      byAssetType = bd;
    } else if (state.modeId === 'pairs') {
      const bd = resolveBreakdownValues(item.breakdown, {
        dailyTotal,
        others,
      });
      if (bd === null) return null;
      byPair = bd;
    }

    if (state.modeId === 'all') {
      const longOi = normalizeDashboardUsdNumber(item.long_oi);
      const shortOi = normalizeDashboardUsdNumber(item.short_oi);
      if (longOi === undefined || shortOi === undefined) return null;
      out.push({
        timestamp: toChartTimestamp(item.timestamp),
        longOi,
        shortOi,
        dailyTotal,
        byAssetType: {},
        byPair: {},
        others,
      });
    } else {
      out.push({
        timestamp: toChartTimestamp(item.timestamp),
        dailyTotal,
        byAssetType,
        byPair,
        others,
      });
    }
  }

  return out;
}

/** Shared shape for trading-volume / loss-rebate / liquidations breakdown endpoints. */
type DashboardBreakdownLikeItem = {
  timestamp: number;
  cumulative: string;
  breakdown?: Record<string, string>;
  others?: string;
};

function mapBreakdownLikeItemToBreakdownRow(
  item: DashboardBreakdownLikeItem,
  dailyTotal: number | undefined,
  state: DashboardChartFilterState,
): BreakdownRow | null {
  if (!Number.isFinite(item.timestamp)) return null;
  if (dailyTotal === undefined) return null;

  const cumulative = normalizeDashboardUsdNumber(item.cumulative);
  if (cumulative === undefined) return null;

  let byAssetType: Record<string, number> = {};
  let byPair: Record<string, number> = {};
  const normalizedOthers =
    item.others === undefined
      ? undefined
      : normalizeDashboardUsdNumber(item.others);
  if (item.others !== undefined && normalizedOthers === undefined) return null;

  if (state.modeId === 'assetTypes') {
    const bd = resolveBreakdownValues(item.breakdown, {
      dailyTotal,
      others: normalizedOthers,
    });
    if (bd === null) return null;
    byAssetType = bd;
  } else if (state.modeId === 'pairs') {
    const bd = resolveBreakdownValues(item.breakdown, {
      dailyTotal,
      others: normalizedOthers,
    });
    if (bd === null) return null;
    byPair = bd;
  }

  return {
    timestamp: toChartTimestamp(item.timestamp),
    dailyTotal,
    cumulative,
    byAssetType,
    byPair,
    others: normalizedOthers,
  };
}

function adaptBreakdownRows(
  data: DashboardBreakdownData,
  state: DashboardChartFilterState,
): BreakdownRow[] | null {
  if (!data.items?.length) return [];
  const out: BreakdownRow[] = [];

  for (const item of data.items) {
    const dailyTotal = normalizeDashboardUsdNumber(item.daily_total);
    const row = mapBreakdownLikeItemToBreakdownRow(item, dailyTotal, state);
    if (row === null) return null;
    out.push(row);
  }

  return out;
}

function adaptLiquidationsRows(
  data: DashboardLiquidationsData,
  state: DashboardChartFilterState,
): BreakdownRow[] | null {
  if (!data.items?.length) return [];
  const out: BreakdownRow[] = [];

  for (const item of data.items) {
    const dailyTotal = normalizeDashboardUsdNumber(item.daily_liquidation_size);
    const row = mapBreakdownLikeItemToBreakdownRow(item, dailyTotal, state);
    if (row === null) return null;
    out.push(row);
  }

  return out;
}

function adaptFundingRateRows(
  data: DashboardFundingRateData,
): MultiSeriesRow[] | null {
  if (!data.items?.length) return [];
  const out: MultiSeriesRow[] = [];

  for (const item of data.items) {
    if (!Number.isFinite(item.timestamp)) return null;
    const values: Record<string, number> = {};
    for (const [key, value] of Object.entries(item.rates)) {
      const n = normalizeDashboardNumber(value);
      if (n === undefined) return null;
      values[key] = n;
    }
    if (Object.keys(values).length === 0) return null;
    out.push({
      timestamp: toChartTimestamp(item.timestamp),
      values,
    });
  }

  return out;
}

function adaptRealizedPnlRows(
  data: DashboardRealizedPnlData,
): RealizedPnlRow[] | null {
  if (!data.items?.length) return [];
  const out: RealizedPnlRow[] = [];

  for (const item of data.items) {
    if (!Number.isFinite(item.timestamp)) return null;
    const rawNetProfit = normalizeDashboardUsdNumber(item.net_profit);
    const rawNetLoss = normalizeDashboardUsdNumber(item.net_loss);
    const cumulative = normalizeDashboardUsdNumber(item.cumulative_pnl);
    if (
      rawNetProfit === undefined ||
      rawNetLoss === undefined ||
      cumulative === undefined
    ) {
      return null;
    }
    out.push({
      timestamp: toChartTimestamp(item.timestamp),
      netProfit: Math.abs(rawNetProfit),
      netLoss: rawNetLoss === 0 ? 0 : -Math.abs(rawNetLoss),
      cumulative,
    });
  }

  return out;
}

function adaptFeesRows(data: DashboardFeesData): FeesRow[] | null {
  if (!data.items?.length) return [];
  const out: FeesRow[] = [];

  for (const item of data.items) {
    if (!Number.isFinite(item.timestamp)) return null;
    const trading = normalizeDashboardUsdNumber(item.trading_fee);
    const borrow = normalizeDashboardUsdNumber(item.borrow_fee);
    const liquidation = normalizeDashboardUsdNumber(item.liquidation_fee);
    const profitSharing = normalizeDashboardUsdNumber(item.profit_sharing);
    const keeper = normalizeDashboardUsdNumber(item.keeper_fee);
    const dailyTotal = normalizeDashboardUsdNumber(item.daily_total);
    const cumulative = normalizeDashboardUsdNumber(item.cumulative);
    if (
      trading === undefined ||
      borrow === undefined ||
      liquidation === undefined ||
      profitSharing === undefined ||
      keeper === undefined ||
      dailyTotal === undefined ||
      cumulative === undefined
    ) {
      return null;
    }
    out.push({
      timestamp: toChartTimestamp(item.timestamp),
      trading,
      borrow,
      liquidation,
      profitSharing,
      keeper,
      dailyTotal,
      cumulative,
    });
  }

  return out;
}

function adaptTvlRows(data: DashboardTvlData): TvlRow[] | null {
  if (!data.items?.length) return [];
  const out: TvlRow[] = [];

  for (const item of data.items) {
    if (!Number.isFinite(item.timestamp)) return null;
    const tvl = normalizeDashboardUsdNumber(item.tvl);
    if (tvl === undefined) return null;
    out.push({
      timestamp: toChartTimestamp(item.timestamp),
      tvl,
    });
  }

  return out;
}

function adaptUsersRows(data: DashboardUsersData): UsersRow[] | null {
  if (!data.items?.length) return [];
  const out: UsersRow[] = [];

  for (const item of data.items) {
    if (!Number.isFinite(item.timestamp)) return null;
    const recurringUsers = item.recurring_users;
    const newUsers = item.new_users;
    const cumulative = item.cumulative_users;
    const dailyTotal =
      typeof item.daily_total === 'number' && Number.isFinite(item.daily_total)
        ? item.daily_total
        : recurringUsers + newUsers;
    if (
      !Number.isFinite(recurringUsers) ||
      !Number.isFinite(newUsers) ||
      !Number.isFinite(cumulative) ||
      !Number.isFinite(dailyTotal)
    ) {
      return null;
    }
    out.push({
      timestamp: toChartTimestamp(item.timestamp),
      recurringUsers,
      newUsers,
      dailyTotal,
      cumulative,
    });
  }

  return out;
}

function adaptLpPriceRows(data: DashboardLpPriceData): MultiSeriesRow[] | null {
  if (!data.items?.length) return [];
  const out: MultiSeriesRow[] = [];

  for (const item of data.items) {
    if (!Number.isFinite(item.timestamp)) return null;
    const values: Record<string, number> = {};
    for (const [key, value] of Object.entries(item.prices)) {
      const n = normalizeDashboardNumber(value);
      if (n === undefined) return null;
      values[key] = n;
    }
    out.push({
      timestamp: toChartTimestamp(item.timestamp),
      values,
    });
  }

  return out;
}

function adaptTopUsersPayload(
  data: DashboardTopUsersData,
): TopUsersPayload | null {
  if (!data.items?.length) return { rows: [] };
  const rows: DashboardTopUsersRow[] = [];

  for (const item of data.items) {
    const tradingVolume = normalizeDashboardUsdNumber(item.trading_volume);
    const netPnlPercent = normalizeDashboardNumber(item.net_pnl_pct);
    if (tradingVolume === undefined || netPnlPercent === undefined) return null;
    rows.push({
      id: item.address,
      address: item.address,
      tradingVolume,
      netPnlPercent,
    });
  }

  return { rows };
}

function buildVolumeModel(
  data: DashboardVolumeData,
  state: DashboardChartFilterState,
): DashboardComposedChartModel | null {
  const rows = adaptVolumeRows(data);
  if (rows === null) return null;
  const chartData = buildChartRows(selectRowsByPeriod(rows, state.period));
  const selectedSet = new Set(getLegendSelected(state));
  const series: DashboardSeriesDefinition[] = [
    {
      key: 'perpsTrading',
      label: msg`Perps Trading`,
      color: SERIES_PALETTE[0],
      type: 'bar',
      stackId: 'volume',
      yAxisId: 'left',
      valueFormat: 'currencyCompact',
    },
    {
      key: 'liquidityProviding',
      label: msg`Liquidity Providing`,
      color: SERIES_PALETTE[1],
      type: 'bar',
      stackId: 'volume',
      yAxisId: 'left',
      valueFormat: 'currencyCompact',
    },
    {
      key: 'liquidityRemoving',
      label: msg`Liquidity Removing`,
      color: SERIES_PALETTE[2],
      type: 'bar',
      stackId: 'volume',
      yAxisId: 'left',
      valueFormat: 'currencyCompact',
    },
    {
      key: 'dailyTotal',
      label: msg`Daily Total`,
      color: CUMULATIVE_COLOR,
      type: 'line',
      yAxisId: 'left',
      hide: true,
      showInTooltip: true,
      valueFormat: 'currencyCompact',
    },
    {
      key: 'cumulative',
      label: msg`Cumulative`,
      color: CUMULATIVE_COLOR,
      type: 'line',
      yAxisId: 'right',
      strokeWidth: 2,
      showInTooltip: true,
      valueFormat: 'currencyCompact',
    },
  ];

  return {
    kind: 'composed',
    data: chartData,
    series: series.map((item) =>
      item.key === 'dailyTotal' || selectedSet.has(item.key)
        ? item
        : { ...item, hide: true, showInTooltip: false },
    ),
    leftAxisFormat: 'currencyCompact',
    rightAxisFormat: 'currencyCompact',
    xAxisFormat: getXAxisFormatForPeriod(state.period),
    showLeftAxis: true,
  };
}

function buildOpenInterestModel(
  data: DashboardOpenInterestData,
  state: DashboardChartFilterState,
): DashboardComposedChartModel | null {
  const rows = adaptOpenInterestRows(data, state);
  if (rows === null) return null;
  const visibleRows = selectRowsByPeriod(rows, state.period);

  if (state.modeId === 'all') {
    const selectedSet = new Set(getLegendSelected(state));
    return {
      kind: 'composed',
      data: buildChartRows(visibleRows),
      series: (
        [
          {
            key: 'longOi',
            label: msg`Long OI`,
            color: LONG_COLOR,
            type: 'bar',
            stackId: 'oi',
            yAxisId: 'left',
            valueFormat: 'currencyCompact',
          },
          {
            key: 'shortOi',
            label: msg`Short OI`,
            color: SHORT_COLOR,
            type: 'bar',
            stackId: 'oi',
            yAxisId: 'left',
            valueFormat: 'currencyCompact',
          },
          {
            key: 'dailyTotal',
            label: msg`Daily Total`,
            color: CUMULATIVE_COLOR,
            type: 'line',
            yAxisId: 'left',
            strokeWidth: 2,
            valueFormat: 'currencyCompact',
          },
        ] satisfies DashboardSeriesDefinition[]
      ).map((item) =>
        selectedSet.has(item.key)
          ? item
          : { ...item, hide: true, showInTooltip: false },
      ),
      leftAxisFormat: 'currencyCompact',
      rightAxisFormat: 'currencyCompact',
      xAxisFormat: getXAxisFormatForPeriod(state.period),
      showLeftAxis: true,
    };
  }

  const sourceKey: BreakdownSourceKey =
    state.modeId === 'pairs' ? 'byPair' : 'byAssetType';
  const sourceOptions =
    sourceKey === 'byPair'
      ? mergeDynamicOptions(getDynamicBreakdownOptions(rows, sourceKey), [
          ...state.selected,
          ...getLegendSelected(state),
        ])
      : ASSET_TYPE_OPTIONS;
  const grouped = buildGroupedBarSeriesRows(
    visibleRows,
    sourceKey,
    sourceOptions,
    state.selected,
    getLegendSelected(state),
    'left',
    rows,
  );

  return {
    kind: 'composed',
    data: grouped.data,
    series: grouped.series,
    leftAxisFormat: 'currencyCompact',
    rightAxisFormat: 'currencyCompact',
    xAxisFormat: getXAxisFormatForPeriod(state.period),
  };
}

function buildBreakdownWithCumulativeModelFromRows(
  rows: BreakdownRow[] | null,
  state: DashboardChartFilterState,
): DashboardComposedChartModel | null {
  if (rows === null) return null;
  const visibleRows = selectRowsByPeriod(rows, state.period);

  if (state.modeId === 'all') {
    const selectedSet = new Set(getLegendSelected(state));
    return {
      kind: 'composed',
      data: buildChartRows(visibleRows),
      series: (
        [
          {
            key: 'dailyTotal',
            label: msg`Daily Total`,
            color: SERIES_PALETTE[0],
            type: 'bar',
            yAxisId: 'left',
            valueFormat: 'currencyCompact',
          },
          {
            key: 'cumulative',
            label: msg`Cumulative`,
            color: CUMULATIVE_COLOR,
            type: 'line',
            yAxisId: 'right',
            strokeWidth: 2,
            valueFormat: 'currencyCompact',
          },
        ] satisfies DashboardSeriesDefinition[]
      ).map((item) =>
        selectedSet.has(item.key)
          ? item
          : { ...item, hide: true, showInTooltip: false },
      ),
      leftAxisFormat: 'currencyCompact',
      rightAxisFormat: 'currencyCompact',
      xAxisFormat: getXAxisFormatForPeriod(state.period),
      showLeftAxis: true,
    };
  }

  const sourceKey: BreakdownSourceKey =
    state.modeId === 'pairs' ? 'byPair' : 'byAssetType';
  const sourceOptions =
    sourceKey === 'byPair'
      ? mergeDynamicOptions(getDynamicBreakdownOptions(rows, sourceKey), [
          ...state.selected,
          ...getLegendSelected(state),
        ])
      : ASSET_TYPE_OPTIONS;
  const grouped = buildGroupedBarSeriesRows(
    visibleRows,
    sourceKey,
    sourceOptions,
    state.selected,
    getLegendSelected(state),
    'left',
    rows,
  );
  const chartData: DashboardBaseDatum[] = [];
  for (let index = 0; index < grouped.data.length; index++) {
    const row = grouped.data[index]!;
    const cum = visibleRows[index]?.cumulative;
    if (cum === undefined) return null;
    chartData.push({
      ...row,
      timestamp: row.timestamp,
      label: row.label,
      cumulative: cum,
    });
  }

  return {
    kind: 'composed',
    data: chartData,
    series: [
      ...grouped.series,
      {
        key: 'cumulative',
        label: msg`Cumulative`,
        color: CUMULATIVE_COLOR,
        type: 'line',
        yAxisId: 'right',
        strokeWidth: 2,
        valueFormat: 'currencyCompact',
      },
    ],
    leftAxisFormat: 'currencyCompact',
    rightAxisFormat: 'currencyCompact',
    xAxisFormat: getXAxisFormatForPeriod(state.period),
    showLeftAxis: true,
  };
}

function buildBreakdownWithCumulativeModel(
  data: DashboardBreakdownData,
  state: DashboardChartFilterState,
): DashboardComposedChartModel | null {
  return buildBreakdownWithCumulativeModelFromRows(
    adaptBreakdownRows(data, state),
    state,
  );
}

function buildLiquidationsModel(
  data: DashboardLiquidationsData,
  state: DashboardChartFilterState,
): DashboardComposedChartModel | null {
  return buildBreakdownWithCumulativeModelFromRows(
    adaptLiquidationsRows(data, state),
    state,
  );
}

function buildAnnualFundingRateModel(
  data: DashboardFundingRateData,
  state: DashboardChartFilterState,
): DashboardMultiLineChartModel | null {
  const rows = adaptFundingRateRows(data);
  if (rows === null) return null;
  const visibleRows = selectRowsByPeriod(rows, state.period);
  const options = mergeDynamicOptions(getDynamicOptionsFromRows(visibleRows), [
    ...state.selected,
    ...getLegendSelected(state),
  ]);
  const built = buildLineSeriesRows(
    visibleRows,
    options,
    getLegendSelected(state),
    'percent',
  );
  if (built === null) return null;
  const { data: chartData, lines } = built;

  return {
    kind: 'multiline',
    data: chartData,
    lines,
    yAxisFormat: 'percent',
    xAxisFormat: getXAxisFormatForPeriod(state.period),
    tooltipOrder: 'valueDesc',
  };
}

function buildRealizedPnlModel(
  data: DashboardRealizedPnlData,
  state: DashboardChartFilterState,
): DashboardComposedChartModel | null {
  const rows = adaptRealizedPnlRows(data);
  if (rows === null) return null;
  const visibleRows = selectRowsByPeriod(rows, state.period);
  const selectedSet = new Set(getLegendSelected(state));

  return {
    kind: 'composed',
    data: buildChartRows(visibleRows),
    series: (
      [
        {
          key: 'netProfit',
          label: msg`Net Profit`,
          color: 'var(--color-dashboard-blue)',
          type: 'bar',
          yAxisId: 'left',
          stackId: 'realizedPnl',
          valueFormat: 'currencyCompact',
        },
        {
          key: 'netLoss',
          label: msg`Net Loss`,
          color: 'var(--color-dashboard-red)',
          type: 'bar',
          yAxisId: 'left',
          stackId: 'realizedPnl',
          valueFormat: 'currencyCompact',
        },
        {
          key: 'cumulative',
          label: msg`Cumulative`,
          color: CUMULATIVE_COLOR,
          type: 'line',
          yAxisId: 'right',
          strokeWidth: 2,
          valueFormat: 'currencyCompact',
        },
      ] satisfies DashboardSeriesDefinition[]
    ).map((item) =>
      selectedSet.has(item.key)
        ? item
        : { ...item, hide: true, showInTooltip: false },
    ),
    leftAxisFormat: 'currencyCompact',
    rightAxisFormat: 'currencyCompact',
    xAxisFormat: getXAxisFormatForPeriod(state.period),
    showLeftAxis: true,
  };
}

function buildFeesModel(
  data: DashboardFeesData,
  state: DashboardChartFilterState,
): DashboardComposedChartModel | null {
  const rows = adaptFeesRows(data);
  if (rows === null) return null;
  const chartData = buildChartRows(selectRowsByPeriod(rows, state.period));
  const selectedSet = new Set(getLegendSelected(state));
  const series: DashboardSeriesDefinition[] = [
    {
      key: 'trading',
      label: msg`Trading Fee`,
      color: SERIES_PALETTE[0],
      type: 'bar',
      stackId: 'fees',
      yAxisId: 'left',
      valueFormat: 'currencyCompact',
    },
    {
      key: 'borrow',
      label: msg`Borrow Fee`,
      color: SERIES_PALETTE[1],
      type: 'bar',
      stackId: 'fees',
      yAxisId: 'left',
      valueFormat: 'currencyCompact',
    },
    {
      key: 'liquidation',
      label: msg`Liquidation Fee`,
      color: SERIES_PALETTE[2],
      type: 'bar',
      stackId: 'fees',
      yAxisId: 'left',
      valueFormat: 'currencyCompact',
    },
    {
      key: 'profitSharing',
      label: msg`Profit Sharing`,
      color: SERIES_PALETTE[3],
      type: 'bar',
      stackId: 'fees',
      yAxisId: 'left',
      valueFormat: 'currencyCompact',
    },
    {
      key: 'keeper',
      label: msg`Keeper Fee`,
      color: SERIES_PALETTE[4],
      type: 'bar',
      stackId: 'fees',
      yAxisId: 'left',
      valueFormat: 'currencyCompact',
    },
    {
      key: 'dailyTotal',
      label: msg`Daily Total`,
      color: CUMULATIVE_COLOR,
      type: 'line',
      yAxisId: 'left',
      hide: true,
      showInTooltip: true,
      valueFormat: 'currencyCompact',
    },
    {
      key: 'cumulative',
      label: msg`Cumulative`,
      color: CUMULATIVE_COLOR,
      type: 'line',
      yAxisId: 'right',
      strokeWidth: 2,
      valueFormat: 'currencyCompact',
    },
  ];

  return {
    kind: 'composed',
    data: chartData,
    series: series.map((item) =>
      item.key === 'dailyTotal' || selectedSet.has(item.key)
        ? item
        : { ...item, hide: true, showInTooltip: false },
    ),
    leftAxisFormat: 'currencyCompact',
    rightAxisFormat: 'currencyCompact',
    xAxisFormat: getXAxisFormatForPeriod(state.period),
    showLeftAxis: true,
  };
}

function buildTvlModel(
  data: DashboardTvlData,
  state: DashboardChartFilterState,
): DashboardAreaChartModel | null {
  const rows = adaptTvlRows(data);
  if (rows === null) return null;
  return {
    kind: 'area',
    data: buildChartRows(selectRowsByPeriod(rows, state.period)),
    area: {
      key: 'tvl',
      label: msg`TVL`,
      color: TVL_COLOR,
      type: 'area',
      yAxisId: 'left',
      valueFormat: 'currencyCompact',
    },
    yAxisFormat: 'currencyCompact',
    xAxisFormat: getXAxisFormatForPeriod(state.period),
  };
}

function buildHzlpPriceModel(
  data: DashboardLpPriceData,
  state: DashboardChartFilterState,
): DashboardMultiLineChartModel | null {
  const rows = adaptLpPriceRows(data);
  if (rows === null) return null;
  const visibleRows = selectRowsByPeriod(rows, state.period);
  const options = mergeDynamicOptions(getDynamicOptionsFromRows(visibleRows), [
    ...state.selected,
    ...getLegendSelected(state),
  ]);
  const built = buildLineSeriesRows(
    visibleRows,
    options,
    getLegendSelected(state),
    'currencyCompact',
  );
  if (built === null) return null;
  const { data: chartData, lines } = built;

  return {
    kind: 'multiline',
    data: chartData,
    lines,
    yAxisFormat: 'currencyCompact',
    xAxisFormat: getXAxisFormatForPeriod(state.period),
    tooltipOrder: 'valueDesc',
  };
}

function buildUsersModel(
  data: DashboardUsersData,
  state: DashboardChartFilterState,
): DashboardComposedChartModel | null {
  const rows = adaptUsersRows(data);
  if (rows === null) return null;
  const selectedSet = new Set(getLegendSelected(state));
  return {
    kind: 'composed',
    data: buildChartRows(selectRowsByPeriod(rows, state.period)),
    series: (
      [
        {
          key: 'recurringUsers',
          label: msg`Recurring Users`,
          color: SERIES_PALETTE[0],
          type: 'bar',
          stackId: 'users',
          yAxisId: 'left',
          valueFormat: 'compactNumber',
        },
        {
          key: 'newUsers',
          label: msg`New Users`,
          color: SERIES_PALETTE[1],
          type: 'bar',
          stackId: 'users',
          yAxisId: 'left',
          valueFormat: 'compactNumber',
        },
        {
          key: 'cumulative',
          label: msg`Cumulative Users`,
          color: CUMULATIVE_COLOR,
          type: 'line',
          yAxisId: 'right',
          strokeWidth: 2,
          valueFormat: 'compactNumber',
        },
        {
          key: 'dailyTotal',
          label: msg`Daily Total`,
          color: CUMULATIVE_COLOR,
          type: 'line',
          yAxisId: 'left',
          hide: true,
          showInTooltip: true,
          valueFormat: 'compactNumber',
        },
      ] satisfies DashboardSeriesDefinition[]
    ).map((item) =>
      item.key === 'dailyTotal' || selectedSet.has(item.key)
        ? item
        : { ...item, hide: true, showInTooltip: false },
    ),
    leftAxisFormat: 'compactNumber',
    rightAxisFormat: 'compactNumber',
    xAxisFormat: getXAxisFormatForPeriod(state.period),
    showLeftAxis: true,
  };
}

function buildTopUsersModel(
  data: DashboardTopUsersData,
  state: DashboardTableFilterState,
): DashboardTableModel | null {
  void state;
  const payload = adaptTopUsersPayload(data);
  if (payload === null) return null;

  return {
    kind: 'table',
    columns: [
      { key: 'address', label: msg`User Address` },
      { key: 'tradingVolume', label: msg`Trading Volume`, align: 'right' },
      { key: 'netPnlPercent', label: msg`Net PnL%`, align: 'right' },
    ],
    rows: payload.rows,
  };
}

function createFixedMode(
  id: string,
  label: DashboardFilterModeDefinition['label'],
  options: DashboardOption[],
  allowLegendToggle = false,
): DashboardFilterModeDefinition {
  return {
    id,
    label,
    summaryLabel: label,
    selectionMode: allowLegendToggle ? 'multiple' : 'fixed',
    options,
    defaultSelected: options.map((option) => option.value),
    disableModeSelect: true,
    disableSelectedSelect: !allowLegendToggle,
  };
}

function createSelectableMode(
  id: string,
  label: DashboardFilterModeDefinition['label'],
  options: DashboardOption[],
  selectionMode: DashboardFilterModeDefinition['selectionMode'],
  defaultSelected: string[],
  includeOthersLegend = false,
  defaultOthersChecked = true,
): DashboardFilterModeDefinition {
  return {
    id,
    label,
    summaryLabel: label,
    selectionMode,
    options,
    defaultSelected,
    disableModeSelect: id === 'all',
    disableSelectedSelect: id === 'all',
    includeOthersLegend,
    defaultOthersChecked,
  };
}

function createLpPriceModes(options: DashboardOption[]) {
  return [
    {
      ...createSelectableMode(
        'pairs',
        msg`Pairs`,
        options,
        'multiple',
        getDefaultPairSelectedValues(options),
      ),
      disableModeSelect: true,
    },
  ];
}

function getDefaultChartState(
  defaultModeId: string,
  modes: DashboardFilterModeDefinition[],
  period: DashboardChartPeriod = 'month',
): DashboardChartFilterState {
  const activeMode =
    modes.find((mode) => mode.id === defaultModeId) ?? modes[0]!;
  const includeOthers =
    activeMode.includeOthersLegend && activeMode.defaultOthersChecked !== false;
  return {
    modeId: activeMode.id,
    selected: [...activeMode.defaultSelected],
    legendSelected: activeMode.legendOptions
      ? activeMode.legendOptions.map((option) => option.value)
      : activeMode.selectionMode === 'multiple'
        ? [
            ...activeMode.defaultSelected,
            ...(includeOthers ? [OTHERS_KEY] : []),
          ]
        : undefined,
    legendOrder: undefined,
    period,
  };
}

function getDefaultTableState(): DashboardTableFilterState {
  return {
    sortBy: TOP_USERS_SORT_OPTIONS[0]!.value,
  };
}

export const DASHBOARD_CHART_DEFINITIONS: DashboardChartDefinition[] = [
  {
    id: 'volume',
    title: msg`Volume`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'actionType',
        modes: [
          createFixedMode(
            'actionType',
            msg`Action Type`,
            ACTION_TYPE_OPTIONS,
            true,
          ),
        ],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('actionType', [
        createFixedMode('actionType', msg`Action Type`, ACTION_TYPE_OPTIONS, true),
      ]),
    buildModel: (data, state) =>
      buildVolumeModel(data as DashboardVolumeData, getChartFilterState(state)),
  },
  {
    id: 'openInterest',
    title: msg`Open Interest`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'all',
        modes: [
          createFixedMode('all', msg`All`, OPEN_INTEREST_ALL_OPTIONS, true),
          createSelectableMode(
            'assetTypes',
            msg`Asset Types`,
            ASSET_TYPE_OPTIONS,
            'multiple',
            DEFAULT_ASSET_TYPE_SELECTION,
          ),
          createSelectableMode(
            'pairs',
            msg`Pairs`,
            PAIR_OPTIONS,
            'multiple',
            PAIR_OPTIONS.map((option) => option.value),
            true,
            false,
          ),
        ],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('all', [
        createFixedMode('all', msg`All`, OPEN_INTEREST_ALL_OPTIONS, true),
        createSelectableMode(
          'assetTypes',
          msg`Asset Types`,
          ASSET_TYPE_OPTIONS,
          'multiple',
          DEFAULT_ASSET_TYPE_SELECTION,
        ),
        createSelectableMode(
          'pairs',
          msg`Pairs`,
          PAIR_OPTIONS,
          'multiple',
          PAIR_OPTIONS.map((option) => option.value),
          true,
          false,
        ),
      ]),
    buildModel: (data, state) =>
      buildOpenInterestModel(
        data as DashboardOpenInterestData,
        getChartFilterState(state),
      ),
  },
  {
    id: 'totalTradingVolume',
    title: msg`Total Trading Volume`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'all',
        modes: [
          createFixedMode('all', msg`All`, TOTAL_AND_CUMULATIVE_OPTIONS, true),
          createSelectableMode(
            'assetTypes',
            msg`Asset Types`,
            ASSET_TYPE_OPTIONS,
            'multiple',
            DEFAULT_ASSET_TYPE_SELECTION,
          ),
          createSelectableMode(
            'pairs',
            msg`Pairs`,
            PAIR_OPTIONS,
            'multiple',
            PAIR_OPTIONS.map((option) => option.value),
          ),
        ],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('all', [
        createFixedMode('all', msg`All`, TOTAL_AND_CUMULATIVE_OPTIONS, true),
        createSelectableMode(
          'assetTypes',
          msg`Asset Types`,
          ASSET_TYPE_OPTIONS,
          'multiple',
          DEFAULT_ASSET_TYPE_SELECTION,
        ),
        createSelectableMode(
          'pairs',
          msg`Pairs`,
          PAIR_OPTIONS,
          'multiple',
          PAIR_OPTIONS.map((option) => option.value),
        ),
      ]),
    buildModel: (data, state) =>
      buildBreakdownWithCumulativeModel(
        data as DashboardBreakdownData,
        getChartFilterState(state),
      ),
  },
  {
    id: 'annualFundingRate',
    title: msg`Ann. Funding Rate`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'pairs',
        modes: [
          {
            ...createSelectableMode(
              'pairs',
              msg`Pairs`,
              PAIR_OPTIONS,
              'multiple',
              getDefaultPairSelectedValues(PAIR_OPTIONS),
            ),
            disableModeSelect: true,
          },
        ],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('pairs', [
        {
          ...createSelectableMode(
            'pairs',
            msg`Pairs`,
            PAIR_OPTIONS,
            'multiple',
            getDefaultPairSelectedValues(PAIR_OPTIONS),
          ),
          disableModeSelect: true,
        },
      ]),
    buildModel: (data, state) =>
      buildAnnualFundingRateModel(
        data as DashboardFundingRateData,
        getChartFilterState(state),
      ),
  },
  {
    id: 'realizedPnl',
    title: msg`Realized PnL`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'all',
        modes: [
          {
            ...createFixedMode('all', msg`All`, REALIZED_PNL_OPTIONS, true),
            legendOptions: REALIZED_PNL_OPTIONS,
            allowLegendSelectAll: true,
          },
          {
            ...createSelectableMode(
              'assetTypes',
              msg`Asset Types`,
              ASSET_TYPE_OPTIONS,
              'single',
              ['crypto'],
            ),
            selectedDisplay: 'select',
            legendOptions: REALIZED_PNL_OPTIONS,
            allowLegendSelectAll: true,
          },
          {
            ...createSelectableMode('pairs', msg`Pairs`, PAIR_OPTIONS, 'single', [
              'BTC/USD',
            ]),
            selectedDisplay: 'select',
            legendOptions: REALIZED_PNL_OPTIONS,
            allowLegendSelectAll: true,
          },
        ],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('all', [
        {
          ...createFixedMode('all', msg`All`, REALIZED_PNL_OPTIONS, true),
          legendOptions: REALIZED_PNL_OPTIONS,
          allowLegendSelectAll: true,
        },
        {
          ...createSelectableMode(
            'assetTypes',
            msg`Asset Types`,
            ASSET_TYPE_OPTIONS,
            'single',
            ['crypto'],
          ),
          selectedDisplay: 'select',
          legendOptions: REALIZED_PNL_OPTIONS,
          allowLegendSelectAll: true,
        },
        {
          ...createSelectableMode('pairs', msg`Pairs`, PAIR_OPTIONS, 'single', [
            'BTC/USD',
          ]),
          selectedDisplay: 'select',
          legendOptions: REALIZED_PNL_OPTIONS,
          allowLegendSelectAll: true,
        },
      ]),
    buildModel: (data, state) =>
      buildRealizedPnlModel(
        data as DashboardRealizedPnlData,
        getChartFilterState(state),
      ),
  },
  {
    id: 'lossRebate',
    title: msg`Loss Rebate`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'all',
        modes: [
          createFixedMode('all', msg`All`, TOTAL_AND_CUMULATIVE_OPTIONS, true),
          createSelectableMode(
            'assetTypes',
            msg`Asset Types`,
            ASSET_TYPE_OPTIONS,
            'multiple',
            DEFAULT_ASSET_TYPE_SELECTION,
          ),
          createSelectableMode(
            'pairs',
            msg`Pairs`,
            PAIR_OPTIONS,
            'multiple',
            PAIR_OPTIONS.map((option) => option.value),
          ),
        ],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('all', [
        createFixedMode('all', msg`All`, TOTAL_AND_CUMULATIVE_OPTIONS, true),
        createSelectableMode(
          'assetTypes',
          msg`Asset Types`,
          ASSET_TYPE_OPTIONS,
          'multiple',
          DEFAULT_ASSET_TYPE_SELECTION,
        ),
        createSelectableMode(
          'pairs',
          msg`Pairs`,
          PAIR_OPTIONS,
          'multiple',
          PAIR_OPTIONS.map((option) => option.value),
        ),
      ]),
    buildModel: (data, state) =>
      buildBreakdownWithCumulativeModel(
        data as DashboardBreakdownData,
        getChartFilterState(state),
      ),
  },
  {
    id: 'liquidations',
    title: msg`Liquidations`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'all',
        modes: [
          createFixedMode('all', msg`All`, TOTAL_AND_CUMULATIVE_OPTIONS, true),
          createSelectableMode(
            'assetTypes',
            msg`Asset Types`,
            ASSET_TYPE_OPTIONS,
            'multiple',
            DEFAULT_ASSET_TYPE_SELECTION,
          ),
          createSelectableMode(
            'pairs',
            msg`Pairs`,
            PAIR_OPTIONS,
            'multiple',
            PAIR_OPTIONS.map((option) => option.value),
          ),
        ],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('all', [
        createFixedMode('all', msg`All`, TOTAL_AND_CUMULATIVE_OPTIONS, true),
        createSelectableMode(
          'assetTypes',
          msg`Asset Types`,
          ASSET_TYPE_OPTIONS,
          'multiple',
          DEFAULT_ASSET_TYPE_SELECTION,
        ),
        createSelectableMode(
          'pairs',
          msg`Pairs`,
          PAIR_OPTIONS,
          'multiple',
          PAIR_OPTIONS.map((option) => option.value),
        ),
      ]),
    buildModel: (data, state) =>
      buildLiquidationsModel(
        data as DashboardLiquidationsData,
        getChartFilterState(state),
      ),
  },
  {
    id: 'fees',
    title: msg`Fees`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'feeType',
        modes: [createFixedMode('feeType', msg`Fee Type`, FEE_TYPE_OPTIONS, true)],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('feeType', [
        createFixedMode('feeType', msg`Fee Type`, FEE_TYPE_OPTIONS, true),
      ]),
    buildModel: (data, state) =>
      buildFeesModel(data as DashboardFeesData, getChartFilterState(state)),
  },
  {
    id: 'totalValueLocked',
    title: msg`Total Value Locked`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'all',
        modes: [
          createFixedMode('all', msg`All`, [{ value: 'all', label: msg`All` }]),
        ],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('all', [
        createFixedMode('all', msg`All`, [{ value: 'all', label: msg`All` }]),
      ]),
    buildModel: (data, state) =>
      buildTvlModel(data as DashboardTvlData, getChartFilterState(state)),
  },
  {
    id: 'hzlpPrice',
    title: msg`HzLP Price`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'pairs',
        modes: createLpPriceModes([]),
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('pairs', createLpPriceModes([])),
    buildModel: (data, state) =>
      buildHzlpPriceModel(
        data as DashboardLpPriceData,
        getChartFilterState(state),
      ),
  },
  {
    id: 'users',
    title: msg`Users`,
    controls: {
      kind: 'chart',
      filter: {
        defaultModeId: 'all',
        modes: [createFixedMode('all', msg`All`, USERS_OPTIONS, true)],
        allowPeriod: true,
        defaultPeriod: 'month',
      },
    },
    getInitialState: () =>
      getDefaultChartState('all', [
        createFixedMode('all', msg`All`, USERS_OPTIONS, true),
      ]),
    buildModel: (data, state) =>
      buildUsersModel(data as DashboardUsersData, getChartFilterState(state)),
  },
  {
    id: 'topUsers',
    title: msg`Top 100 Users`,
    controls: {
      kind: 'table',
      sort: {
        label: msg`Sort by`,
        defaultValue: TOP_USERS_SORT_OPTIONS[0]!.value,
        options: TOP_USERS_SORT_OPTIONS,
      },
    },
    getInitialState: () => getDefaultTableState(),
    buildModel: (data, state) =>
      buildTopUsersModel(
        data as DashboardTopUsersData,
        getTableFilterState(state),
      ),
  },
];

export function resolveDashboardChartDefinition(
  definition: DashboardChartDefinition,
  runtimeOptions: DashboardOption[],
) {
  if (definition.controls.kind !== 'chart' || runtimeOptions.length === 0) {
    return definition;
  }

  const filter = definition.controls.filter;
  const pairOptions = mergeOptions(runtimeOptions, PAIR_OPTIONS);
  const realizedPnlPairOptions =
    definition.id === 'realizedPnl'
      ? getDefaultPairSelectedValues(pairOptions).flatMap((value) => {
          const option = pairOptions.find((item) => item.value === value);
          return option ? [option] : [];
        })
      : pairOptions;

  const modes =
    definition.id === 'hzlpPrice'
      ? createLpPriceModes(pairOptions)
      : filter.modes.map((mode) =>
          mode.id !== 'pairs'
            ? mode
            : {
                ...mode,
                options: realizedPnlPairOptions,
                defaultSelected:
                  mode.selectionMode === 'single'
                    ? realizedPnlPairOptions.some(
                        (option) => option.value === 'BTC/USD',
                      )
                      ? ['BTC/USD']
                      : realizedPnlPairOptions[0]
                        ? [realizedPnlPairOptions[0].value]
                        : []
                    : getDefaultPairSelectedValues(realizedPnlPairOptions),
              },
        );

  return {
    ...definition,
    controls: {
      ...definition.controls,
      filter: {
        ...filter,
        modes,
      },
    },
    getInitialState: () =>
      getDefaultChartState(filter.defaultModeId, modes, filter.defaultPeriod),
  };
}

export function resolveDashboardCardState(
  definition: DashboardChartDefinition,
  state: DashboardCardState,
): DashboardCardState {
  if (definition.controls.kind === 'table' || !('modeId' in state)) {
    return state;
  }

  const activeMode =
    definition.controls.filter.modes.find((mode) => mode.id === state.modeId) ??
    definition.controls.filter.modes[0];

  if (!activeMode) {
    return state;
  }

  if (
    activeMode.selectionMode === 'fixed' ||
    activeMode.disableSelectedSelect
  ) {
    return {
      ...state,
      modeId: activeMode.id,
      selected: [...activeMode.defaultSelected],
      legendSelected: undefined,
      legendOrder: undefined,
    };
  }

  const activeModeOptionValues = new Set(
    activeMode.options.map((option) => option.value),
  );
  const selectedValues = new Set(state.selected);
  const selected = activeMode.options.flatMap((option) =>
    selectedValues.has(option.value) ? [option.value] : [],
  );

  const fallbackSelected =
    selected.length > 0
      ? selected
      : activeMode.defaultSelected.filter((value) =>
          activeModeOptionValues.has(value),
        );
  const defaultLegendSelected = activeMode.legendOptions
    ? activeMode.legendOptions.map((option) => option.value)
    : [
        ...fallbackSelected,
        ...(activeMode.includeOthersLegend ? [OTHERS_KEY] : []),
      ];
  const legendSelectedValues = new Set(
    state.selected.length === 0
      ? defaultLegendSelected
      : (state.legendSelected ?? defaultLegendSelected),
  );
  const legendSelected = activeMode.legendOptions
    ? defaultLegendSelected.filter((value) => legendSelectedValues.has(value))
    : activeMode.selectionMode === 'multiple'
      ? [
          ...fallbackSelected.filter((value) =>
            legendSelectedValues.has(value),
          ),
          ...(activeMode.includeOthersLegend &&
          legendSelectedValues.has(OTHERS_KEY)
            ? [OTHERS_KEY]
            : []),
        ]
      : undefined;
  const fallbackSelectedValues = new Set(fallbackSelected);
  const legendOrder =
    activeMode.id === 'pairs' &&
    activeMode.selectionMode === 'multiple' &&
    state.legendOrder
      ? state.legendOrder.filter((value) => fallbackSelectedValues.has(value))
      : undefined;

  return {
    ...state,
    modeId: activeMode.id,
    selected: fallbackSelected,
    legendSelected,
    legendOrder,
  };
}

export function useDashboardChartData(
  definition: DashboardChartDefinition,
  state: DashboardCardState,
  enabled = true,
  initialData?: DashboardChartQueryData,
) {
  const query = useDashboardChartQuery(
    definition.id,
    state,
    enabled,
    initialData,
  );

  const model = useMemo<DashboardPresenterModel | null>(() => {
    if (!query.data || query.isError) return null;
    return definition.buildModel(query.data, state);
  }, [definition, query.data, query.isError, state]);

  const chipOrder = useMemo<string[] | undefined>(() => {
    if (!query.data || 'sortBy' in state) return undefined;
    return computeChipOrder(definition.id, query.data, state);
  }, [definition.id, query.data, state]);

  return {
    ...query,
    model,
    chipOrder,
  };
}

export function getDashboardInitialDataKey(state: DashboardCardState) {
  return getDashboardStateKey(state);
}
