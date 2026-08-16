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
import { useDashboardDateRange } from '@/hooks/useDashboardDateRange';

export interface HzlpSupplyChartData {
  date: string;
  timestamp: number;
  hzlpSupply: number;
}

interface HzlpSupplyChartPresenterProps {
  data: HzlpSupplyChartData[];
  isLoading: boolean;
  error?: Error | null;
  className?: string;
  height?: number;
}

const chartConfig = {
  hzlpSupply: {
    label: 'HzLP Supply',
    color: 'var(--color-dashboard-hzlp-supply)',
  },
} satisfies ChartConfig;

export const HzlpSupplyChartPresenter = memo(
  ({
    data,
    isLoading,
    error,
    className,
    height = 400,
  }: HzlpSupplyChartPresenterProps) => {
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
          className={`${cn('text-destructive flex items-center justify-center', className)}`}
          style={{ height }}
        >
          {t`Failed to load HzLP supply data`}: {error.message}
        </div>
      );
    }

    const generateDefaultData = (): HzlpSupplyChartData[] => {
      if (!fromTimestamp || !toTimestamp) {
        return [];
      }

      const defaultData: HzlpSupplyChartData[] = [];
      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day

      for (let time = fromTimestamp; time <= toTimestamp; time += oneDay) {
        const date = dateFormat(time, 'yyyy-MM-dd');

        defaultData.push({
          date,
          timestamp: time,
          hzlpSupply: 0,
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
              return unitFormat(value, 0, {
                style: 'decimal',
              });
            }}
          />
          <ChartTooltip
            labelFormatter={(value) => dateFormat(value, 'yyyy-MM-dd')}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) {
                return null;
              }

              const hzlpSupply =
                payload.find((p) => p.dataKey === 'hzlpSupply')?.value ?? 0;

              return (
                <div className="bg-background rounded-lg border p-3 shadow-md">
                  <p className="mb-2 font-medium">
                    {dateFormat(label || '', 'yyyy-MM-dd')}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{
                          backgroundColor: chartConfig.hzlpSupply.color,
                        }}
                      />
                      <span>HzLP Supply:</span>
                    </div>
                    <span>
                      {unitFormat(hzlpSupply as number, 0, {
                        style: 'decimal',
                      })}
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="hzlpSupply"
            stroke={chartConfig.hzlpSupply.color}
            strokeWidth={2}
            dot={{ fill: chartConfig.hzlpSupply.color, strokeWidth: 1, r: 2 }}
            activeDot={{ r: 4 }}
            name="hzlpSupply"
          />
        </LineChart>
      </ChartContainer>
    );
  },
);

HzlpSupplyChartPresenter.displayName = 'HzlpSupplyChartPresenter';
