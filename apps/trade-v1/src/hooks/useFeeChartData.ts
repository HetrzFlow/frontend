'use client';

import { useMemo } from 'react';
import { fromDecimalsAmount } from '@hertzflow/sdk';
import { useQuery } from '@tanstack/react-query';
import { calc } from '@repo/lib/calc';
import { dateFormat } from '@repo/lib/format';
import { useHzSdk, useGlobalStore } from '@/common';
import { FeeChartData } from '@/components/charts/FeeChartPresenter';
import { useDashboardDateRange } from './useDashboardDateRange';

export const useFeeChartData = () => {
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
      'fees',
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
      'fees',
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

  const processedData = useMemo<FeeChartData[]>(() => {
    if (!activityData?.data || !cumulativeData?.data) {
      return [];
    }

    const cumulativeMap = new Map();
    cumulativeData.data.forEach((item) => {
      cumulativeMap.set(
        item.timestamp,
        calc(
          fromDecimalsAmount(
            item.value.cumulative_total_fee ?? '0',
            usdAmountDecimal,
          ),
        ).toNumber(),
      );
    });

    return activityData.data
      .map((item) => {
        const timestamp = item.timestamp;
        const date = dateFormat(timestamp, 'yyyy-MM-dd');

        const swapFee = calc(
          fromDecimalsAmount(item.value.swap_fee ?? '0', usdAmountDecimal),
        ).toNumber();

        const mintHzlpFee = calc(
          fromDecimalsAmount(item.value.mint_fee ?? '0', usdAmountDecimal),
        ).toNumber();

        const burnHzlpFee = calc(
          fromDecimalsAmount(item.value.burn_fee ?? '0', usdAmountDecimal),
        ).toNumber();

        const tradingFee = calc(
          fromDecimalsAmount(item.value.trade_fee ?? '0', usdAmountDecimal),
        ).toNumber();

        const borrowFee = calc(
          fromDecimalsAmount(item.value.borrow_fee ?? '0', usdAmountDecimal),
        ).toNumber();

        const liquidateFee = calc(
          fromDecimalsAmount(item.value.liquidate_fee ?? '0', usdAmountDecimal),
        ).toNumber();

        const cumulative = cumulativeMap.get(timestamp) || 0;

        return {
          date,
          timestamp,
          swapFee,
          mintHzlpFee,
          burnHzlpFee,
          tradingFee,
          borrowFee,
          liquidateFee,
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
