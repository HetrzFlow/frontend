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
import type { UsersChartData } from '../UsersChartPresenter';

interface UsersChartPresenterMobileProps {
  data: UsersChartData[];
  isLoading: boolean;
  error?: Error | null;
  className?: string;
  height?: number;
}

const chartConfig = {
  swapUsers: {
    label: 'Swap Users',
    color: 'var(--color-dashboard-swap-users)',
  },
  tradingUsers: {
    label: 'Trading Users',
    color: 'var(--color-dashboard-trading-users)',
  },
  mintBurnUsers: {
    label: 'Mint&Burn Users',
    color: 'var(--color-dashboard-mint-burn-users)',
  },
  cumulativeUsers: {
    label: 'Cumulative Users',
    color: 'var(--color-dashboard-cumulative-users)',
  },
} satisfies ChartConfig;

export const UsersChartPresenterMobile = memo(
  ({
    data,
    isLoading,
    error,
    className,
    height = 210,
  }: UsersChartPresenterMobileProps) => {
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
          {t`Failed to load users data`}
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
            tickFormatter={(value) => unitFormat(value, 0)}
            fontSize={10}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => unitFormat(value, 0)}
            fontSize={10}
          />
          <ChartTooltip
            labelFormatter={(value) => dateFormat(value, 'MM/dd')}
            position={{ y: -40 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) {
                return null;
              }

              const swapUsers =
                payload.find((p) => p.dataKey === 'swapUsers')?.value ?? 0;
              const tradingUsers =
                payload.find((p) => p.dataKey === 'tradingUsers')?.value ?? 0;
              const mintBurnUsers =
                payload.find((p) => p.dataKey === 'mintBurnUsers')?.value ?? 0;
              const cumulativeUsers =
                payload.find((p) => p.dataKey === 'cumulativeUsers')?.value ??
                0;

              const totalActiveUsers =
                (swapUsers as number) +
                (tradingUsers as number) +
                (mintBurnUsers as number);

              return (
                <div className="bg-popover text-popover-foreground max-w-[280px] rounded-md p-2 text-xs shadow-md">
                  <div className="mb-2 font-medium">
                    {dateFormat(label ?? '', 'yyyy-MM-dd')}
                  </div>
                  <div className="mb-2 border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">TOTAL:</span>
                      <span className="font-semibold">
                        {unitFormat(totalActiveUsers, 0, {
                          style: 'decimal',
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
                            backgroundColor: chartConfig.swapUsers.color,
                          }}
                        />
                        <span>Swap Users:</span>
                      </div>
                      <span>
                        {unitFormat(swapUsers as number, 0, {
                          style: 'decimal',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{
                            backgroundColor: chartConfig.tradingUsers.color,
                          }}
                        />
                        <span>Trading Users:</span>
                      </div>
                      <span>
                        {unitFormat(tradingUsers as number, 0, {
                          style: 'decimal',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{
                            backgroundColor: chartConfig.mintBurnUsers.color,
                          }}
                        />
                        <span>Mint&Burn Users:</span>
                      </div>
                      <span>
                        {unitFormat(mintBurnUsers as number, 0, {
                          style: 'decimal',
                        })}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{
                            backgroundColor: chartConfig.cumulativeUsers.color,
                          }}
                        />
                        <span className="font-semibold">Cumulative Users:</span>
                      </div>
                      <span className="font-semibold">
                        {unitFormat(cumulativeUsers as number, 0, {
                          style: 'decimal',
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
            stackId="users"
            dataKey="swapUsers"
            fill={chartConfig.swapUsers.color}
            name="swapUsers"
          />
          <Bar
            yAxisId="left"
            stackId="users"
            dataKey="tradingUsers"
            fill={chartConfig.tradingUsers.color}
            name="tradingUsers"
          />
          <Bar
            yAxisId="left"
            stackId="users"
            dataKey="mintBurnUsers"
            fill={chartConfig.mintBurnUsers.color}
            name="mintBurnUsers"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativeUsers"
            stroke={chartConfig.cumulativeUsers.color}
            strokeWidth={1.5}
            dot={false}
            name="cumulativeUsers"
          />
        </ComposedChart>
      </ChartContainer>
    );
  },
);

UsersChartPresenterMobile.displayName = 'UsersChartPresenterMobile';
