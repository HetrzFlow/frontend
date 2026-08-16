import { get } from '@repo/lib/rest';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toLowerAddressParam } from '@/lib/address';
import {
  mapSeasonItem,
  mapXpStats,
  type BackendSeasonResponse,
  type BackendXpStatsResponse,
} from './points.adapters';

type ApiResponse<T> = {
  code?: number;
  data: T;
  message?: string;
  msg?: string;
};

export interface SeasonSummary {
  seasonId: string;
  seasonName: string;
  status: 'active' | 'upcoming' | 'ended';
  startAt: string;
  endAt: string;
  poolTotal?: string;
  tradingPct?: number;
  liquidityPct?: number;
  referralPct?: number;
}

export interface SeasonPoint {
  total: string;
  trading: string;
  liquidity: string;
  referral: string;
  estimatedTrading: string;
  estimatedLiquidity: string;
  isEstimated: boolean;
  lastSettledDate: string;
  totalFeesGeneratedUsd: string;
}

export const fetchSeasonList = async (): Promise<SeasonSummary[]> => {
  const response = await get<ApiResponse<{ items: BackendSeasonResponse[] }>>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/point/seasons`,
  );

  return response.data.items.map(mapSeasonItem);
};

export const fetchSeasonPoint = async (
  address: string,
  seasonId: string,
): Promise<SeasonPoint> => {
  const normalizedSeasonId = seasonId === 'all' ? 0 : Number(seasonId);
  const response = await get<ApiResponse<BackendXpStatsResponse>>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/xp/stats`,
    {
      address: toLowerAddressParam(address),
      season_id: normalizedSeasonId,
    },
  );

  return mapXpStats(response.data);
};
