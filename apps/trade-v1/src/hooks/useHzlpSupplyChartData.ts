'use client';

import { useMemo } from 'react';
import { fromDecimalsAmount, HZLP_DECIMALS } from '@hertzflow/sdk';
import { useQuery } from '@tanstack/react-query';
import { calc } from '@repo/lib/calc';
import { dateFormat } from '@repo/lib/format';
import { useHzSdk } from '@/common';
import { HzlpSupplyChartData } from '@/components/charts/HzlpSupplyChartPresenter';
import { useDashboardDateRange } from './useDashboardDateRange';

export const useHzlpSupplyChartData = () => {
  const hzSdk = useHzSdk();
  const { fromTimestamp, toTimestamp } = useDashboardDateRange();

  const {
    data: hzlpData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'dashboard',
      'metric',
      'hzlp',
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

  const processedData = useMemo<HzlpSupplyChartData[]>(() => {
    if (!hzlpData?.data) {
      return [];
    }

    return hzlpData.data
      .map((item) => {
        const timestamp = item.timestamp;
        const date = dateFormat(timestamp, 'yyyy-MM-dd');

        const hzlpSupply = calc(
          fromDecimalsAmount(
            item.value.total_hzlp_supply ?? '0',
            HZLP_DECIMALS,
          ),
        ).toNumber();

        return {
          date,
          timestamp,
          hzlpSupply,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [hzlpData]);

  return {
    data: processedData,
    isLoading,
    error,
  };
};
