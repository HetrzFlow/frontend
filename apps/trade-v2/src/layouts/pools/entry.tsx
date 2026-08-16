'use client';

import type { fetchPoolsList, fetchPoolsOverview } from '@/services/rest/pools';
import { PoolsLayout } from './modules';

interface PoolsLayoutEntryProps {
  initialPoolsListData?: Awaited<ReturnType<typeof fetchPoolsList>>;
  initialPoolsOverviewData?: Awaited<ReturnType<typeof fetchPoolsOverview>>;
}

const PoolsLayoutEntry = ({
  initialPoolsListData,
  initialPoolsOverviewData,
}: PoolsLayoutEntryProps) => {
  return (
    <PoolsLayout
      initialPoolsListData={initialPoolsListData}
      initialPoolsOverviewData={initialPoolsOverviewData}
    />
  );
};

export default PoolsLayoutEntry;
