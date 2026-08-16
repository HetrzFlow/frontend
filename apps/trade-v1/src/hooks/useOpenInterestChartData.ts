'use client';

import { useMemo } from 'react';
import { fromDecimalsAmount } from '@hertzflow/sdk';
import { useQuery } from '@tanstack/react-query';
import { calc } from '@repo/lib/calc';
import { dateFormat } from '@repo/lib/format';
import { useHzSdk, useGlobalStore } from '@/common';
import { OpenInterestChartData } from '@/components/charts/OpenInterestChartPresenter';
import { useDashboardDateRange } from './useDashboardDateRange';

export const useOpenInterestChartData = () => {
  const hzSdk = useHzSdk();
  const { fromTimestamp, toTimestamp } = useDashboardDateRange();
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);

  const {
    data: tradingData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'dashboard',
      'metric',
      'trading',
      'openInterest',
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

  const processedData = useMemo<OpenInterestChartData[]>(() => {
    if (!tradingData?.data) {
      return [];
    }

    return tradingData.data
      .map((item) => {
        const timestamp = item.timestamp;
        const date = dateFormat(timestamp, 'yyyy-MM-dd');

        const longValue = calc(
          fromDecimalsAmount(
            item.value.long_position_value ?? '0',
            usdAmountDecimal,
          ),
        ).toNumber();

        const shortValue = calc(
          fromDecimalsAmount(
            item.value.short_position_value ?? '0',
            usdAmountDecimal,
          ),
        ).toNumber();

        return {
          date,
          timestamp,
          longValue,
          shortValue,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [tradingData, usdAmountDecimal]);

  return {
    data: processedData,
    isLoading,
    error,
  };
};
