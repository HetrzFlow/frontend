import { ReactNode, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { SkeletonLayout } from '@repo/ui';
import { useGlobalStore } from '@/common';
import { APY_PERIOD } from '@/services/rest/pools';
import type { VaultTvlChartRes } from '@/services/rest/vaults';
import { formatUsdValue } from '../formatUsdValue';
import CommonLineChart from './CommonLineChart';
import { mergeCurrentDayChartPoint } from './CommonLineChart.utils';

type TvlTabsContentProps = {
  tvlUsd?: bigint;
  chartData?: VaultTvlChartRes['data'];
  isChartLoading?: boolean;
  isChartError?: boolean;
  headerRight?: ReactNode;
  period?: APY_PERIOD | string;
};

export default function TvlTabsContent({
  tvlUsd,
  chartData,
  isChartLoading,
  isChartError,
  headerRight,
  period,
}: TvlTabsContentProps) {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const formattedTvlHistory = useMemo(
    () =>
      mergeCurrentDayChartPoint(
        chartData?.points?.map((item) => ({
          timestamp: item.timestamp,
          value: item.value,
        })) ?? [],
        tvlUsd?.toString(),
      ),
    [chartData?.points, tvlUsd],
  );
  const isValueLoading = tvlUsd === undefined;
  const isChartPending = !!isChartLoading || !!isChartError;
  const tvlDisplay = formatUsdValue(tvlUsd, usdAmountDisplayDecimal, '');

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <div>
          <SkeletonLayout
            isLoading={isValueLoading}
            className="h-[28.8px] w-24"
          >
            <span className="text-t-1100 text-2xl font-medium">
              {tvlDisplay}
            </span>
          </SkeletonLayout>
        </div>
        {headerRight}
      </div>

      <SkeletonLayout isLoading={isChartPending} className="h-[159px] w-full">
        <CommonLineChart
          key={period}
          className="h-[159px] w-full"
          data={formattedTvlHistory}
          title={t`TVL`}
          valueType="currency"
          period={period}
          animateOnMount
        />
      </SkeletonLayout>
    </div>
  );
}
