'use client';

import { useQuery } from '@repo/lib/queryClient';
import {
  useConnectionStatus,
  useCurrentAccountAddress,
} from '@/common/chainClient';
import {
  LEADERBOARD_BACKEND_TODO_VALUE,
  fetchLeaderboardMe,
  type LeaderboardSortBy,
} from '@/services/rest/leaderboard';
import { formatLeaderboardRank } from './display';
import type { LeaderboardPeriod } from './mockData';

const POLLING_INTERVAL_MS = 5 * 60 * 1000;

export const useLeaderboardMeData = ({
  period,
  sortBy,
}: {
  period: LeaderboardPeriod;
  sortBy: LeaderboardSortBy;
}) => {
  const connectionStatus = useConnectionStatus();
  const userAddress = useCurrentAccountAddress() || undefined;
  const isWalletConnected = connectionStatus === 'connected' && !!userAddress;

  const leaderboardMeQuery = useQuery({
    queryKey: ['rest', 'leaderboard', 'me', period, sortBy, userAddress],
    enabled: isWalletConnected,
    queryFn: () =>
      fetchLeaderboardMe({
        period,
        sortBy,
        userAddress: userAddress!,
      }),
    refetchInterval: POLLING_INTERVAL_MS,
  });

  const currentUserRow = leaderboardMeQuery.data ?? undefined;

  return {
    currentUserRow,
    currentUserSummary: isWalletConnected
      ? {
          rank: formatLeaderboardRank({
            rank: currentUserRow?.rank,
            rankPercent: currentUserRow?.rankPercent,
          }),
          pnl30d: currentUserRow?.pnl30d ?? '--',
          volume30d: currentUserRow?.volume30d ?? '--',
          trades: currentUserRow?.trades ?? LEADERBOARD_BACKEND_TODO_VALUE,
          winRate: currentUserRow?.winRate ?? LEADERBOARD_BACKEND_TODO_VALUE,
          refereeAllTime:
            currentUserRow?.refereeAllTime ?? LEADERBOARD_BACKEND_TODO_VALUE,
          referralVolume:
            currentUserRow?.referralVolume ?? LEADERBOARD_BACKEND_TODO_VALUE,
        }
      : undefined,
    isCurrentUserSummaryLoading:
      connectionStatus === 'unknown' ||
      (isWalletConnected && leaderboardMeQuery.isLoading),
    isWalletConnected,
    dataUpdatedAt: leaderboardMeQuery.dataUpdatedAt,
  };
};
