'use client';

import { useMemo } from 'react';
import { fromDecimalsAmount } from '@hertzflow/sdk';
import { useQuery } from '@tanstack/react-query';
import { calc } from '@repo/lib/calc';
import { dateFormat } from '@repo/lib/format';
import { useHzSdk, useGlobalStore } from '@/common';
import { PoolCompositionChartData } from '@/components/charts/PoolCompositionChartPresenter';
import { useDashboardDateRange } from './useDashboardDateRange';

export const usePoolCompositionChartData = () => {
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
      'pool-composition',
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

  const processedData = useMemo<PoolCompositionChartData[]>(() => {
    if (!hzlpData?.data) {
      return [];
    }

    return hzlpData.data
      .map((item) => {
        const timestamp = item.timestamp;
        const date = dateFormat(timestamp, 'yyyy-MM-dd');

        const coinData: PoolCompositionChartData = {
          date,
          timestamp,
          totalValue: 0,
        };

        let totalComposition = 0;

        item.value.tokens?.forEach((token) => {
          const poolUsd = calc(
            fromDecimalsAmount(token.pool_usd ?? '0', usdAmountDecimal),
          ).toNumber();

          const coinType = token.coin_type;
          const coinSymbol =
            coinType.split('::').pop()?.toLowerCase() || 'unknown';

          const compositionKey = `${coinSymbol}_composition`;
          const poolUsdKey = `${coinSymbol}_poolUsd`;

          if (coinData[compositionKey]) {
            coinData[compositionKey] =
              (coinData[compositionKey] as number) + poolUsd;
            coinData[poolUsdKey] = (coinData[poolUsdKey] as number) + poolUsd;
          } else {
            coinData[compositionKey] = poolUsd;
            coinData[poolUsdKey] = poolUsd;
          }

          totalComposition += poolUsd;
        });

        coinData.totalValue = totalComposition;

        return coinData;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [hzlpData, usdAmountDecimal]);

  return {
    data: processedData,
    isLoading,
    error,
  };
};
