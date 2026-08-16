'use client';

import { useMemo } from 'react';
import { fromDecimalsAmount } from '@hertzflow/sdk';
import { useQuery } from '@tanstack/react-query';
import { calc } from '@repo/lib/calc';
import { dateFormat } from '@repo/lib/format';
import { useHzSdk, useGlobalStore } from '@/common';
import { VolumeChartData } from '@/components/charts/VolumeChartPresenter';
import { useDashboardDateRange } from './useDashboardDateRange';

export const useVolumeChartData = () => {
  const hzSdk = useHzSdk();
  const { fromTimestamp, toTimestamp } = useDashboardDateRange();
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);

  const {
    data: activityData,
    isLoading: isActivityLoading,
    error: activityError,
  } = useQuery({
    queryKey: [
      'dashboard',
      'metric',
      'activity',
      fromTimestamp,
      toTimestamp,
      hzSdk.fullClient.network,
    ],
    queryFn: async () => {
      if (!fromTimestamp || !toTimestamp) {
        throw new Error('Date range is required');
      }

      return await hzSdk.ApiModule.fetchDashboardMetricActivity({
        from: fromTimestamp,
        to: toTimestamp,
      });
    },
    enabled: !!fromTimestamp && !!toTimestamp,
  });

  const {
    data: cumulativeData,
    isLoading: isCumulativeLoading,
    error: cumulativeError,
  } = useQuery({
    queryKey: [
      'dashboard',
      'metric',
      'cumulative',
      fromTimestamp,
      toTimestamp,
      hzSdk.fullClient.network,
    ],
    queryFn: async () => {
      if (!fromTimestamp || !toTimestamp) {
        throw new Error('Date range is required');
      }

      return await hzSdk.ApiModule.fetchDashboardMetricCumulative({
        from: fromTimestamp,
        to: toTimestamp,
      });
    },
    enabled: !!fromTimestamp && !!toTimestamp,
  });

  const processedData = useMemo<VolumeChartData[]>(() => {
    if (!activityData?.data || !cumulativeData?.data) {
      return [];
    }

    const cumulativeMap = new Map();
    cumulativeData.data.forEach((item) => {
      cumulativeMap.set(
        item.timestamp,
        calc(
          fromDecimalsAmount(
            item.value.cumulative_total_volume ?? '0',
            usdAmountDecimal,
          ),
        ).toNumber(),
      );
    });

    return activityData.data
      .map((item) => {
        const timestamp = item.timestamp;
        const date = dateFormat(timestamp, 'yyyy-MM-dd');

        const swap = calc(
          fromDecimalsAmount(item.value.swap_volume ?? '0', usdAmountDecimal),
        ).toNumber();

        const mintHzlp = calc(
          fromDecimalsAmount(item.value.mint_volume ?? '0', usdAmountDecimal),
        ).toNumber();

        const burnHzlp = calc(
          fromDecimalsAmount(item.value.burn_volume ?? '0', usdAmountDecimal),
        ).toNumber();

        const trading = calc(
          fromDecimalsAmount(item.value.trade_volume ?? '0', usdAmountDecimal),
        ).toNumber();

        const cumulative = cumulativeMap.get(timestamp) || 0;

        return {
          date,
          timestamp,
          swap,
          mintHzlp,
          burnHzlp,
          trading,
          cumulative,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [activityData, cumulativeData, usdAmountDecimal]);

  return {
    data: processedData,
    isLoading: isActivityLoading || isCumulativeLoading,
    error: activityError || cumulativeError,
  };
};
