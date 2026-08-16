'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  List as VirtualList,
  useListCallbackRef,
  type RowComponentProps,
} from 'react-window';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import {
  dateFormat,
  formatAddress,
  percentFormat,
  unitFormat,
} from '@repo/lib/format';
import {
  ChartContainer,
  ChartTooltip,
  Separator,
  cn,
  useShowBShadow,
} from '@repo/ui';
import { useHzSdk } from '@/common/chainClient/hooks';
import { DASHBOARD_CHART_HEIGHT_CLASS_NAME } from './dashboardChart.layout';
import { resolveDashboardLabel } from './dashboardChart.types';
import type {
  DashboardAreaChartModel,
  DashboardBaseDatum,
  DashboardComposedChartModel,
  DashboardMultiLineChartModel,
  DashboardPresenterModel,
  DashboardSeriesDefinition,
  DashboardTopUsersRow,
  DashboardValueFormat,
  DashboardTableModel,
} from './dashboardChart.types';

const TABLE_CLASS_NAME = 'h-[370px] w-full';
const TOP_USERS_ROW_HEIGHT = 34;
const HOVER_MARKER_DATA_KEY = '__hoverMarkerValue';
const CROSSHAIR_STROKE = '#FFFFFF';
const DEFAULT_Y_AXIS_WIDTH = 72;
const TOP_USERS_GRID_CLASS =
  'grid grid-cols-[minmax(110px,_33fr)_minmax(80px,_34fr)_minmax(80px,_33fr)]';

interface DashboardAxisTicksState {
  ticks: Map<number, number>;
  version: number;
}

interface DashboardPlotArea {
  bottom: number;
  containerLeft: number;
  containerTop: number;
  height: number;
  left: number;
  right: number;
  svgTop: number;
  top: number;
  width: number;
}

interface DashboardCrosshairOverlayProps {
  containerRef: RefObject<HTMLDivElement | null>;
  leftAxisTicksRef: { current: DashboardAxisTicksState };
  leftAxisValueFormat: DashboardValueFormat;
  rightAxisTicksRef: { current: DashboardAxisTicksState };
  rightAxisValueFormat: DashboardValueFormat;
  showLeftAxisLabel: boolean;
  showRightAxisLabel: boolean;
  onOutsidePointerDown?: () => void;
}

const DashboardCrosshairOverlay = ({
  containerRef,
  leftAxisTicksRef,
  leftAxisValueFormat,
  rightAxisTicksRef,
  rightAxisValueFormat,
  showLeftAxisLabel,
  showRightAxisLabel,
  onOutsidePointerDown,
}: DashboardCrosshairOverlayProps) => {
  const overlayRef = useRef<SVGSVGElement | null>(null);
  const verticalLineRef = useRef<SVGLineElement | null>(null);
  const horizontalLineRef = useRef<SVGLineElement | null>(null);
  const leftLabelGroupRef = useRef<SVGGElement | null>(null);
  const leftLabelRectRef = useRef<SVGRectElement | null>(null);
  const leftLabelTextRef = useRef<SVGTextElement | null>(null);
  const rightLabelGroupRef = useRef<SVGGElement | null>(null);
  const rightLabelRectRef = useRef<SVGRectElement | null>(null);
  const rightLabelTextRef = useRef<SVGTextElement | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const pointerRef = useRef<{ clientX: number; clientY: number } | undefined>(
    undefined,
  );
  const plotAreaRef = useRef<DashboardPlotArea | undefined>(undefined);
  const sortedTicksRef = useRef<
    Record<
      'left' | 'right',
      {
        ticks: Array<{ coordinate: number; value: number }>;
        version: number;
      }
    >
  >({
    left: { ticks: [], version: -1 },
    right: { ticks: [], version: -1 },
  });
  const lastLabelRef = useRef<
    Record<'left' | 'right', string | undefined>
  >({
    left: undefined,
    right: undefined,
  });

  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    const verticalLine = verticalLineRef.current;
    const horizontalLine = horizontalLineRef.current;
    const leftLabelGroup = leftLabelGroupRef.current;
    const leftLabelRect = leftLabelRectRef.current;
    const leftLabelText = leftLabelTextRef.current;
    const rightLabelGroup = rightLabelGroupRef.current;
    const rightLabelRect = rightLabelRectRef.current;
    const rightLabelText = rightLabelTextRef.current;
    if (
      !container ||
      !overlay ||
      !verticalLine ||
      !horizontalLine ||
      !leftLabelGroup ||
      !leftLabelRect ||
      !leftLabelText ||
      !rightLabelGroup ||
      !rightLabelRect ||
      !rightLabelText
    ) {
      return;
    }

    const hideCrosshair = () => {
      overlay.style.opacity = '0';
      pointerRef.current = undefined;
    };

    const invalidatePlotArea = () => {
      plotAreaRef.current = undefined;
    };

    const getPlotArea = () => {
      if (plotAreaRef.current) return plotAreaRef.current;

      const clipRect = container.querySelector<SVGRectElement>('clipPath rect');
      const surface = container.querySelector<SVGSVGElement>(
        'svg.recharts-surface',
      );
      if (!clipRect || !surface) return undefined;

      const surfaceRect = surface.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const left =
        surfaceRect.left -
        containerRect.left +
        Number(clipRect.getAttribute('x') ?? 0);
      const top =
        surfaceRect.top -
        containerRect.top +
        Number(clipRect.getAttribute('y') ?? 0);
      const width = Number(clipRect.getAttribute('width') ?? 0);
      const height = Number(clipRect.getAttribute('height') ?? 0);
      const svgTop = surfaceRect.top - containerRect.top;

      if (width <= 0 || height <= 0) return undefined;

      const plotArea = {
        bottom: top + height,
        containerLeft: containerRect.left,
        containerTop: containerRect.top,
        height,
        left,
        right: left + width,
        svgTop,
        top,
        width,
      };
      plotAreaRef.current = plotArea;
      return plotArea;
    };

    const getSortedTicks = (
      side: 'left' | 'right',
      ticksRef: { current: DashboardAxisTicksState },
    ) => {
      const tickState = ticksRef.current;
      const sortedTickState = sortedTicksRef.current[side];
      if (sortedTickState.version === tickState.version) {
        return sortedTickState.ticks;
      }

      const ticks = Array.from(tickState.ticks, ([coordinate, value]) => ({
        coordinate,
        value,
      })).sort(
        (leftTick, rightTick) => leftTick.coordinate - rightTick.coordinate,
      );
      sortedTicksRef.current[side] = {
        ticks,
        version: tickState.version,
      };
      return ticks;
    };

    const getAxisLabel = (
      side: 'left' | 'right',
      ticksRef: { current: DashboardAxisTicksState },
      valueFormat: DashboardValueFormat,
      relativeTickY: number,
    ) => {
      const ticks = getSortedTicks(side, ticksRef);
      const upperIndex = ticks.findIndex(
        (tick) => tick.coordinate >= relativeTickY,
      );
      const lower =
        upperIndex === -1
          ? ticks[ticks.length - 2]
          : upperIndex === 0
            ? ticks[0]
            : ticks[upperIndex - 1];
      const upper =
        upperIndex === -1
          ? ticks[ticks.length - 1]
          : upperIndex === 0
            ? ticks[1]
            : ticks[upperIndex];
      const value =
        upper && lower && upper.coordinate !== lower.coordinate
          ? lower.value +
            ((relativeTickY - lower.coordinate) /
              (upper.coordinate - lower.coordinate)) *
              (upper.value - lower.value)
          : upper?.value;

      return value === undefined
        ? undefined
        : formatAxisValue(value, valueFormat);
    };

    const updateAxisLabel = ({
      group,
      rect,
      text,
      label,
      side,
      plotArea,
      y,
    }: {
      group: SVGGElement;
      rect: SVGRectElement;
      text: SVGTextElement;
      label?: string;
      side: 'left' | 'right';
      plotArea: DashboardPlotArea;
      y: number;
    }) => {
      if (!label) {
        group.style.opacity = '0';
        return;
      }

      const labelWidth = Math.max(48, label.length * 7 + 16);
      const labelHeight = 22;
      const labelX =
        side === 'left'
          ? Math.max(0, plotArea.left - labelWidth)
          : plotArea.right;
      const labelY = Math.min(
        Math.max(y - labelHeight / 2, plotArea.top),
        plotArea.bottom - labelHeight,
      );

      group.style.opacity = '1';
      rect.setAttribute('x', `${labelX}`);
      rect.setAttribute('y', `${labelY}`);
      rect.setAttribute('width', `${labelWidth}`);
      rect.setAttribute('height', `${labelHeight}`);
      text.setAttribute(
        'x',
        `${side === 'left' ? labelX + labelWidth - 8 : labelX + 8}`,
      );
      text.setAttribute('y', `${labelY + labelHeight / 2}`);
      if (lastLabelRef.current[side] !== label) {
        text.textContent = label;
        lastLabelRef.current[side] = label;
      }
    };

    const updateCrosshair = () => {
      frameRef.current = undefined;
      const pointer = pointerRef.current;
      const plotArea = getPlotArea();
      if (!pointer || !plotArea) {
        hideCrosshair();
        return;
      }

      const x = Math.min(
        Math.max(pointer.clientX - plotArea.containerLeft, plotArea.left),
        plotArea.right,
      );
      const y = Math.min(
        Math.max(pointer.clientY - plotArea.containerTop, plotArea.top),
        plotArea.bottom,
      );
      const relativeTickY = y - plotArea.svgTop;
      const leftLabel = showLeftAxisLabel
        ? getAxisLabel(
            'left',
            leftAxisTicksRef,
            leftAxisValueFormat,
            relativeTickY,
          )
        : undefined;
      const rightLabel = showRightAxisLabel
        ? getAxisLabel(
            'right',
            rightAxisTicksRef,
            rightAxisValueFormat,
            relativeTickY,
          )
        : undefined;

      overlay.style.opacity = '1';
      verticalLine.setAttribute('x1', `${x}`);
      verticalLine.setAttribute('x2', `${x}`);
      verticalLine.setAttribute('y1', `${plotArea.top}`);
      verticalLine.setAttribute('y2', `${plotArea.bottom}`);
      horizontalLine.setAttribute('x1', `${plotArea.left}`);
      horizontalLine.setAttribute('x2', `${plotArea.right}`);
      horizontalLine.setAttribute('y1', `${y}`);
      horizontalLine.setAttribute('y2', `${y}`);

      updateAxisLabel({
        group: leftLabelGroup,
        rect: leftLabelRect,
        text: leftLabelText,
        label: leftLabel,
        side: 'left',
        plotArea,
        y,
      });
      updateAxisLabel({
        group: rightLabelGroup,
        rect: rightLabelRect,
        text: rightLabelText,
        label: rightLabel,
        side: 'right',
        plotArea,
        y,
      });
    };

    const scheduleUpdate = (clientX: number, clientY: number) => {
      pointerRef.current = { clientX, clientY };
      if (frameRef.current !== undefined) return;
      frameRef.current = requestAnimationFrame(updateCrosshair);
    };
    const schedulePointerUpdate = (event: PointerEvent) => {
      scheduleUpdate(event.clientX, event.clientY);
    };
    const scheduleTouchUpdate = (event: TouchEvent) => {
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (!touch) return;
      scheduleUpdate(touch.clientX, touch.clientY);
    };
    const hideMouseCrosshair = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      hideCrosshair();
    };
    const hideCrosshairOnOutsidePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || container.contains(event.target)) {
        return;
      }
      const wasVisible = pointerRef.current !== undefined;
      hideCrosshair();
      if (wasVisible) {
        onOutsidePointerDown?.();
      }
    };
    const pointerListenerOptions = { capture: true, passive: true };

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(invalidatePlotArea);
    resizeObserver?.observe(container);
    window.addEventListener('scroll', invalidatePlotArea, {
      capture: true,
      passive: true,
    });
    container.addEventListener(
      'pointerdown',
      schedulePointerUpdate,
      pointerListenerOptions,
    );
    container.addEventListener(
      'pointermove',
      schedulePointerUpdate,
      pointerListenerOptions,
    );
    container.addEventListener(
      'touchstart',
      scheduleTouchUpdate,
      pointerListenerOptions,
    );
    container.addEventListener(
      'touchmove',
      scheduleTouchUpdate,
      pointerListenerOptions,
    );
    container.addEventListener('pointerleave', hideMouseCrosshair, {
      passive: true,
    });
    document.addEventListener(
      'pointerdown',
      hideCrosshairOnOutsidePointerDown,
      pointerListenerOptions,
    );

    if (!showLeftAxisLabel) {
      leftLabelGroup.style.opacity = '0';
    }
    if (!showRightAxisLabel) {
      rightLabelGroup.style.opacity = '0';
    }
    if (pointerRef.current) {
      invalidatePlotArea();
      updateCrosshair();
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', invalidatePlotArea, {
        capture: true,
      });
      container.removeEventListener(
        'pointerdown',
        schedulePointerUpdate,
        pointerListenerOptions,
      );
      container.removeEventListener(
        'pointermove',
        schedulePointerUpdate,
        pointerListenerOptions,
      );
      container.removeEventListener(
        'touchstart',
        scheduleTouchUpdate,
        pointerListenerOptions,
      );
      container.removeEventListener(
        'touchmove',
        scheduleTouchUpdate,
        pointerListenerOptions,
      );
      container.removeEventListener('pointerleave', hideMouseCrosshair);
      document.removeEventListener(
        'pointerdown',
        hideCrosshairOnOutsidePointerDown,
        pointerListenerOptions,
      );
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
    };
  }, [
    containerRef,
    leftAxisTicksRef,
    leftAxisValueFormat,
    onOutsidePointerDown,
    rightAxisTicksRef,
    rightAxisValueFormat,
    showLeftAxisLabel,
    showRightAxisLabel,
  ]);

  return (
    <svg
      ref={overlayRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible opacity-0"
    >
      <line
        ref={verticalLineRef}
        stroke={CROSSHAIR_STROKE}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        ref={horizontalLineRef}
        stroke={CROSSHAIR_STROKE}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <g ref={leftLabelGroupRef} opacity={0}>
        <rect ref={leftLabelRectRef} fill="var(--bg-4)" />
        <text
          ref={leftLabelTextRef}
          fill="var(--t-1100)"
          fontSize={12}
          dominantBaseline="middle"
          textAnchor="end"
        />
      </g>
      <g ref={rightLabelGroupRef} opacity={0}>
        <rect ref={rightLabelRectRef} fill="var(--bg-4)" />
        <text
          ref={rightLabelTextRef}
          fill="var(--t-1100)"
          fontSize={12}
          dominantBaseline="middle"
          textAnchor="start"
        />
      </g>
    </svg>
  );
};

interface DashboardYAxisTickProps {
  index?: number;
  x?: number;
  y?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  payload?: { value?: number };
  valueFormat: DashboardValueFormat;
  ticksRef: { current: DashboardAxisTicksState };
}

const DashboardYAxisTick = ({
  index,
  x = 0,
  y = 0,
  textAnchor = 'end',
  payload,
  valueFormat,
  ticksRef,
}: DashboardYAxisTickProps) => {
  const value = Number(payload?.value);
  if (!Number.isFinite(value)) return null;

  if (index === 0) {
    ticksRef.current.ticks.clear();
    ticksRef.current.version += 1;
  }
  if (ticksRef.current.ticks.get(y) !== value) {
    ticksRef.current.ticks.set(y, value);
    ticksRef.current.version += 1;
  }

  return (
    <text
      x={x}
      y={y}
      dy="0.355em"
      fill="var(--t-270)"
      fontSize={12}
      textAnchor={textAnchor}
    >
      {formatAxisValue(value, valueFormat)}
    </text>
  );
};

function formatDashboardValue(
  value: number,
  format: DashboardValueFormat,
  { stripTrailingZeros = false }: { stripTrailingZeros?: boolean } = {},
) {
  if (format === 'percent') {
    return percentFormat(value, 2, {
      stripTrailingZeros,
      showMinDecimalValue: true,
    });
  }

  if (format === 'currency') {
    return unitFormat(value, 2, {
      style: 'currency',
      currency: 'USD',
      round: ROUND_MODE.ROUND,
      unitDecimal: 2,
      stripTrailingZeros,
    });
  }

  if (format === 'compactNumber') {
    return unitFormat(value, 0, {
      round: ROUND_MODE.ROUND,
      unitDecimal: 2,
      stripTrailingZeros,
    });
  }

  if (format === 'number') {
    return unitFormat(value, 2, {
      round: ROUND_MODE.ROUND,
      unitDecimal: 2,
      stripTrailingZeros,
      useGrouping: false,
    });
  }

  return unitFormat(value, 2, {
    style: 'currency',
    currency: 'USD',
    round: ROUND_MODE.ROUND,
    unitDecimal: 2,
    stripTrailingZeros,
  });
}

function formatChartValue(value: number, format: DashboardValueFormat) {
  return formatDashboardValue(value, format);
}

function formatAxisValue(value: number, format: DashboardValueFormat) {
  return formatDashboardValue(value, format, { stripTrailingZeros: true });
}

function formatXAxisLabel(
  timestamp: number,
  count: number,
  mode: DashboardComposedChartModel['xAxisFormat'],
) {
  if (mode === 'hour') {
    return dateFormat(timestamp, 'HH:00');
  }

  if (mode === 'shortDate') {
    return dateFormat(timestamp, 'MM/dd');
  }

  return count > 365
    ? dateFormat(timestamp, 'yyyy/MM')
    : dateFormat(timestamp, 'MM/dd');
}

function getSeries(
  model:
    | DashboardComposedChartModel
    | DashboardMultiLineChartModel
    | DashboardAreaChartModel,
) {
  if (model.kind === 'composed') {
    return model.series;
  }

  if (model.kind === 'multiline') {
    return model.lines;
  }

  return [model.area];
}

function getChartConfig(
  series: DashboardSeriesDefinition[],
  i18n: ReturnType<typeof useLingui>['i18n'],
) {
  return Object.fromEntries(
    series.flatMap((item) =>
      item.hide
        ? []
        : [
            [
              item.key,
              {
                label: resolveDashboardLabel(item.label, i18n),
                color: item.color,
              },
            ] as const,
          ],
    ),
  );
}

interface DashboardTooltipContentProps {
  active?: boolean;
  payload?: Array<{ payload?: DashboardBaseDatum }>;
  series: DashboardSeriesDefinition[];
  title: string;
  hideZeroValueRows?: boolean;
  sortDetailRowsByValueDesc?: boolean;
  isHourly?: boolean;
}

const DashboardTooltipContent = ({
  active,
  payload,
  series,
  title,
  hideZeroValueRows = false,
  sortDetailRowsByValueDesc = false,
  isHourly = false,
}: DashboardTooltipContentProps) => {
  const { i18n } = useLingui();
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  const tooltipRows = series.filter((item) => {
    if (item.showInTooltip === false) return false;
    return point[item.key] !== undefined;
  });
  const dailyTotalCandidate = tooltipRows.find(
    (item) => item.key === 'dailyTotal',
  );
  const cumulativeCandidate = tooltipRows.find(
    (item) => item.key === 'cumulative',
  );
  const detailRows = tooltipRows.filter(
    (item) => item.key !== 'dailyTotal' && item.key !== 'cumulative',
  );
  const dailyTotalRow =
    dailyTotalCandidate &&
    (!hideZeroValueRows || Number(point[dailyTotalCandidate.key] ?? 0) !== 0)
      ? dailyTotalCandidate
      : undefined;
  const cumulativeRow =
    cumulativeCandidate &&
    (!hideZeroValueRows || Number(point[cumulativeCandidate.key] ?? 0) !== 0)
      ? cumulativeCandidate
      : undefined;
  const visibleDetailRows = hideZeroValueRows
    ? detailRows.filter((item) => Number(point[item.key] ?? 0) !== 0)
    : detailRows;
  const orderedDetailRows = sortDetailRowsByValueDesc
    ? [...visibleDetailRows].sort((left, right) =>
        calc(point[right.key] ?? 0).comparedTo(calc(point[left.key] ?? 0)),
      )
    : visibleDetailRows;
  if (!dailyTotalRow && !cumulativeRow && visibleDetailRows.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-3 relative z-50 flex w-[200px] max-w-[calc(100vw-24px)] flex-col gap-2 rounded-xl p-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-t-270 min-w-0 truncate">{title}</span>
        <span className="text-t-1100 shrink-0">
          {dateFormat(point.timestamp, isHourly ? 'MM/dd HH:00' : 'MM/dd')}
        </span>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        {dailyTotalRow ? (
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-t-270">
              <Trans>Total</Trans>
            </span>
            <span className="text-t-1100 shrink-0 text-right">
              {formatChartValue(
                Number(point[dailyTotalRow.key] ?? 0),
                dailyTotalRow.valueFormat ?? 'currencyCompact',
              )}
            </span>
          </div>
        ) : null}
        {orderedDetailRows.map((item) => {
          const rawValue = Number(point[item.key] ?? 0);
          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex min-w-0 items-center gap-1">
                <span
                  className="size-3.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-t-270 min-w-0 truncate">
                  {resolveDashboardLabel(item.label, i18n)}
                </span>
              </div>
              <span className="text-t-1100 shrink-0 text-right">
                {formatChartValue(
                  rawValue,
                  item.valueFormat ?? 'currencyCompact',
                )}
              </span>
            </div>
          );
        })}
        {cumulativeRow ? (
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex min-w-0 items-center gap-1">
              <span
                className="size-3.5 shrink-0 rounded-sm"
                style={{ backgroundColor: cumulativeRow.color }}
              />
              <span className="text-t-270 min-w-0 truncate">
                {resolveDashboardLabel(cumulativeRow.label, i18n)}
              </span>
            </div>
            <span className="text-t-1100 shrink-0 text-right">
              {formatChartValue(
                Number(point[cumulativeRow.key] ?? 0),
                cumulativeRow.valueFormat ?? 'currencyCompact',
              )}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const DashboardTimeseriesChart = ({
  model,
  chartClassName,
  tooltipTitle,
}: {
  model:
    | DashboardComposedChartModel
    | DashboardMultiLineChartModel
    | DashboardAreaChartModel;
  chartClassName?: string;
  tooltipTitle: string;
}) => {
  const { i18n } = useLingui();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [tooltipResetVersion, setTooltipResetVersion] = useState(0);
  const leftAxisTicksRef = useRef<DashboardAxisTicksState>({
    ticks: new Map(),
    version: 0,
  });
  const rightAxisTicksRef = useRef<DashboardAxisTicksState>({
    ticks: new Map(),
    version: 0,
  });
  const series = useMemo(() => getSeries(model), [model]);
  const chartSeriesKey = useMemo(
    () =>
      series
        .map((item) => `${item.key}:${item.hide ? 'hidden' : 'visible'}`)
        .join('|'),
    [series],
  );
  const chartConfig = useMemo(
    () => getChartConfig(series, i18n),
    [series, i18n],
  );
  const hasLeftAxis = useMemo(
    () => series.some((item) => item.yAxisId === 'left'),
    [series],
  );
  const hasRightAxis = useMemo(
    () => series.some((item) => (item.yAxisId ?? 'right') === 'right'),
    [series],
  );
  const visibleSeries = useMemo(
    () => series.filter((item) => !item.hide),
    [series],
  );
  const hasVisibleLeftSeries = useMemo(
    () => visibleSeries.some((item) => item.yAxisId === 'left'),
    [visibleSeries],
  );
  const hasVisibleRightSeries = useMemo(
    () =>
      visibleSeries.some((item) => (item.yAxisId ?? 'right') === 'right'),
    [visibleSeries],
  );
  const barSeries = useMemo(
    () => visibleSeries.filter((item) => item.type === 'bar'),
    [visibleSeries],
  );
  const hasOnlyBars =
    barSeries.length > 0 && barSeries.length === visibleSeries.length;
  const chartData = useMemo(
    () =>
      hasOnlyBars
        ? model.data.map((row) => ({
            ...row,
            [HOVER_MARKER_DATA_KEY]: barSeries.reduce(
              (sum, item) => sum + Number(row[item.key] ?? 0),
              0,
            ),
          }))
        : model.data,
    [barSeries, hasOnlyBars, model.data],
  );
  const hasNegativeBar = useMemo(
    () =>
      series.some(
        (item) =>
          item.type === 'bar' &&
          model.data.some((row) => Number(row[item.key] ?? 0) < 0),
      ),
    [model.data, series],
  );
  const leftAxisFormat =
    model.kind === 'composed' ? model.leftAxisFormat : model.yAxisFormat;
  const rightAxisFormat =
    model.kind === 'composed'
      ? (model.rightAxisFormat ?? model.leftAxisFormat)
      : model.yAxisFormat;
  const reserveLeftAxisSpace =
    hasLeftAxis &&
    (model.kind === 'composed'
      ? model.showLeftAxis === true || !hasRightAxis
      : !hasRightAxis);
  const showLeftAxis = reserveLeftAxisSpace && hasVisibleLeftSeries;
  const showRightAxis = hasVisibleRightSeries;
  const yAxisWidth = model.yAxisWidth ?? DEFAULT_Y_AXIS_WIDTH;
  const hideZeroValueRowsInTooltip =
    model.kind === 'composed' &&
    model.series.some((item) => item.key === 'netProfit') &&
    model.series.some((item) => item.key === 'netLoss');
  const sortTooltipDetailRowsByValueDesc = model.tooltipOrder === 'valueDesc';
  const visibleAreaSeries = useMemo(
    () => series.filter((item) => item.type === 'area'),
    [series],
  );
  const formatTick = useCallback(
    (value: string | number) =>
      formatXAxisLabel(Number(value), model.data.length, model.xAxisFormat),
    [model.data.length, model.xAxisFormat],
  );
  const renderLeftAxisTick = useCallback(
    (props: DashboardYAxisTickProps) => (
      <DashboardYAxisTick
        {...props}
        valueFormat={leftAxisFormat}
        ticksRef={leftAxisTicksRef}
      />
    ),
    [leftAxisFormat],
  );
  const renderRightAxisTick = useCallback(
    (props: DashboardYAxisTickProps) => (
      <DashboardYAxisTick
        {...props}
        valueFormat={rightAxisFormat}
        ticksRef={rightAxisTicksRef}
      />
    ),
    [rightAxisFormat],
  );
  const resetTooltip = useCallback(() => {
    setTooltipResetVersion((version) => version + 1);
  }, []);

  return (
    <div
      ref={chartContainerRef}
      className={cn(
        DASHBOARD_CHART_HEIGHT_CLASS_NAME,
        chartClassName,
        'relative overflow-visible',
      )}
    >
      <ChartContainer
        config={chartConfig}
        className="h-full w-full !aspect-auto overflow-visible"
      >
        <ComposedChart
          key={`${chartSeriesKey}:${tooltipResetVersion}`}
          data={chartData}
          margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            {visibleAreaSeries.map((item) => (
              <linearGradient
                key={item.key}
                id={`gradient-${item.key}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={item.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            vertical
            horizontal={false}
            stroke="rgba(88,103,149,0.12)"
          />
          <XAxis
            dataKey="timestamp"
            axisLine={false}
            tickLine={false}
            minTickGap={24}
            tickMargin={10}
            tickFormatter={formatTick}
          />
          {hasLeftAxis ? (
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={reserveLeftAxisSpace ? yAxisWidth : 0}
              domain={['auto', 'auto']}
              tick={showLeftAxis ? renderLeftAxisTick : false}
            />
          ) : null}
          {hasRightAxis ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={yAxisWidth}
              domain={['auto', 'auto']}
              tick={showRightAxis ? renderRightAxisTick : false}
            />
          ) : null}
          {hasNegativeBar ? (
            <ReferenceLine
              y={0}
              stroke="rgba(88,103,149,0.2)"
              ifOverflow="extendDomain"
            />
          ) : null}

          {series.map((item) => {
            if (item.type === 'bar') {
              return (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  fill={item.color}
                  stackId={item.stackId}
                  yAxisId={item.yAxisId ?? 'right'}
                  hide={item.hide}
                  isAnimationActive={false}
                  maxBarSize={12}
                />
              );
            }

            if (item.type === 'area') {
              return (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  yAxisId={item.yAxisId ?? 'right'}
                  stroke={item.color}
                  strokeWidth={item.strokeWidth ?? 2}
                  fill={`url(#gradient-${item.key})`}
                  fillOpacity={item.fillOpacity ?? 1}
                  hide={item.hide}
                  isAnimationActive={false}
                  activeDot={false}
                />
              );
            }

            return (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                yAxisId={item.yAxisId ?? 'right'}
                stroke={item.color}
                strokeWidth={item.strokeWidth ?? 2}
                dot={item.dot ?? false}
                activeDot={false}
                hide={item.hide}
                strokeDasharray={item.dashed ? '4 4' : undefined}
                isAnimationActive={false}
              />
            );
          })}
          <ChartTooltip
            cursor={false}
            wrapperStyle={{ zIndex: 20, pointerEvents: 'none' }}
            content={
              <DashboardTooltipContent
                series={series}
                title={tooltipTitle}
                hideZeroValueRows={hideZeroValueRowsInTooltip}
                sortDetailRowsByValueDesc={sortTooltipDetailRowsByValueDesc}
                isHourly={model.xAxisFormat === 'hour'}
              />
            }
          />
        </ComposedChart>
      </ChartContainer>
      <DashboardCrosshairOverlay
        containerRef={chartContainerRef}
        leftAxisTicksRef={leftAxisTicksRef}
        leftAxisValueFormat={leftAxisFormat}
        rightAxisTicksRef={rightAxisTicksRef}
        rightAxisValueFormat={rightAxisFormat}
        showLeftAxisLabel={showLeftAxis}
        showRightAxisLabel={showRightAxis}
        onOutsidePointerDown={resetTooltip}
      />
    </div>
  );
};

interface TopUsersRowProps {
  rows: DashboardTopUsersRow[];
}

const TopUsersRowItem = ({
  index,
  style,
  rows,
  ariaAttributes,
}: RowComponentProps<TopUsersRowProps>) => {
  const row = rows[index]!;
  const hzSdk = useHzSdk();
  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : '';
  const href =
    explorerHost && row.address
      ? `${explorerHost}/address/${row.address}`
      : undefined;
  const addressLabel = formatAddress(row.address);

  return (
    <div style={style} {...ariaAttributes}>
      <div
        className={`hover:bg-bg-3 ${TOP_USERS_GRID_CLASS} items-center gap-3 rounded-xl p-2 transition-[background]`}
      >
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-t-1100 hover:text-t-1100/80 min-w-0 text-xs hover:underline"
          >
            {addressLabel}
          </a>
        ) : (
          <span className="text-t-1100 min-w-0 text-xs">{addressLabel}</span>
        )}
        <span className="text-t-1100 text-right text-xs whitespace-nowrap">
          {formatChartValue(row.tradingVolume, 'currencyCompact')}
        </span>
        <span
          className={`text-right text-xs whitespace-nowrap ${
            row.netPnlPercent === 0
              ? 'text-t-430'
              : row.netPnlPercent > 0
                ? 'text-up'
                : 'text-down'
          }`}
        >
          {percentFormat(row.netPnlPercent, 2, {
            stripTrailingZeros: true,
            showMinDecimalValue: true,
            signDisplay: 'always',
          })}
        </span>
      </div>
    </div>
  );
};

const DashboardTopUsersTable = ({ model }: { model: DashboardTableModel }) => {
  const { i18n } = useLingui();
  const [listApi, setListApi] = useListCallbackRef();
  const { showBShadow, handleScroll, updateBShadow } = useShowBShadow(
    listApi?.element ?? undefined,
  );

  useEffect(() => {
    const frame = requestAnimationFrame(updateBShadow);
    return () => cancelAnimationFrame(frame);
  }, [model.rows.length, updateBShadow]);

  return (
    <div className={cn(TABLE_CLASS_NAME, 'relative overflow-hidden')}>
      <div className={`${TOP_USERS_GRID_CLASS} gap-3 border-b px-3 pb-3`}>
        {model.columns.map((column) => (
          <span
            key={column.key}
            className={`text-t-270 text-xs ${
              column.key === 'address'
                ? 'min-w-0'
                : column.key === 'tradingVolume'
                  ? 'text-right whitespace-nowrap'
                  : 'text-right whitespace-nowrap'
            } ${column.align === 'right' ? 'text-right' : ''}`}
          >
            {resolveDashboardLabel(column.label, i18n)}
          </span>
        ))}
      </div>
      <div className="h-[calc(100%-27px)] pt-2">
        <VirtualList
          className="scrollbar-none h-full"
          listRef={setListApi}
          onScroll={handleScroll}
          rowComponent={TopUsersRowItem}
          rowCount={model.rows.length}
          rowHeight={TOP_USERS_ROW_HEIGHT}
          rowProps={{ rows: model.rows }}
        />
      </div>
      {showBShadow && (
        <div className="to-bg-card-mix pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-b from-transparent" />
      )}
    </div>
  );
};

export const DashboardChartRenderer = memo(
  ({
    model,
    chartClassName,
    tooltipTitle,
  }: {
    model: DashboardPresenterModel;
    chartClassName?: string;
    tooltipTitle: string;
  }) => {
    if (model.kind === 'table') {
      return <DashboardTopUsersTable model={model} />;
    }

    return (
      <DashboardTimeseriesChart
        model={model}
        chartClassName={chartClassName}
        tooltipTitle={tooltipTitle}
      />
    );
  },
);

DashboardChartRenderer.displayName = 'DashboardChartRenderer';
