'use client';

import { useEffect, useState } from 'react';

import { thoFormat } from '@repo/lib/format';
import { scheduleIdleTask } from '@/lib/runtime/scheduleIdleTask';
import {
  useClaimableFundingFees,
  useClaimStats,
} from '@/services/rest/claim';

const ClaimCountBadge = () => {
  const [queryEnabled, setQueryEnabled] = useState(false);
  const { data: claimableFundingFees } = useClaimableFundingFees({
    enabled: queryEnabled,
  });
  const { data: claimStats } = useClaimStats(undefined, {
    enabled: queryEnabled,
  });

  useEffect(() => {
    return scheduleIdleTask(() => setQueryEnabled(true));
  }, []);

  const claimableCount =
    (claimableFundingFees?.reduce(
      (count, item) =>
        count +
        (item.longTokenAddress === item.shortTokenAddress ? 1 : 2),
      0,
    ) ?? 0) + (claimStats?.claimablePriceImpact?.length ?? 0);

  if (!claimableCount) return null;

  return (
    <span className="bg-bg-4 font-plex min-w-5 rounded-sm p-0.5 align-middle">
      {thoFormat(claimableCount)}
    </span>
  );
};

export default ClaimCountBadge;
