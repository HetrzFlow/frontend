'use client';

import { memo, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { truncateFormat } from '@repo/lib/format';
import PoolPieChart from '@/containers/hzlp/charts/PoolPieChart';
import { Props } from '../types';

const DetailPoolCompositionSm = ({ poolName, poolDetail }: Props) => {
  const { t } = useLingui();
  const coinDetail = useMemo(
    () => poolDetail?.coin_details ?? [],
    [poolDetail?.coin_details],
  );
  return (
    <div className="text-t-270 border-border flex flex-col gap-3 space-y-4 border-b text-xs/tight">
      <h3 className="text-t-1100 text-base/tight font-semibold">{t`Pool Composition`}</h3>
      <div className="mb-4 grid grid-cols-2 justify-between">
        <PoolPieChart data={coinDetail} poolName={poolName} />
        <ul className="my-auto space-y-3">
          {coinDetail.map((v) => {
            return (
              <li
                key={v.coin_name}
                className="grid grid-cols-2 justify-between"
              >
                <span className="text-t-1100">{v.coin_name}</span>
                <span className="text-right">
                  {truncateFormat(v.current_weight, 4, {
                    showMinDecimalValue: true,
                    stripTrailingZeros: true,
                    style: 'percent',
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default memo(DetailPoolCompositionSm);
