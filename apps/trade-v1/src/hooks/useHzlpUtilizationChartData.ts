'use client';

import { useMemo } from 'react';
import { fromDecimalsAmount } from '@hertzflow/sdk';
import { useQuery } from '@tanstack/react-query';
import { calc } from '@repo/lib/calc';
import { dateFormat } from '@repo/lib/format';
import { useHzSdk, useGlobalStore } from '@/common';
import { HzlpUtilizationChartData } from '@/components/charts/HzlpUtilizationChartPresenter';
import { useDashboardDateRange } from './useDashboardDateRange';

export const useHzlpUtilizationChartData = () => {
  const hzSdk = useHzSdk();
  const { fromTimestamp, toTimestamp } = useDashboardDateRange();
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);

  const {
    data: hzlpData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'dashboard',
      'metric',
      'hzlp',
      'utilization',
      fromTimestamp,
      toTimestamp,
      hzSdk.fullClient.network,
    ],
    queryFn: async () => {
      if (!fromTimestamp || !toTimestamp) {
        throw new Error('Date range is required');
      }

      return await hzSdk.ApiModule.fetchDashboardMetricHzlp({
        from: fromTimestamp,
        to: toTimestamp,
      });
    },
    enabled: !!fromTimestamp && !!toTimestamp,
    refetchInterval: 60000,
  });

  const processedData = useMemo<HzlpUtilizationChartData[]>(() => {
    if (!hzlpData?.data) {
      return [];
    }

    return hzlpData.data
      .map((item) => {
        const timestamp = item.timestamp;
        const date = dateFormat(timestamp, 'yyyy-MM-dd');

        const utilizationRate = item.value.tokens.reduce((total, token) => {
          const reservedUsd = calc(
            fromDecimalsAmount(token.reserved_usd ?? '0', usdAmountDecimal),
          ).toNumber();
          return total + reservedUsd;
        }, 0);

        return {
          date,
          timestamp,
          utilizationRate,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [hzlpData, usdAmountDecimal]);

  return {
    data: processedData,
    isLoading,
    error,
  };
};
