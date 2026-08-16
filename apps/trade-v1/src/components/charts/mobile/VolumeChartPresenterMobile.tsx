'use client';

import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { dateFormat, unitFormat } from '@repo/lib/format';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  cn,
  Loading,
} from '@repo/ui';
import { useDashboardDateRange } from '@/hooks/useDashboardDateRange';
import type { VolumeChartData } from '../VolumeChartPresenter';

interface VolumeChartPresenterMobileProps {
  data: VolumeChartData[];
  isLoading: boolean;
  error?: Error | null;
  className?: string;
  height?: number;
}

const chartConfig = {
  swap: {
    label: 'Swap',
    color: 'var(--color-dashboard-swap-volume)',
  },
  mintHzlp: {
    label: 'Mint HzLP',
    color: 'var(--color-dashboard-mint-hzlp-volume)',
  },
  burnHzlp: {
    label: 'Burn HzLP',
    color: 'var(--color-dashboard-burn-hzlp-volume)',
  },
  trading: {
    label: 'Trading',
    color: 'var(--color-dashboard-trading-volume)',
  },
  cumulative: {
    label: 'Cumulative',
    color: 'var(--color-dashboard-cumulative-volume)',
  },
} satisfies ChartConfig;

export const VolumeChartPresenterMobile = memo(
  ({
    data,
    isLoading,
    error,
    className,
    height = 210,
  }: VolumeChartPresenterMobileProps) => {
    const { t } = useLingui();
    const { fromTimestamp, toTimestamp } = useDashboardDateRange();

    if (isLoading) {
      return (
        <div
          className={`${cn('flex items-center justify-center', className)}`}
          style={{ height }}
        >
          <Loading />
        </div>
      );
    }

    if (error) {
      return (
        <div
          className={`${cn('text-destructive flex items-center justify-center text-xs', className)}`}
          style={{ height }}
        >
          {t`Failed to load volume data`}
        </div>
      );
    }

    const filteredData = data.filter(
      (item) =>
        fromTimestamp &&
        toTimestamp &&
        item.timestamp >= fromTimestamp &&
        item.timestamp <= toTimestamp,
    );

    const chartData = filteredData.map((item) => ({
      ...item,
      date: item.timestamp,
    }));

    return (
      <ChartContainer
        config={chartConfig}
        className={`${cn('aspect-auto w-full', className)}`}
        style={{ height }}
      >
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => dateFormat(value, 'MM/dd')}
            fontSize={10}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            tickFormatter={(value) =>
              unitFormat(value, 1, {
                style: 'currency',
                currency: 'USD',
              })
            }
            fontSize={10}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) =>
              unitFormat(value, 1, {
                style: 'currency',
                currency: 'USD',
              })
            }
            fontSize={10}
          />
          <ChartTooltip
            labelFormatter={(value) => dateFormat(value, 'MM/dd')}
            position={{ y: -40 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) {
                return null;
              }

              const swapVolume =
                payload.find((p) => p.dataKey === 'swap')?.value ?? 0;
              const mintVolume =
                payload.find((p) => p.dataKey === 'mintHzlp')?.value ?? 0;
              const burnVolume =
                payload.find((p) => p.dataKey === 'burnHzlp')?.value ?? 0;
              const tradingVolume =
                payload.find((p) => p.dataKey === 'trading')?.value ?? 0;
              const cumulativeVolume =
                payload.find((p) => p.dataKey === 'cumulative')?.value ?? 0;

              const totalVolume =
                (swapVolume as number) +
                (mintVolume as number) +
                (burnVolume as number) +
                (tradingVolume as number);

              return (
                <div className="bg-popover text-popover-foreground max-w-[280px] rounded-md p-2 text-xs shadow-md">
                  <div className="mb-2 font-medium">
                    {dateFormat(label ?? '', 'yyyy-MM-dd')}
                  </div>
                  <div className="mb-2 border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">TOTAL:</span>
                      <span className="font-semibold">
                        {unitFormat(totalVolume, 1, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: chartConfig.swap.color }}
                        />
                        <span>Swap:</span>
                      </div>
                      <span>
                        {unitFormat(swapVolume as number, 1, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{
                            backgroundColor: chartConfig.mintHzlp.color,
                          }}
                        />
                        <span>Mint HzLP:</span>
                      </div>
                      <span>
                        {unitFormat(mintVolume as number, 1, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{
                            backgroundColor: chartConfig.burnHzlp.color,
                          }}
                        />
                        <span>Burn HzLP:</span>
                      </div>
                      <span>
                        {unitFormat(burnVolume as number, 1, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: chartConfig.trading.color }}
                        />
                        <span>Trading:</span>
                      </div>
                      <span>
                        {unitFormat(tradingVolume as number, 1, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{
                            backgroundColor: chartConfig.cumulative.color,
                          }}
                        />
                        <span className="font-semibold">Cumulative:</span>
                      </div>
                      <span className="font-semibold">
                        {unitFormat(cumulativeVolume as number, 1, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="swap"
            stackId="volume"
            fill="var(--color-dashboard-swap-volume)"
          />
          <Bar
            yAxisId="left"
            dataKey="mintHzlp"
            stackId="volume"
            fill="var(--color-dashboard-mint-hzlp-volume)"
          />
          <Bar
            yAxisId="left"
            dataKey="burnHzlp"
            stackId="volume"
            fill="var(--color-dashboard-burn-hzlp-volume)"
          />
          <Bar
            yAxisId="left"
            dataKey="trading"
            stackId="volume"
            fill="var(--color-dashboard-trading-volume)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="var(--color-dashboard-cumulative-volume)"
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ChartContainer>
    );
  },
);

VolumeChartPresenterMobile.displayName = 'VolumeChartPresenterMobile';
