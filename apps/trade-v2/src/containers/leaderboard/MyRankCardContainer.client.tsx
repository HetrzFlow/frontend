'use client';

import type { LeaderboardSortBy } from '@/services/rest/leaderboard';
import { MyRankCard } from './MyRankCard';
import { useLeaderboardMeData } from './useLeaderboardMeData';
import type { LeaderboardPeriod } from './mockData';

interface MyRankCardContainerProps {
  period: LeaderboardPeriod;
  sortBy: LeaderboardSortBy;
  totalRows: number;
}

export const MyRankCardContainer = ({
  period,
  sortBy,
  totalRows,
}: MyRankCardContainerProps) => {
  const { currentUserSummary, isCurrentUserSummaryLoading, isWalletConnected } =
    useLeaderboardMeData({ period, sortBy });

  return (
    <MyRankCard
      summary={currentUserSummary}
      isLoading={isCurrentUserSummaryLoading}
      isWalletConnected={isWalletConnected}
      totalRows={totalRows}
    />
  );
};
