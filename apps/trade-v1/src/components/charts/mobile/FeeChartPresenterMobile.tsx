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
import type { FeeChartData } from '../FeeChartPresenter';

interface FeeChartPresenterMobileProps {
  data: FeeChartData[];
  isLoading: boolean;
  error?: Error | null;
  className?: string;
  height?: number;
}

const chartConfig = {
  swapFee: {
    label: 'Swap Fee',
    color: 'var(--color-dashboard-swap-fee)',
  },
  mintHzlpFee: {
    label: 'Mint HzLP Fee',
    color: 'var(--color-dashboard-mint-hzlp)',
  },
  burnHzlpFee: {
    label: 'Burn HzLP Fee',
    color: 'var(--color-dashboard-burn-hzlp)',
  },
  tradingFee: {
    label: 'Trading Fee',
    color: 'var(--color-dashboard-trading)',
  },
  borrowFee: {
    label: 'Borrow Fee',
    color: 'var(--color-dashboard-borrow)',
  },
  liquidateFee: {
    label: 'Liquidate Fee',
    color: 'var(--color-dashboard-liquidate)',
  },
  cumulative: {
    label: 'Cumulative',
    color: 'var(--color-dashboard-cumulative)',
  },
} satisfies ChartConfig;

export const FeeChartPresenterMobile = memo(
  ({
    data,
    isLoading,
    error,
    className,
    height = 210,
  }: FeeChartPresenterMobileProps) => {
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
          {t`Failed to load fee data`}
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
            position={{ y: -60 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) {
                return null;
              }

              const swapFee =
                payload.find((p) => p.dataKey === 'swapFee')?.value ?? 0;
              const mintHzlpFee =
                payload.find((p) => p.dataKey === 'mintHzlpFee')?.value ?? 0;
              const burnHzlpFee =
                payload.find((p) => p.dataKey === 'burnHzlpFee')?.value ?? 0;
              const tradingFee =
                payload.find((p) => p.dataKey === 'tradingFee')?.value ?? 0;
              const borrowFee =
                payload.find((p) => p.dataKey === 'borrowFee')?.value ?? 0;
              const liquidateFee =
                payload.find((p) => p.dataKey === 'liquidateFee')?.value ?? 0;
              const cumulativeFee =
                payload.find((p) => p.dataKey === 'cumulative')?.value ?? 0;

              const totalFee =
                (swapFee as number) +
                (mintHzlpFee as number) +
                (burnHzlpFee as number) +
                (tradingFee as number) +
                (borrowFee as number) +
                (liquidateFee as number);

              return (
                <div className="bg-popover text-popover-foreground max-w-[280px] rounded-md p-2 text-xs shadow-md">
                  <div className="mb-2 font-medium">
                    {dateFormat(label ?? '', 'yyyy-MM-dd')}
                  </div>
                  <div className="mb-2 border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">TOTAL:</span>
                      <span className="font-semibold">
                        {unitFormat(totalFee, 1, {
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
                          style={{ backgroundColor: chartConfig.swapFee.color }}
                        />
                        <span>Swap Fee:</span>
                      </div>
                      <span>
                        {unitFormat(swapFee as number, 1, {
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
                            backgroundColor: chartConfig.mintHzlpFee.color,
                          }}
                        />
                        <span>Mint HzLP Fee:</span>
                      </div>
                      <span>
                        {unitFormat(mintHzlpFee as number, 1, {
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
                            backgroundColor: chartConfig.burnHzlpFee.color,
                          }}
                        />
                        <span>Burn HzLP Fee:</span>
                      </div>
                      <span>
                        {unitFormat(burnHzlpFee as number, 1, {
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
                            backgroundColor: chartConfig.tradingFee.color,
                          }}
                        />
                        <span>Trading Fee:</span>
                      </div>
                      <span>
                        {unitFormat(tradingFee as number, 1, {
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
                            backgroundColor: chartConfig.borrowFee.color,
                          }}
                        />
                        <span>Borrow Fee:</span>
                      </div>
                      <span>
                        {unitFormat(borrowFee as number, 1, {
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
                            backgroundColor: chartConfig.liquidateFee.color,
                          }}
                        />
                        <span>Liquidate Fee:</span>
                      </div>
                      <span>
                        {unitFormat(liquidateFee as number, 1, {
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
                        {unitFormat(cumulativeFee as number, 1, {
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
            dataKey="swapFee"
            stackId="fee"
            fill="var(--color-dashboard-swap-fee)"
          />
          <Bar
            yAxisId="left"
            dataKey="mintHzlpFee"
            stackId="fee"
            fill="var(--color-dashboard-mint-hzlp)"
          />
          <Bar
            yAxisId="left"
            dataKey="burnHzlpFee"
            stackId="fee"
            fill="var(--color-dashboard-burn-hzlp)"
          />
          <Bar
            yAxisId="left"
            dataKey="tradingFee"
            stackId="fee"
            fill="var(--color-dashboard-trading)"
          />
          <Bar
            yAxisId="left"
            dataKey="borrowFee"
            stackId="fee"
            fill="var(--color-dashboard-borrow)"
          />
          <Bar
            yAxisId="left"
            dataKey="liquidateFee"
            stackId="fee"
            fill="var(--color-dashboard-liquidate)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="var(--color-dashboard-cumulative)"
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ChartContainer>
    );
  },
);

FeeChartPresenterMobile.displayName = 'FeeChartPresenterMobile';
