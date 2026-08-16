'use client';

import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
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

export interface HzlpUtilizationChartData {
  date: string;
  timestamp: number;
  utilizationRate: number;
}

interface HzlpUtilizationChartPresenterProps {
  data: HzlpUtilizationChartData[];
  isLoading: boolean;
  error?: Error | null;
  className?: string;
  height?: number;
}

const chartConfig = {
  utilizationRate: {
    label: 'Reserved USD',
    color: 'var(--color-dashboard-utilization-rate)',
  },
} satisfies ChartConfig;

export const HzlpUtilizationChartPresenter = memo(
  ({
    data,
    isLoading,
    error,
    className,
    height = 400,
  }: HzlpUtilizationChartPresenterProps) => {
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
          className={`${cn(
            'text-destructive flex items-center justify-center',
            className,
          )}`}
          style={{ height }}
        >
          {t`Failed to load HzLP utilization data`}: {error.message}
        </div>
      );
    }

    const generateDefaultData = (): HzlpUtilizationChartData[] => {
      if (!fromTimestamp || !toTimestamp) {
        return [];
      }

      const defaultData: HzlpUtilizationChartData[] = [];
      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day

      for (let time = fromTimestamp; time <= toTimestamp; time += oneDay) {
        const date = dateFormat(time, 'yyyy-MM-dd');

        defaultData.push({
          date,
          timestamp: time,
          utilizationRate: 0,
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
        <LineChart
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
            formatter={(value, name) => [
              unitFormat(value as number, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              }),
              chartConfig[name as keyof typeof chartConfig]?.label ?? name,
            ]}
          />
          <Line
            type="monotone"
            dataKey="utilizationRate"
            stroke={chartConfig.utilizationRate.color}
            strokeWidth={2}
            dot={false}
            name="utilizationRate"
          />
        </LineChart>
      </ChartContainer>
    );
  },
);

HzlpUtilizationChartPresenter.displayName = 'HzlpUtilizationChartPresenter';
