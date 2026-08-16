'use client';

import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dateFormat, unitFormat } from '@repo/lib/format';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  cn,
  Loading,
} from '@repo/ui';
import { useGlobalStore } from '@/common';
import { useDashboardDateRange } from '@/hooks/useDashboardDateRange';

export interface OpenInterestChartData {
  date: string;
  timestamp: number;
  longValue: number;
  shortValue: number;
}

interface OpenInterestChartPresenterProps {
  data: OpenInterestChartData[];
  isLoading: boolean;
  error?: Error | null;
  className?: string;
  height?: number;
}

const chartConfig = {
  longValue: {
    label: 'Long',
    color: 'var(--color-up)',
  },
  shortValue: {
    label: 'Short',
    color: 'var(--color-down)',
  },
} satisfies ChartConfig;

export const OpenInterestChartPresenter = memo(
  ({
    data,
    isLoading,
    error,
    className,
    height = 400,
  }: OpenInterestChartPresenterProps) => {
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
          {t`Failed to load open interest data`}: {error.message}
        </div>
      );
    }

    const generateDefaultData = (): OpenInterestChartData[] => {
      if (!fromTimestamp || !toTimestamp) {
        return [];
      }

      const defaultData: OpenInterestChartData[] = [];
      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day

      for (let time = fromTimestamp; time <= toTimestamp; time += oneDay) {
        const date = dateFormat(time, 'yyyy-MM-dd');

        defaultData.push({
          date,
          timestamp: time,
          longValue: 0,
          shortValue: 0,
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
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => dateFormat(value, 'MM/dd')}
          />
          <YAxis
            tickFormatter={(value) => {
              return unitFormat(value, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              });
            }}
          />
          <ChartTooltip
            labelFormatter={(value) => dateFormat(value, 'yyyy-MM-dd')}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) {
                return null;
              }

              const longValue =
                payload.find((p) => p.dataKey === 'longValue')?.value ?? 0;
              const shortValue =
                payload.find((p) => p.dataKey === 'shortValue')?.value ?? 0;

              const totalValue = (longValue as number) + (shortValue as number);

              return (
                <div className="bg-background rounded-lg border p-3 shadow-md">
                  <p className="mb-2 font-medium">
                    {dateFormat(label ?? '', 'yyyy-MM-dd')}
                  </p>
                  <div className="mb-2 border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">TOTAL:</span>
                      <span className="font-semibold">
                        {unitFormat(totalValue, usdAmountDisplayDecimal, {
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
                            backgroundColor: chartConfig.longValue.color,
                          }}
                        />
                        <span>Long:</span>
                      </div>
                      <span>
                        {unitFormat(
                          longValue as number,
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
                            backgroundColor: chartConfig.shortValue.color,
                          }}
                        />
                        <span>Short:</span>
                      </div>
                      <span>
                        {unitFormat(
                          shortValue as number,
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
            stackId="openInterest"
            dataKey="shortValue"
            fill={chartConfig.shortValue.color}
            name="shortValue"
          />
          <Bar
            stackId="openInterest"
            dataKey="longValue"
            fill={chartConfig.longValue.color}
            name="longValue"
          />
        </BarChart>
      </ChartContainer>
    );
  },
);

OpenInterestChartPresenter.displayName = 'OpenInterestChartPresenter';
