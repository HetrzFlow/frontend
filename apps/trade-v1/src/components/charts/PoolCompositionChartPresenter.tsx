'use client';

import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
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

export interface PoolCompositionChartData {
  date: string;
  timestamp: number;
  totalValue: number;
  [key: string]: string | number;
}

interface PoolCompositionChartPresenterProps {
  data: PoolCompositionChartData[];
  isLoading: boolean;
  error?: Error | null;
  className?: string;
  height?: number;
}

const getCoinColor = (coinSymbol: string): string => {
  const colorMap: Record<string, string> = {
    btc: 'var(--color-dashboard-btc)',
    eth: 'var(--color-dashboard-eth)',
    sui: 'var(--color-dashboard-sui)',
    usdc: 'var(--color-dashboard-usdc)',
    usdt: 'var(--color-dashboard-usdt)',
    sol: 'var(--color-dashboard-sol)',
    bnb: 'var(--color-dashboard-bnb)',
  };
  return colorMap[coinSymbol.toLowerCase()] ?? 'var(--color-dashboard-coin)';
};

const generateChartConfig = (data: PoolCompositionChartData[]): ChartConfig => {
  const coinSet = new Set<string>();

  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'date' && key !== 'timestamp' && key !== 'totalValue') {
        coinSet.add(key);
      }
    });
  });

  const config: ChartConfig = {};
  coinSet.forEach((key) => {
    if (key.endsWith('_composition')) {
      const coinSymbol = key.replace('_composition', '');
      config[key] = {
        label: coinSymbol.toUpperCase(),
        color: getCoinColor(coinSymbol),
      };
    } else if (key.endsWith('_poolUsd')) {
      const coinSymbol = key.replace('_poolUsd', '');
      config[key] = {
        label: `${coinSymbol.toUpperCase()} Value`,
        color: getCoinColor(coinSymbol),
      };
    }
  });

  return config;
};

export const PoolCompositionChartPresenter = memo(
  ({
    data,
    isLoading,
    error,
    className,
    height = 400,
  }: PoolCompositionChartPresenterProps) => {
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
          {t`Failed to load pool composition data`}: {error.message}
        </div>
      );
    }

    const generateDefaultData = (): PoolCompositionChartData[] => {
      if (!fromTimestamp || !toTimestamp) {
        return [];
      }

      const defaultData: PoolCompositionChartData[] = [];
      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day

      for (let time = fromTimestamp; time <= toTimestamp; time += oneDay) {
        const date = dateFormat(time, 'yyyy-MM-dd');

        defaultData.push({
          date,
          timestamp: time,
          totalValue: 0,
          btc_composition: 0,
          eth_composition: 0,
          usdc_composition: 0,
          usdt_composition: 0,
          btc_poolUsd: 0,
          eth_poolUsd: 0,
          usdc_poolUsd: 0,
          usdt_poolUsd: 0,
        });
      }

      return defaultData;
    };

    const defaultData = generateDefaultData();

    const chartData = data && data.length > 0 ? data : defaultData;
    const chartConfig = generateChartConfig(chartData);
    const coins = Object.keys(chartConfig);

    return (
      <ChartContainer
        config={chartConfig}
        className={`${cn('aspect-auto w-full', className)}`}
        style={{ height }}
      >
        <AreaChart
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

              let totalValue = 0;
              const coinData: Array<{
                name: string;
                value: number;
                color: string;
              }> = [];

              payload.forEach((entry) => {
                const nameStr = String(entry.dataKey);
                if (nameStr.endsWith('_composition')) {
                  const coinSymbol = nameStr.replace('_composition', '');
                  const poolUsdKey = `${coinSymbol}_poolUsd`;
                  const poolUsdValue = entry.payload?.[poolUsdKey] ?? 0;

                  totalValue += poolUsdValue;
                  coinData.push({
                    name: coinSymbol.toUpperCase(),
                    value: poolUsdValue,
                    color: entry.color ?? 'var(--color-dashboard-coin)',
                  });
                }
              });

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

                  {coinData.map((coin, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 py-1"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: coin.color }}
                        />
                        <span>{coin.name}:</span>
                      </div>
                      <span>
                        {unitFormat(coin.value, usdAmountDisplayDecimal, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />

          {coins
            .filter((coin) => coin.endsWith('_composition'))
            .map((coin) => (
              <Area
                key={coin}
                type="monotone"
                dataKey={coin}
                stackId="1"
                stroke={chartConfig[coin]?.color}
                fill={chartConfig[coin]?.color}
                fillOpacity={1}
                name={coin}
              />
            ))}
        </AreaChart>
      </ChartContainer>
    );
  },
);

PoolCompositionChartPresenter.displayName = 'PoolCompositionChartPresenter';
