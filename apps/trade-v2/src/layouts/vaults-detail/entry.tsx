'use client';

import type { VaultDetailQueryData } from '@/queries/bsc/vaults';
import type { fetchVaultTvlChartData } from '@/services/rest/vaults';
import { VaultDetailLayout } from './modules';

interface VaultDetailLayoutEntryProps {
  market_address: string;
  initialVaultDetailData?: VaultDetailQueryData;
  initialTvlChartData?: Awaited<ReturnType<typeof fetchVaultTvlChartData>>['data'];
}

const VaultDetailLayoutEntry = ({
  market_address,
  initialVaultDetailData,
  initialTvlChartData,
}: VaultDetailLayoutEntryProps) => {
  return (
    <VaultDetailLayout
      market_address={market_address}
      initialVaultDetailData={initialVaultDetailData}
      initialTvlChartData={initialTvlChartData}
    />
  );
};

export default VaultDetailLayoutEntry;
