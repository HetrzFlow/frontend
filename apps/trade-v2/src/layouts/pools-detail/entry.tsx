'use client';

import type { PoolDetailQueryData } from '@/queries/bsc/pools';
import type { fetchPoolChartData } from '@/services/rest/pools';
import { PoolDetailLayout } from './modules';

interface PoolDetailLayoutEntryProps {
  market_address: string;
  initialPoolDetailData?: PoolDetailQueryData;
  initialTvlChartData?: Awaited<ReturnType<typeof fetchPoolChartData>>;
}

const PoolDetailLayoutEntry = ({
  market_address,
  initialPoolDetailData,
  initialTvlChartData,
}: PoolDetailLayoutEntryProps) => {
  return (
    <PoolDetailLayout
      market_address={market_address}
      initialPoolDetailData={initialPoolDetailData}
      initialTvlChartData={initialTvlChartData}
    />
  );
};

export default PoolDetailLayoutEntry;
