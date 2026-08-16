import type { I18n, MessageDescriptor } from '@lingui/core';

export type DashboardChartId =
  | 'volume'
  | 'openInterest'
  | 'totalTradingVolume'
  | 'annualFundingRate'
  | 'realizedPnl'
  | 'lossRebate'
  | 'liquidations'
  | 'fees'
  | 'totalValueLocked'
  | 'hzlpPrice'
  | 'users'
  | 'topUsers';

export type DashboardChartPeriod = 'day' | 'week' | 'month' | 'all';

export type DashboardLabel = MessageDescriptor | string;

export function resolveDashboardLabel(label: DashboardLabel, i18n: I18n): string {
  return typeof label === 'string' ? label : i18n._(label);
}

export interface DashboardOption {
  value: string;
  label: DashboardLabel;
}

type DashboardSelectionMode = 'single' | 'multiple' | 'fixed';

export interface DashboardFilterModeDefinition {
  id: string;
  label: DashboardLabel;
  summaryLabel: DashboardLabel;
  selectionMode: DashboardSelectionMode;
  options: DashboardOption[];
  defaultSelected: string[];
  disableModeSelect?: boolean;
  disableSelectedSelect?: boolean;
  includeOthersLegend?: boolean;
  defaultOthersChecked?: boolean;
  selectedDisplay?: 'chips' | 'select';
  legendOptions?: DashboardOption[];
  allowLegendSelectAll?: boolean;
}

export interface DashboardChartFilterConfig {
  defaultModeId: string;
  modes: DashboardFilterModeDefinition[];
  allowPeriod?: boolean;
  defaultPeriod?: DashboardChartPeriod;
}

export interface DashboardSortConfig {
  label: DashboardLabel;
  defaultValue: string;
  options: DashboardOption[];
}

type DashboardCardControls =
  | { kind: 'chart'; filter: DashboardChartFilterConfig }
  | { kind: 'table'; sort: DashboardSortConfig };

export interface DashboardChartFilterState {
  modeId: string;
  selected: string[];
  legendSelected?: string[];
  legendOrder?: string[];
  period: DashboardChartPeriod;
}

export interface DashboardTableFilterState {
  sortBy: string;
}

export type DashboardCardState =
  | DashboardChartFilterState
  | DashboardTableFilterState;

export type DashboardValueFormat =
  | 'currencyCompact'
  | 'currency'
  | 'percent'
  | 'number'
  | 'compactNumber';

type DashboardXAxisFormat = 'shortDate' | 'adaptiveDate' | 'hour';
type DashboardTooltipOrder = 'default' | 'valueDesc';

export interface DashboardBaseDatum {
  timestamp: number;
  label: string;
  [key: string]: string | number | undefined;
}

export interface DashboardSeriesDefinition {
  key: string;
  label: DashboardLabel;
  color: string;
  type: 'bar' | 'line' | 'area';
  yAxisId?: 'left' | 'right';
  stackId?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  hide?: boolean;
  showInTooltip?: boolean;
  valueFormat?: DashboardValueFormat;
  dashed?: boolean;
  dot?: boolean;
}

export interface DashboardComposedChartModel {
  kind: 'composed';
  data: DashboardBaseDatum[];
  series: DashboardSeriesDefinition[];
  leftAxisFormat: DashboardValueFormat;
  rightAxisFormat?: DashboardValueFormat;
  xAxisFormat: DashboardXAxisFormat;
  showLeftAxis?: boolean;
  tooltipOrder?: DashboardTooltipOrder;
  yAxisWidth?: number;
}

export interface DashboardMultiLineChartModel {
  kind: 'multiline';
  data: DashboardBaseDatum[];
  lines: DashboardSeriesDefinition[];
  yAxisFormat: DashboardValueFormat;
  xAxisFormat: DashboardXAxisFormat;
  tooltipOrder?: DashboardTooltipOrder;
  yAxisWidth?: number;
}

export interface DashboardAreaChartModel {
  kind: 'area';
  data: DashboardBaseDatum[];
  area: DashboardSeriesDefinition;
  yAxisFormat: DashboardValueFormat;
  xAxisFormat: DashboardXAxisFormat;
  tooltipOrder?: DashboardTooltipOrder;
  yAxisWidth?: number;
}

interface DashboardTableColumn {
  key: 'address' | 'tradingVolume' | 'netPnlPercent';
  label: DashboardLabel;
  align?: 'left' | 'right';
}

export interface DashboardTopUsersRow {
  id: string;
  address: string;
  tradingVolume: number;
  netPnlPercent: number;
}

export interface DashboardTableModel {
  kind: 'table';
  columns: DashboardTableColumn[];
  rows: DashboardTopUsersRow[];
}

export type DashboardPresenterModel =
  | DashboardComposedChartModel
  | DashboardMultiLineChartModel
  | DashboardAreaChartModel
  | DashboardTableModel;

export interface DashboardChartDefinition {
  id: DashboardChartId;
  title: DashboardLabel;
  controls: DashboardCardControls;
  className?: string;
  getInitialState: () => DashboardCardState;
  buildModel: (
    data: unknown,
    state: DashboardCardState,
  ) => DashboardPresenterModel | null;
}

export type DashboardInitialChartData = Partial<
  Record<
    DashboardChartId,
    {
      stateKey: string;
      data: unknown;
    }
  >
>;
