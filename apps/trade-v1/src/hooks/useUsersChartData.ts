'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dateFormat } from '@repo/lib/format';
import { useHzSdk } from '@/common';
import { UsersChartData } from '@/components/charts/UsersChartPresenter';
import { useDashboardDateRange } from './useDashboardDateRange';

export const useUsersChartData = () => {
  const hzSdk = useHzSdk();
  const { fromTimestamp, toTimestamp } = useDashboardDateRange();

  const {
    data: activityData,
    isLoading: isActivityLoading,
    error: activityError,
  } = useQuery({
    queryKey: [
      'dashboard',
      'metric',
      'activity',
      'users',
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
    refetchInterval: 60000,
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
      'users',
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
    refetchInterval: 60000,
  });

  const processedData = useMemo<UsersChartData[]>(() => {
    if (!activityData?.data || !cumulativeData?.data) {
      return [];
    }

    const cumulativeMap = new Map<number, number>();
    cumulativeData.data.forEach((item) => {
      const cumulativeUsers = item.value.cumulative_total_user ?? 0;
      cumulativeMap.set(item.timestamp, cumulativeUsers);
    });

    return activityData.data
      .map((item) => {
        const timestamp = item.timestamp;
        const date = dateFormat(timestamp, 'yyyy-MM-dd');

        const swapUsers = item.value.swap_user ?? 0;
        const tradingUsers = item.value.trade_user ?? 0;
        const mintUsers = item.value.mint_user ?? 0;
        const burnUsers = item.value.burn_user ?? 0;
        const mintBurnUsers = mintUsers + burnUsers;

        const cumulativeUsers = cumulativeMap.get(timestamp) || 0;

        return {
          date,
          timestamp,
          swapUsers,
          tradingUsers,
          mintBurnUsers,
          cumulativeUsers,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [activityData, cumulativeData]);

  return {
    data: processedData,
    isLoading: isActivityLoading || isCumulativeLoading,
    error: activityError || cumulativeError,
  };
};
