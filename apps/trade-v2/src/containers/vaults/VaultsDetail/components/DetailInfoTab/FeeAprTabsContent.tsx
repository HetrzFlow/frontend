import { ReactNode, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { percentFormat } from '@repo/lib/format';
import { SkeletonLayout } from '@repo/ui';
import { NetApyTooltip } from '@/containers/pools/PoolsDetail/components/detailShared';
import { APY_PERIOD } from '@/services/rest/pools';
import type { VaultNetAprChartRes } from '@/services/rest/vaults';
import CommonLineChart from './CommonLineChart';

type VaultDetailInfoTabUIProps = {
  data?: VaultNetAprChartRes['data'];
  isLoading?: boolean;
  isError?: boolean;
  headerRight?: ReactNode;
  period?: APY_PERIOD | string;
};

export default function FeeAprTabsContent({
  data,
  isLoading,
  isError,
  headerRight,
  period,
}: VaultDetailInfoTabUIProps) {
  const { t } = useLingui();
  const netAprChartData = data;
  const headlineNetApy = netAprChartData?.period_fee_apy;
  const periodLabels: Record<APY_PERIOD, string> = {
    [APY_PERIOD['7D']]: t`7D`,
    [APY_PERIOD['30D']]: t`30D`,
    [APY_PERIOD['90D']]: t`90D`,
    [APY_PERIOD['180D']]: t`180D`,
    [APY_PERIOD['ALL TIME']]: t`All`,
  };
  const periodLabel = period
    ? (periodLabels[period as APY_PERIOD] ?? period)
    : undefined;
  const formattedApyHistory = useMemo(
    () =>
      netAprChartData?.points?.map((item) => ({
        timestamp: item.timestamp,
        value: item.fee_apr,
      })) ?? [],
    [netAprChartData?.points],
  );
  const hasHeadlineValue = headlineNetApy !== undefined;
  const isHeadlineLoading = !!isLoading || !!isError || !hasHeadlineValue;
  const isChartLoadingState = !!isLoading || !!isError;

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <div>
          <SkeletonLayout
            isLoading={isHeadlineLoading}
            className="h-[28.8px] w-28"
          >
            <div className="flex items-end gap-2">
              <p className="text-2xl font-medium">
                {hasHeadlineValue
                  ? percentFormat(headlineNetApy, 2, {
                      showMinDecimalValue: true,
                      stripTrailingZeros: true,
                    })
                  : '--'}
              </p>
              <div className="text-t-270 pb-1 text-xs">
                <NetApyTooltip periodLabel={periodLabel} />
              </div>
            </div>
          </SkeletonLayout>
        </div>
        {headerRight}
      </div>
      <SkeletonLayout
        isLoading={isChartLoadingState}
        className="h-[159px] w-full"
      >
        <CommonLineChart
          className="h-[159px] w-full"
          data={formattedApyHistory}
          title={t`Fee APR`}
          valueType="percent"
          period={period}
        />
      </SkeletonLayout>
    </div>
  );
}
