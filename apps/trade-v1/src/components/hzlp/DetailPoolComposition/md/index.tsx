'use client';

import { memo, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import PoolPieChart from '@/containers/hzlp/charts/PoolPieChart';
import { Props } from '../types';

const DetailPoolCompositionMd = ({ poolName, poolDetail }: Props) => {
  const { t } = useLingui();

  const coinDetail = useMemo(
    () => poolDetail?.coin_details ?? [],
    [poolDetail?.coin_details],
  );

  return (
    <div className="text-t-270 flex flex-col gap-3 text-xs lg:text-sm">
      <h3>{t`Pool Composition`}</h3>
      <PoolPieChart data={coinDetail} poolName={poolName} />
    </div>
  );
};

export default memo(DetailPoolCompositionMd);
