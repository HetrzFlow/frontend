import type { LeaderboardPeriod } from '@/services/rest/leaderboard';

export type { LeaderboardPeriod };

export interface LeaderboardSummary {
  rank: string;
  pnl30d: string;
  volume30d: string;
  trades: string;
  winRate: string;
  refereeAllTime: string;
  referralVolume: string;
}

export const LEADERBOARD_PAGE_SIZE = 10;

export const leaderboardPeriods: LeaderboardPeriod[] = ['7d', '30d', 'all'];
