import { ReactNode, useMemo } from 'react';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { unitFormat } from '@repo/lib/format';
import { SkeletonLayout } from '@repo/ui';
import { useGlobalStore } from '@/common';
import CommonLineChart from '@/containers/vaults/VaultsDetail/components/DetailInfoTab/CommonLineChart';
import { mergeCurrentDayChartPoint } from '@/containers/vaults/VaultsDetail/components/DetailInfoTab/CommonLineChart.utils';
import { APY_PERIOD } from '@/services/rest/pools';
import type { PoolChartRes } from '@/services/rest/pools';

export default function TvlTabsContent({
  tvlUsd,
  chartData,
  isChartLoading,
  isChartError,
  headerRight,
  period,
}: {
  tvlUsd?: bigint;
  chartData?: PoolChartRes['data'];
  isChartLoading?: boolean;
  isChartError?: boolean;
  headerRight?: ReactNode;
  period?: APY_PERIOD | string;
}) {
  const { t } = useLingui();
  const formattedTvlHistory = useMemo(
    () =>
      mergeCurrentDayChartPoint(
        chartData?.data_points?.map((item) => ({
          timestamp: item.timestamp,
          value: item.value,
        })) ?? [],
        tvlUsd?.toString(),
      ),
    [chartData?.data_points, tvlUsd],
  );
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const isValueLoading = tvlUsd === undefined;
  const isChartPending = !!isChartLoading || !!isChartError;
  const tvlDisplay =
    tvlUsd === undefined
      ? ''
      : unitFormat(
          calc(tvlUsd.toString(10)).div(calc(10).pow(USD_DECIMALS)).toString(),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          },
        );

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <div className="mb-3 flex justify-between">
          <div>
            <SkeletonLayout
              isLoading={isValueLoading}
              className="h-[28.8px] w-24"
            >
              <div className="text-t-1100 text-2xl font-medium">
                {tvlDisplay}
              </div>
            </SkeletonLayout>
          </div>
          {headerRight}
        </div>
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
