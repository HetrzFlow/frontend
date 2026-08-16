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
import { useGlobalStore } from '@/common';
import { useDashboardDateRange } from '@/hooks/useDashboardDateRange';

export interface FeeChartData {
  date: string;
  timestamp: number;
  swapFee: number;
  mintHzlpFee: number;
  burnHzlpFee: number;
  tradingFee: number;
  borrowFee: number;
  liquidateFee: number;
  cumulative: number;
}

interface FeeChartPresenterProps {
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

export const FeeChartPresenter = memo(
  ({
    data,
    isLoading,
    error,
    className,
    height = 400,
  }: FeeChartPresenterProps) => {
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
          {t`Failed to load fee data`}: {error.message}
        </div>
      );
    }

    const generateDefaultData = (): FeeChartData[] => {
      if (!fromTimestamp || !toTimestamp) {
        return [];
      }

      const defaultData: FeeChartData[] = [];
      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day

      for (let time = fromTimestamp; time <= toTimestamp; time += oneDay) {
        const date = dateFormat(time, 'yyyy-MM-dd');

        defaultData.push({
          date,
          timestamp: time,
          swapFee: 0,
          mintHzlpFee: 0,
          burnHzlpFee: 0,
          tradingFee: 0,
          borrowFee: 0,
          liquidateFee: 0,
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

              const swapFee =
                payload.find((p) => p.dataKey === 'swapFee')?.value ?? 0;
              const mintFee =
                payload.find((p) => p.dataKey === 'mintHzlpFee')?.value ?? 0;
              const burnFee =
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
                (mintFee as number) +
                (burnFee as number) +
                (tradingFee as number) +
                (borrowFee as number) +
                (liquidateFee as number);

              return (
                <div className="bg-background rounded-lg border p-3 shadow-md">
                  <p className="mb-2 font-medium">
                    {dateFormat(label || '', 'yyyy-MM-dd')}
                  </p>
                  <div className="mb-2 border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">TOTAL:</span>
                      <span className="font-semibold">
                        {unitFormat(totalFee, usdAmountDisplayDecimal, {
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
                        {unitFormat(
                          swapFee as number,
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
                            backgroundColor: chartConfig.mintHzlpFee.color,
                          }}
                        />
                        <span>Mint HzLP Fee:</span>
                      </div>
                      <span>
                        {unitFormat(
                          mintFee as number,
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
                            backgroundColor: chartConfig.burnHzlpFee.color,
                          }}
                        />
                        <span>Burn HzLP Fee:</span>
                      </div>
                      <span>
                        {unitFormat(
                          burnFee as number,
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
                            backgroundColor: chartConfig.tradingFee.color,
                          }}
                        />
                        <span>Trading Fee:</span>
                      </div>
                      <span>
                        {unitFormat(
                          tradingFee as number,
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
                            backgroundColor: chartConfig.borrowFee.color,
                          }}
                        />
                        <span>Borrow Fee:</span>
                      </div>
                      <span>
                        {unitFormat(
                          borrowFee as number,
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
                            backgroundColor: chartConfig.liquidateFee.color,
                          }}
                        />
                        <span>Liquidate Fee:</span>
                      </div>
                      <span>
                        {unitFormat(
                          liquidateFee as number,
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
                        <span>Cumulative Fee:</span>
                      </div>
                      <span className="font-semibold">
                        {unitFormat(
                          cumulativeFee as number,
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
            dataKey="swapFee"
            fill={chartConfig.swapFee.color}
            name="swapFee"
            stackId="fees"
          />
          <Bar
            yAxisId="left"
            dataKey="mintHzlpFee"
            fill={chartConfig.mintHzlpFee.color}
            name="mintHzlpFee"
            stackId="fees"
          />
          <Bar
            yAxisId="left"
            dataKey="burnHzlpFee"
            fill={chartConfig.burnHzlpFee.color}
            name="burnHzlpFee"
            stackId="fees"
          />
          <Bar
            yAxisId="left"
            dataKey="tradingFee"
            fill={chartConfig.tradingFee.color}
            name="tradingFee"
            stackId="fees"
          />
          <Bar
            yAxisId="left"
            dataKey="borrowFee"
            fill={chartConfig.borrowFee.color}
            name="borrowFee"
            stackId="fees"
          />
          <Bar
            yAxisId="left"
            dataKey="liquidateFee"
            fill={chartConfig.liquidateFee.color}
            name="liquidateFee"
            stackId="fees"
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

FeeChartPresenter.displayName = 'FeeChartPresenter';
