import { useMemo } from 'react';
import { fromDecimalsAmount } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { unitFormat } from '@repo/lib/format';
import { useGlobalStore } from '@/common';
import { useDashboardDetail } from '@/hooks/useDashboardDetail';

export const useDashboardOverviewData = () => {
  const { t } = useLingui();
  const { data, isLoading } = useDashboardDetail();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);

  const staticData = useMemo(
    () => [
      {
        title: t`Total Volume`,
        value: unitFormat(
          fromDecimalsAmount(data?.total_volume ?? '0', usdAmountDecimal),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            stripTrailingZeros: true,
          },
        ),
        changes: unitFormat(
          fromDecimalsAmount(
            data?.total_volume_change ?? '0',
            usdAmountDecimal,
          ),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            stripTrailingZeros: true,
            signDisplay: 'always',
          },
        ),
      },
      {
        title: t`Total Fees`,
        value: unitFormat(
          fromDecimalsAmount(data?.total_fee ?? '0', usdAmountDecimal),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            stripTrailingZeros: true,
          },
        ),
        changes: unitFormat(
          fromDecimalsAmount(data?.total_fee_change ?? '0', usdAmountDecimal),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            stripTrailingZeros: true,
            signDisplay: 'always',
          },
        ),
      },
      {
        title: t`HLP Pool`,
        value: unitFormat(
          fromDecimalsAmount(
            data?.total_liquidity_value ?? '0',
            usdAmountDecimal,
          ),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            stripTrailingZeros: true,
          },
        ),
        changes: unitFormat(
          fromDecimalsAmount(
            data?.total_liquidity_value_change ?? '0',
            usdAmountDecimal,
          ),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            stripTrailingZeros: true,
            signDisplay: 'always',
          },
        ),
      },
      {
        title: t`Total User`,
        value: unitFormat(data?.total_users ?? '0', 0),
        changes: unitFormat(data?.total_users_change ?? '0', 0, {
          signDisplay: 'always',
        }),
      },
      {
        title: t`Open Interest`,
        value: unitFormat(
          fromDecimalsAmount(data?.open_interest ?? '0', usdAmountDecimal),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            stripTrailingZeros: true,
          },
        ),
        changes: unitFormat(
          fromDecimalsAmount(
            data?.open_interest_change ?? '0',
            usdAmountDecimal,
          ),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            stripTrailingZeros: true,
            signDisplay: 'always',
          },
        ),
      },
    ],
    [
      data?.open_interest,
      data?.open_interest_change,
      data?.total_fee,
      data?.total_fee_change,
      data?.total_liquidity_value,
      data?.total_liquidity_value_change,
      data?.total_users,
      data?.total_users_change,
      data?.total_volume,
      data?.total_volume_change,
      t,
      usdAmountDecimal,
      usdAmountDisplayDecimal,
    ],
  );

  return { staticData, isLoading };
};
