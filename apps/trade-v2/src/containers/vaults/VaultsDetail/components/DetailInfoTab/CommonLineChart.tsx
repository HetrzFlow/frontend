'use client';

import { FC, memo, useEffect, useMemo, useRef } from 'react';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { dateFormat, percentFormat } from '@repo/lib/format';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  MEDIA_SIZES,
  useMediaQuery,
} from '@repo/ui';
import {
  buildChartData,
  buildXTicks,
  buildYAxisTicks,
  DAY_MS,
  getChartDomain,
  normalizePeriod,
} from './CommonLineChart.utils';
import type { ChartPoint, PeriodLike } from './CommonLineChart.utils';

const chartConfig = {
  value: {
    color: 'var(--accent)',
  },
} satisfies ChartConfig;

const USD_DIVISOR = 10 ** USD_DECIMALS;
const currencyValueFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type AxisTickProps = {
  x?: number;
  y?: number;
  payload?: {
    value: number | string;
  };
};

interface LineChartProps {
  data: Array<ChartPoint>;
  title: string;
  valueType: 'currency' | 'percent';
  period?: PeriodLike;
  className?: string;
  animateOnMount?: boolean;
}

function formatYAxisCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${Math.round(value)}`;
}

function formatXAxisLabel(
  timestamp: number,
  period: PeriodLike | undefined,
  totalDays: number,
) {
  const normalized = normalizePeriod(period);
  if (normalized.includes('ALL')) {
    if (totalDays >= 365 * 2) return dateFormat(timestamp, 'yyyy');
    if (totalDays >= 365) return dateFormat(timestamp, 'yyyy/MM');
  }
  return dateFormat(timestamp, 'MM/dd');
}

function renderXAxisTick(
  props: AxisTickProps,
  period: PeriodLike | undefined,
  totalDays: number,
) {
  const { x = 0, y = 0, payload } = props;
  const label = formatXAxisLabel(Number(payload?.value), period, totalDays);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="currentColor"
      className="text-t-430 font-plex hidden md:block"
      fontSize={10}
    >
      {label}
    </text>
  );
}

function renderYAxisTick(
  props: AxisTickProps,
  valueType: 'currency' | 'percent',
) {
  const { x = 0, y = 0, payload } = props;
  const value = Number(payload?.value);
  const label =
    valueType === 'currency'
      ? formatYAxisCurrency(value)
      : percentFormat(value, 2, {
          stripTrailingZeros: true,
        });

  return (
    <text
      x={x - 8}
      y={y}
      textAnchor="end"
      dominantBaseline="middle"
      fill="currentColor"
      className="text-t-430 font-plex hidden md:block"
      fontSize={10}
    >
      {label}
    </text>
  );
}

const CommonLineChart: FC<LineChartProps> = ({
  data,
  title,
  valueType,
  period,
  className,
  animateOnMount = false,
}) => {
  const hasMountedRef = useRef(false);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  const isAnimationActive = animateOnMount
    ? !hasMountedRef.current
    : undefined;
  const chartData = useMemo(
    () => buildChartData(data, valueType, period, USD_DIVISOR),
    [data, period, valueType],
  );

  const timestamps = useMemo(
    () => chartData.map((item) => item.timestamp),
    [chartData],
  );
  const chartDomain = useMemo(
    () => getChartDomain(timestamps, period),
    [timestamps, period],
  );
  const totalDays = useMemo(() => {
    if (!chartDomain) return 1;
    return Math.max(
      1,
      Math.round((chartDomain.end - chartDomain.start) / DAY_MS),
    );
  }, [chartDomain]);
  const xTicks = useMemo(() => {
    if (!chartDomain) return [];
    if (timestamps.length === 1) return [timestamps[0]!];
    return buildXTicks(chartDomain.start, chartDomain.end, period, totalDays);
  }, [chartDomain, period, timestamps, totalDays]);
  const yValues = useMemo(() => {
    const values: number[] = [];

    for (const item of chartData) {
      if (item.chartValue !== null) values.push(item.chartValue);
    }

    return values;
  }, [chartData]);
  const visiblePointCount = yValues.length;
  const yTicks = useMemo(
    () => buildYAxisTicks(yValues, valueType),
    [valueType, yValues],
  );
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const yMin = yTicks[0] ?? 0;
  const yMax = yTicks[yTicks.length - 1] ?? 1;
  const xAxisTick = (props: unknown) => {
    const tickProps = props as AxisTickProps;

    return renderXAxisTick(tickProps, period, totalDays);
  };
  const yAxisTick = isMobile
    ? false
    : (props: unknown) => renderYAxisTick(props as AxisTickProps, valueType);

  return (
    <ChartContainer config={chartConfig} className={className}>
      <ComposedChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: isMobile ? 4 : 14,
          right: isMobile ? 4 : 20,
          top: 6,
          bottom: isMobile ? 4 : 0,
        }}
      >
        <CartesianGrid
          horizontal={false}
          vertical
          stroke="var(--border)"
          strokeOpacity={0.72}
          strokeDasharray="0"
        />
        <ChartTooltip
          cursor={{
            stroke: 'var(--t-350)',
            strokeDasharray: '2 2',
            strokeWidth: 1,
            style: { stroke: 'var(--t-350)' },
          }}
          content={(props) => (
            <ChartTooltipContent
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...(props as any)}
              labelClassName="text-t-430 text-xs font-normal"
              labelFormatter={(_, payload) => {
                return dateFormat(payload[0]?.payload.timestamp, 'yyyy/MM/dd');
              }}
              formatter={(value) => {
                const numericValue = Number(value);
                if (!Number.isFinite(numericValue)) {
                  return (
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="text-sm">{title} --</span>
                    </div>
                  );
                }
                if (valueType === 'percent') {
                  return (
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="text-sm">
                        {title}{' '}
                        {percentFormat(numericValue, 2, {
                          showMinDecimalValue: true,
                          stripTrailingZeros: true,
                        })}
                      </span>
                    </div>
                  );
                }
                if (valueType === 'currency') {
                  return (
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="text-sm">
                        {title} {currencyValueFormatter.format(numericValue)}
                      </span>
                    </div>
                  );
                }
              }}
            />
          )}
        />
        <XAxis
          type="number"
          dataKey="timestamp"
          domain={
            chartDomain
              ? [chartDomain.start, chartDomain.end]
              : ['dataMin', 'dataMax']
          }
          ticks={xTicks}
          interval={0}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
          height={isMobile ? 5 : undefined}
          minTickGap={12}
          tickMargin={isMobile ? 0 : 12}
          tick={xAxisTick}
        />
        <YAxis
          type="number"
          domain={[yMin, yMax]}
          ticks={yTicks}
          interval={0}
          tickLine={false}
          axisLine={false}
          width={isMobile ? 0 : 62}
          tickMargin={isMobile ? 0 : 6}
          tick={yAxisTick}
        />
        <defs>
          <linearGradient id="fillContent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.36} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          dataKey="chartValue"
          type="linear"
          stroke="none"
          fill="url(#fillContent)"
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="chartValue"
          type="linear"
          stroke={chartConfig.value.color}
          strokeWidth={2}
          isAnimationActive={isAnimationActive}
          connectNulls={false}
          dot={
            visiblePointCount === 1
              ? {
                  r: 3,
                  fill: chartConfig.value.color,
                  stroke: chartConfig.value.color,
                  strokeWidth: 0,
                }
              : false
          }
          activeDot={{
            r: 4,
            fill: chartConfig.value.color,
            stroke: chartConfig.value.color,
            strokeWidth: 0,
          }}
        />
      </ComposedChart>
    </ChartContainer>
  );
};

export default memo(CommonLineChart);
