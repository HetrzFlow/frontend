'use client';

import { ReactNode, useState } from 'react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@repo/lib/queryClient';
import { useHydrated } from '@/common/hooks/useHydrated';
import {
  fetchLeaderboardOverview,
  type LeaderboardOverview,
  type LeaderboardResponse,
  type LeaderboardSortBy,
} from '@/services/rest/leaderboard';
import { LeaderboardPodium } from './LeaderboardPodium';
import { LeaderboardTable } from './LeaderboardTable';
import { MyRankCardContainer } from './MyRankCardContainer.client';
import { PeriodSelect } from './PeriodSelect';
import { PeriodTabs } from './PeriodTabs';
import { useLeaderboardData } from './useLeaderboardData';
import type { LeaderboardPeriod } from './mockData';

interface LeaderboardPageProps {
  initialLeaderboard?: LeaderboardResponse;
  initialOverview?: LeaderboardOverview;
}

const SummaryCard = ({
  label,
  value,
}: {
  label: ReactNode;
  value: string;
}) => (
  <div className="flex h-[59px] min-w-0 flex-1 flex-col items-start justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.01] p-2 text-center backdrop-blur-[10px] md:h-auto">
    <span className="w-full text-[13px] leading-[normal] tracking-[-0.52px] text-white/70">
      {label}
    </span>
    <span className="w-full text-[20px] leading-[normal] font-medium tracking-[-0.8px] text-white md:text-2xl md:tracking-[-0.96px]">
      {value}
    </span>
  </div>
);

export const LeaderboardPage = ({
  initialLeaderboard,
  initialOverview,
}: LeaderboardPageProps) => {
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>('7d');
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>('pnl');
  const isHydrated = useHydrated();
  const overviewQuery = useQuery({
    queryKey: ['rest', 'leaderboard', 'overview'],
    queryFn: fetchLeaderboardOverview,
    enabled: isHydrated,
    initialData: initialOverview,
    refetchInterval: 5 * 60 * 1000,
  });
  const overviewData = isHydrated ? overviewQuery.data : initialOverview;
  const leaderboardData = useLeaderboardData({
    period: activePeriod,
    sortBy,
    initialLeaderboard,
  });

  return (
    <div className="relative min-h-full overflow-x-clip">
      <div className="relative z-1 mx-auto flex w-full max-w-[1080px] flex-col gap-5 px-4 pt-5 pb-[calc(104px+env(safe-area-inset-bottom))] md:gap-6 md:px-0 md:pt-2.5 md:pb-10">
        <section className="flex w-full flex-col gap-5 md:h-[67px] md:flex-row md:items-center md:justify-between md:gap-0">
          <div className="flex w-[311px] flex-col justify-center gap-2 md:w-[358px] md:gap-3">
            <h2 className="text-2xl leading-[normal] font-semibold tracking-[-0.96px] text-white md:text-[32px] md:font-medium md:tracking-[-1.28px]">
              <Trans>Leaderboard</Trans>
            </h2>
            <p className="text-sm leading-[normal] text-white/70">
              <Trans>Claim you&apos;re degen? Come prove it.</Trans>
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-[722px]">
            <SummaryCard
              label={<Trans>Degens</Trans>}
              value={overviewData?.totalDegens ?? '--'}
            />
            <SummaryCard
              label={<Trans>Aped</Trans>}
              value={overviewData?.totalAped ?? '--'}
            />
          </div>
        </section>

        <div className="flex h-8 w-full items-center justify-between">
          <PeriodTabs activeSortBy={sortBy} onSortChange={setSortBy} />
          <PeriodSelect value={activePeriod} onValueChange={setActivePeriod} />
        </div>

        <LeaderboardPodium
          rows={leaderboardData.rows}
          sortBy={sortBy}
          isLoading={leaderboardData.isLeaderboardInitialLoading}
        />

        <MyRankCardContainer
          period={activePeriod}
          sortBy={sortBy}
          totalRows={leaderboardData.totalRows}
        />

        <div className="mt-1 md:mt-0">
          <LeaderboardTable
            rows={leaderboardData.rows}
            sortBy={sortBy}
            hasNextPage={leaderboardData.hasNextPage}
            isLoading={leaderboardData.isLeaderboardInitialLoading}
            isFetchingNextPage={leaderboardData.isFetchingNextPage}
            onLoadMore={leaderboardData.fetchNextPage}
          />
        </div>
      </div>
    </div>
  );
};
