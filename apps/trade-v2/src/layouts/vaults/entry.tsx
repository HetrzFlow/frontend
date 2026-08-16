'use client';

import VaultsOverviewBackground from '@/containers/vaults/VaultsOverviewBackground';
import type { fetchVaultsList } from '@/services/rest/vaults';
import { VaultsLayout } from './modules';

interface VaultsLayoutEntryProps {
  initialVaultsListData?: Awaited<ReturnType<typeof fetchVaultsList>>['data'];
}

const VaultsLayoutEntry = ({
  initialVaultsListData,
}: VaultsLayoutEntryProps) => {
  return (
    <>
      <VaultsOverviewBackground />
      <div className="relative z-10">
        <VaultsLayout initialVaultsListData={initialVaultsListData} />
      </div>
    </>
  );
};

export default VaultsLayoutEntry;
