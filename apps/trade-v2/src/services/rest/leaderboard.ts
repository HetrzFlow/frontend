import { formatAddress } from '@repo/lib/format';
import { get } from '@repo/lib/rest';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toChecksumAddress, toLowerAddressParam } from '@/lib/address';

export type LeaderboardPeriod = '7d' | '30d' | 'all';

export const LEADERBOARD_BACKEND_TODO_VALUE = 'TBD';

export type LeaderboardSortBy = 'volume' | 'pnl' | 'winRate' | 'referee';

export interface LeaderboardRow {
  rank: number;
  rankPercent?: string;
  trader: string;
  traderAddress: string;
  pnl30d: string;
  volume30d: string;
  trades: string;
  winRate: string;
  refereeAllTime: string;
  referralVolume: string;
  mobileTrader: string;
  mobilePnl: string;
  refPoints: string;
  totalPoints: string;
}

interface ApiResponse<T> {
  code?: number;
  data: T;
  message?: string;
  msg?: string;
}

interface BackendLeaderboardEntry {
  rank: number;
  trader: string;
  volume: string;
  pnl: string;
  rank_percent?: string | number | null;
  referee?: string | number;
  referral_volume: string;
  win_count?: string | number;
  loss_count?: string | number;
  total_trades?: string | number;
  lp_points: string;
  referral_points: string;
  total_points: string;
}

interface BackendLeaderboardResponse {
  period: LeaderboardPeriod;
  sort_by: LeaderboardSortBy;
  page: number;
  page_size: number;
  total: number;
  items: BackendLeaderboardEntry[];
}

interface BackendLeaderboardMeResponse {
  entry: BackendLeaderboardEntry | null;
}

interface BackendLeaderboardOverviewResponse {
  total_degens: string | number;
  total_aped: string | number;
}

interface BackendMeritLedgerResponse {
  season_rank: string | number | null;
}

interface BackendMeritsLeaderboardResponse {
  you: {
    rank_percent?: string | number | null;
  } | null;
}

export interface LeaderboardResponse {
  period: BackendLeaderboardResponse['period'];
  sortBy: LeaderboardSortBy;
  page: number;
  pageSize: number;
  total: number;
  rows: LeaderboardRow[];
}

export interface LeaderboardOverview {
  totalDegens: string;
  totalAped: string;
}

export interface MeritsRank {
  position: number | null;
  topPercent: string | null;
}

interface FetchLeaderboardParams {
  period: LeaderboardPeriod;
  sortBy?: LeaderboardSortBy;
  page: number;
  pageSize: number;
}

interface FetchLeaderboardMeParams {
  period: LeaderboardPeriod;
  sortBy?: LeaderboardSortBy;
  userAddress: string;
}

const parseLeaderboardNumber = (value: string | number) => {
  const numberValue = Number(
    String(value).replace(/[$,%]/g, '').replace(/,/g, ''),
  );

  if (Number.isNaN(numberValue)) {
    throw new Error(`Invalid leaderboard numeric value: ${value}`);
  }

  return numberValue;
};

const parseNullablePositiveInteger = (
  value: string | number | null | undefined,
  field: string,
) => {
  if (value == null) return null;
  const parsed = Number(String(value).replace('%', ''));
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
  return parsed;
};

export const mapMeritsRank = (
  ledger: BackendMeritLedgerResponse,
  leaderboard: BackendMeritsLeaderboardResponse,
): MeritsRank => ({
  position: parseNullablePositiveInteger(ledger.season_rank, 'season rank'),
  topPercent:
    leaderboard.you?.rank_percent == null
      ? null
      : String(leaderboard.you.rank_percent),
});

const formatLeaderboardCount = (value: string | number) =>
  Math.round(parseLeaderboardNumber(value)).toLocaleString('en-US');

const formatLeaderboardPnl = (value: string | number) => {
  const numericValue = parseLeaderboardNumber(value);
  const sign = numericValue < 0 ? '-' : '+';
  const absoluteValue = Math.abs(numericValue);

  return `${sign}$${absoluteValue.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
};

const formatLeaderboardUsdCompact = (value: string | number) => {
  const numericValue = parseLeaderboardNumber(value);
  const absoluteValue = Math.abs(numericValue);
  const units = [
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ];
  const unit = units.find(({ threshold }) => absoluteValue >= threshold);

  if (!unit) {
    return `$${absoluteValue.toFixed(2)}`;
  }

  return `$${(absoluteValue / unit.threshold).toFixed(2)}${unit.suffix}`;
};

const formatLeaderboardWinRate = (
  winCount: string | number | undefined,
  totalTrades: string | number | undefined,
) => {
  if (totalTrades === undefined) {
    return LEADERBOARD_BACKEND_TODO_VALUE;
  }

  const numericTotalTrades = parseLeaderboardNumber(totalTrades);

  if (numericTotalTrades === 0) {
    return '—';
  }

  if (winCount === undefined) {
    return LEADERBOARD_BACKEND_TODO_VALUE;
  }

  return `${((parseLeaderboardNumber(winCount) / numericTotalTrades) * 100).toFixed(2)}%`;
};

export const mapLeaderboardEntry = (
  entry: BackendLeaderboardEntry,
): LeaderboardRow => {
  const traderAddress = toChecksumAddress(entry.trader);
  const trader = formatAddress(traderAddress);

  return {
    rank: entry.rank,
    rankPercent:
      entry.rank_percent == null ? undefined : String(entry.rank_percent),
    trader,
    traderAddress,
    pnl30d: formatLeaderboardPnl(entry.pnl),
    volume30d: formatLeaderboardUsdCompact(entry.volume),
    trades:
      entry.total_trades === undefined
        ? LEADERBOARD_BACKEND_TODO_VALUE
        : formatLeaderboardCount(entry.total_trades),
    winRate: formatLeaderboardWinRate(entry.win_count, entry.total_trades),
    refereeAllTime:
      entry.referee === undefined
        ? LEADERBOARD_BACKEND_TODO_VALUE
        : formatLeaderboardCount(entry.referee),
    referralVolume: formatLeaderboardUsdCompact(entry.referral_volume),
    mobileTrader: trader,
    mobilePnl: formatLeaderboardPnl(entry.pnl),
    refPoints: formatLeaderboardCount(entry.referral_points),
    totalPoints: formatLeaderboardCount(entry.total_points),
  };
};

export const fetchLeaderboard = async ({
  period,
  sortBy = 'pnl',
  page,
  pageSize,
}: FetchLeaderboardParams): Promise<LeaderboardResponse> => {
  const response = await get<ApiResponse<BackendLeaderboardResponse>>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/leaderboard`,
    {
      period,
      sort_by: sortBy,
      page,
      page_size: pageSize,
    },
  );

  return {
    period: response.data.period,
    sortBy: response.data.sort_by,
    page: response.data.page,
    pageSize: response.data.page_size,
    total: response.data.total,
    rows: response.data.items.map(mapLeaderboardEntry),
  };
};

export const fetchLeaderboardMe = async ({
  period,
  sortBy = 'pnl',
  userAddress,
}: FetchLeaderboardMeParams): Promise<LeaderboardRow | null> => {
  const response = await get<ApiResponse<BackendLeaderboardMeResponse>>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/leaderboard/me`,
    {
      period,
      sort_by: sortBy,
      user_address: toLowerAddressParam(userAddress),
    },
  );

  return response.data.entry ? mapLeaderboardEntry(response.data.entry) : null;
};

export const fetchLeaderboardOverview =
  async (): Promise<LeaderboardOverview> => {
    const response = await get<ApiResponse<BackendLeaderboardOverviewResponse>>(
      `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/leaderboard/overview`,
    );

    return {
      totalDegens: formatLeaderboardCount(response.data.total_degens),
      totalAped: formatLeaderboardUsdCompact(response.data.total_aped),
    };
  };

export const fetchMeritsRank = async (
  userAddress: string,
): Promise<MeritsRank> => {
  const userAddressParam = toLowerAddressParam(userAddress);
  const [ledger, leaderboard] = await Promise.all([
    get<ApiResponse<BackendMeritLedgerResponse>>(
      `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/leaderboard/merit-ledger`,
      { user_address: userAddressParam },
    ),
    get<ApiResponse<BackendMeritsLeaderboardResponse>>(
      `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/leaderboard`,
      {
        period: 'season',
        sort_by: 'merits',
        user_address: userAddressParam,
        page: 1,
        page_size: 10,
      },
    ),
  ]);

  return mapMeritsRank(ledger.data, leaderboard.data);
};
