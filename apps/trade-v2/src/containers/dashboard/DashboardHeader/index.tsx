'use client';

import { Trans } from '@lingui/react/macro';
import { useDashboardCardsQuery } from '@/queries/bsc/dashboard';
import BlockBadge from './BlockBadge.dynamic';
import BlockBadgeLoadingShell from './BlockBadgeLoadingShell';

const DashboardHeader = () => {
  const { data, isPending } = useDashboardCardsQuery();

  return (
    <div className="flex flex-col items-start gap-2 pt-[18px] pb-5 text-left md:items-center md:gap-3 md:pt-0 md:pb-0 md:text-center">
      <h3 className="text-2xl font-medium md:text-[32px]/tight">
        <Trans>Dashboard</Trans>
      </h3>
      {isPending ? (
        <BlockBadgeLoadingShell />
      ) : (
        <BlockBadge checkpoint={data?.checkpoint ?? null} />
      )}
    </div>
  );
};

export default DashboardHeader;
