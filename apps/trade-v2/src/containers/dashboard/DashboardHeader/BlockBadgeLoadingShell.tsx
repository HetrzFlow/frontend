'use client';

import { Trans } from '@lingui/react/macro';
import { Skeleton } from '@repo/ui';

const BlockBadgeLoadingShell = () => (
  <div className="text-t-270 flex items-center gap-1 rounded-[20px] text-sm md:mb-3">
    <div>
      <Trans>Block</Trans>
    </div>
    <Skeleton className="h-[16.8px] w-18" />
    <Skeleton className="h-[16.8px] w-34" />
  </div>
);

export default BlockBadgeLoadingShell;
