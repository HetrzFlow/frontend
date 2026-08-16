'use client';

import { Skeleton } from '@repo/ui';
import DashboardPageLoadingShell from '@/containers/dashboard/DashboardLoadingShell';
import LeaderboardLoadingShell from '@/containers/leaderboard/LeaderboardLoadingShell';
import PoolDetailLoadingShell from '@/containers/pools/PoolsDetail/Skeleton';
import PoolsOverviewSkeleton from '@/containers/pools/PoolsOverview/Skeleton';
import VaultDetailLoadingShell from '@/containers/vaults/VaultsDetail/Skeleton';
import VaultsOverviewSkeleton from '@/containers/vaults/VaultsOverview/Skeleton';

interface RoutePageLoadingProps {
  variant?:
    | 'default'
    | 'dashboard'
    | 'leaderboard'
    | 'pools'
    | 'pool-detail'
    | 'vaults'
    | 'vault-detail';
}

const RoutePageLoading = ({ variant = 'default' }: RoutePageLoadingProps) => {
  if (variant === 'pools') {
    return <PoolsOverviewSkeleton />;
  }

  if (variant === 'pool-detail') {
    return <PoolDetailLoadingShell />;
  }

  if (variant === 'vaults') {
    return <VaultsOverviewSkeleton />;
  }

  if (variant === 'vault-detail') {
    return <VaultDetailLoadingShell />;
  }

  if (variant === 'leaderboard') {
    return <LeaderboardLoadingShell />;
  }

  if (variant === 'dashboard') {
    return <DashboardPageLoadingShell />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 px-4 py-4 md:px-0">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
        </div>
        <Skeleton className="hidden h-9 w-32 rounded-lg md:block" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="min-h-80 flex-1 rounded-xl" />
    </div>
  );
};

export default RoutePageLoading;
