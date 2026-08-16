import { ReactNode } from 'react';
import { useLingui } from '@lingui/react/macro';
import { percentFormat } from '@repo/lib/format';
import { SkeletonLayout } from '@repo/ui';
import CommonLineChart from '@/containers/vaults/VaultsDetail/components/DetailInfoTab/CommonLineChart';
import { APY_PERIOD } from '@/services/rest/pools';
import type { PoolApyRes, PoolChartRes } from '@/services/rest/pools';
import { NetApyTooltip } from './detailShared';

export default function FeeAprTabsContent({
  apyData,
  chartData,
  status,
  headerRight,
  period,
}: {
  apyData?: PoolApyRes['data'];
  chartData?: PoolChartRes['data'];
  status?: {
    apyLoading?: boolean;
    chartLoading?: boolean;
    apyError?: boolean;
    chartError?: boolean;
  };
  headerRight?: ReactNode;
  period?: APY_PERIOD | string;
}) {
  const { t } = useLingui();
  const feeApy = apyData?.fee_apy;
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

  const formattedApyHistory =
    chartData?.data_points?.map((item) => ({
      timestamp: item.timestamp,
      value: item.value,
    })) ?? [];
  const hasHeadlineValue = feeApy !== undefined;
  const isHeadlineLoading =
    !!status?.apyLoading || !!status?.apyError || !hasHeadlineValue;
  const isChartLoadingState = !!status?.chartLoading || !!status?.chartError;

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <div className="mb-3 flex justify-between">
          <div>
            <SkeletonLayout
              isLoading={isHeadlineLoading}
              className="h-[28.8px] w-28"
            >
              <div className="flex items-end gap-2">
                <p
                  className={`text-2xl font-medium ${
                    feeApy !== undefined && Number(feeApy) >= 0
                      ? 'text-up'
                      : 'text-down'
                  }`}
                >
                  {feeApy !== undefined
                    ? percentFormat(feeApy, 2, {
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
