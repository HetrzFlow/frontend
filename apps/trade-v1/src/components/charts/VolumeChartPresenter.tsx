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
import { dateFormat, unitFormat, truncateFormat } from '@repo/lib/format';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  cn,
  Loading,
} from '@repo/ui';
import { useGlobalStore } from '@/common';
import { useDashboardDateRange } from '@/hooks/useDashboardDateRange';

export interface VolumeChartData {
  date: string;
  timestamp: number;
  swap: number;
  mintHzlp: number;
  burnHzlp: number;
  trading: number;
  cumulative: number;
}

interface VolumeChartPresenterProps {
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

export const VolumeChartPresenter = memo(
  ({
    data,
    isLoading,
    error,
    className,
    height = 400,
  }: VolumeChartPresenterProps) => {
    const { t } = useLingui();
    const { fromTimestamp, toTimestamp } = useDashboardDateRange();
    const usdAmountDisplayDecimal = useGlobalStore(
      (state) => state.usdAmountDisplayDecimal,
    );

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
          className={`${cn('text-destructive flex items-center justify-center', className)}`}
          style={{ height }}
        >
          {t`Failed to load volume data`}: {error.message}
        </div>
      );
    }

    const generateDefaultData = (): VolumeChartData[] => {
      if (!fromTimestamp || !toTimestamp) {
        return [];
      }

      const defaultData: VolumeChartData[] = [];
      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day

      for (let time = fromTimestamp; time <= toTimestamp; time += oneDay) {
        const date = dateFormat(time, 'yyyy-MM-dd');

        defaultData.push({
          date,
          timestamp: time,
          swap: 0,
          mintHzlp: 0,
          burnHzlp: 0,
          trading: 0,
          cumulative: 0,
        });
      }

      return defaultData;
    };

    const defaultData = generateDefaultData();

    const chartData = data && data.length > 0 ? data : defaultData;

    return (
      <ChartContainer
        config={chartConfig}
        className={`${cn('aspect-auto w-full', className)}`}
        style={{ height }}
      >
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => dateFormat(value, 'MM/dd')}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            tickFormatter={(value) => {
              return unitFormat(value, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              });
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) =>
              unitFormat(value, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })
            }
          />
          <ChartTooltip
            labelFormatter={(value) => dateFormat(value, 'yyyy-MM-dd')}
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
                <div className="bg-background rounded-lg border p-3 shadow-md">
                  <p className="mb-2 font-medium">
                    {dateFormat(label ?? '', 'yyyy-MM-dd')}
                  </p>
                  <div className="mb-2 border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">TOTAL:</span>
                      <span className="font-semibold">
                        {unitFormat(totalVolume, usdAmountDisplayDecimal, {
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
                          style={{
                            backgroundColor: chartConfig.swap.color,
                          }}
                        />
                        <span>Swap:</span>
                      </div>
                      <span>
                        {truncateFormat(
                          swapVolume as number,
                          usdAmountDisplayDecimal,
                          {
                            style: 'currency',
                            currency: 'USD',
                          },
                        )}
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
                        {unitFormat(
                          mintVolume as number,
                          usdAmountDisplayDecimal,
                          {
                            style: 'currency',
                            currency: 'USD',
                          },
                        )}
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
                        {unitFormat(
                          burnVolume as number,
                          usdAmountDisplayDecimal,
                          {
                            style: 'currency',
                            currency: 'USD',
                          },
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{
                            backgroundColor: chartConfig.trading.color,
                          }}
                        />
                        <span>Perps Trading:</span>
                      </div>
                      <span>
                        {unitFormat(
                          tradingVolume as number,
                          usdAmountDisplayDecimal,
                          {
                            style: 'currency',
                            currency: 'USD',
                          },
                        )}
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
                        <span>Cumulative:</span>
                      </div>
                      <span className="font-semibold">
                        {unitFormat(
                          cumulativeVolume as number,
                          usdAmountDisplayDecimal,
                          {
                            style: 'currency',
                            currency: 'USD',
                          },
                        )}
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
            fill={chartConfig.swap.color}
            name="swap"
            stackId="volume"
          />
          <Bar
            yAxisId="left"
            dataKey="mintHzlp"
            fill={chartConfig.mintHzlp.color}
            name="mintHzlp"
            stackId="volume"
          />
          <Bar
            yAxisId="left"
            dataKey="burnHzlp"
            fill={chartConfig.burnHzlp.color}
            name="burnHzlp"
            stackId="volume"
          />
          <Bar
            yAxisId="left"
            dataKey="trading"
            fill={chartConfig.trading.color}
            name="trading"
            stackId="volume"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke={chartConfig.cumulative.color}
            strokeWidth={2}
            dot={false}
            name="cumulative"
          />
        </ComposedChart>
      </ChartContainer>
    );
  },
);

VolumeChartPresenter.displayName = 'VolumeChartPresenter';
