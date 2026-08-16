'use client';

import { useMemo } from 'react';
import { useInfiniteQuery } from '@repo/lib/queryClient';
import { useHydrated } from '@/common/hooks/useHydrated';
import {
  fetchLeaderboard,
  type LeaderboardResponse,
  type LeaderboardRow,
  type LeaderboardSortBy,
} from '@/services/rest/leaderboard';
import { LEADERBOARD_PAGE_SIZE, type LeaderboardPeriod } from './mockData';

const LEADERBOARD_MAX_PAGE = 10;
const POLLING_INTERVAL_MS = 5 * 60 * 1000;

interface UseLeaderboardDataOptions {
  period: LeaderboardPeriod;
  sortBy: LeaderboardSortBy;
  initialLeaderboard?: LeaderboardResponse;
}

export const useLeaderboardData = ({
  period,
  sortBy,
  initialLeaderboard,
}: UseLeaderboardDataOptions) => {
  const isHydrated = useHydrated();
  const canUseInitialLeaderboard =
    initialLeaderboard?.period === period &&
    initialLeaderboard.sortBy === sortBy;
  const leaderboardQuery = useInfiniteQuery({
    queryKey: ['rest', 'leaderboard', period, sortBy],
    queryFn: ({ pageParam }) =>
      fetchLeaderboard({
        period,
        sortBy,
        page: Number(pageParam),
        pageSize: LEADERBOARD_PAGE_SIZE,
      }),
    initialPageParam: 1,
    initialData: canUseInitialLeaderboard
      ? {
        pages: [initialLeaderboard],
        pageParams: [1],
      }
      : undefined,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      const loadedCount = lastPage.page * lastPage.pageSize;

      return loadedCount < lastPage.total && nextPage <= LEADERBOARD_MAX_PAGE
        ? nextPage
        : undefined;
    },
    refetchInterval: POLLING_INTERVAL_MS,
  });

  const rows = useMemo<LeaderboardRow[]>(
    () =>
      !isHydrated && canUseInitialLeaderboard
        ? initialLeaderboard.rows
        : (leaderboardQuery.data?.pages.flatMap((page) => page.rows) ?? []),
    [
      canUseInitialLeaderboard,
      initialLeaderboard,
      isHydrated,
      leaderboardQuery.data?.pages,
    ],
  );
  const totalRows =
    !isHydrated && canUseInitialLeaderboard
      ? initialLeaderboard.total
      : (leaderboardQuery.data?.pages[0]?.total ?? 0);
  const isLeaderboardInitialLoading =
    !isHydrated && canUseInitialLeaderboard
      ? false
      : leaderboardQuery.isLoading ||
      (leaderboardQuery.isFetching && rows.length === 0);

  return {
    rows,
    totalRows,
    isLeaderboardInitialLoading,
    lastPolledAt: leaderboardQuery.dataUpdatedAt,
    hasNextPage: !!leaderboardQuery.hasNextPage,
    isFetchingNextPage: leaderboardQuery.isFetchingNextPage,
    fetchNextPage: leaderboardQuery.fetchNextPage,
  };
};
