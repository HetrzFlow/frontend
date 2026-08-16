import { get } from '@repo/lib/rest';
import { CANDLESTICKS_PERIOD } from '@/constants/enum';
import type { ResolutionString } from '@/lib/charting_library/charting_library';
import { API_BASE_URL } from './const';

const BASE_PATH = `${API_BASE_URL}/kline-query/api`;

export type CandleDataType = {
  symbol: string;
  close: string;
  high: string;
  low: string;
  open: string;
  interval: string;
  oracle_count: number;
  timestamp: number; // second
  trade_count: number;
  volume: string;
  volume_quote: string;
};

interface BarsResp {
  data: {
    candles: CandleDataType[] | null;
  };
}

// max request 1000 bars; min request 100 bars
const MAX_LIMIT = 1000;
const MIN_LIMIT = 100;

// supported resolutions
export const supportedResolutions = [
  '1S',
  '1',
  '3',
  '5',
  '15',
  '60',
  '240',
  '720',
  '1D',
  '3D',
  '5D',
  '7D',
  '30D',
] as ResolutionString[];

export const resolutionMap: Record<ResolutionString, CANDLESTICKS_PERIOD> = {
  ['1S' as ResolutionString]: CANDLESTICKS_PERIOD['1s'],
  ['1' as ResolutionString]: CANDLESTICKS_PERIOD['1m'],
  ['3' as ResolutionString]: CANDLESTICKS_PERIOD['3m'],
  ['5' as ResolutionString]: CANDLESTICKS_PERIOD['5m'],
  ['15' as ResolutionString]: CANDLESTICKS_PERIOD['15m'],
  ['60' as ResolutionString]: CANDLESTICKS_PERIOD['1h'],
  ['240' as ResolutionString]: CANDLESTICKS_PERIOD['4h'],
  ['720' as ResolutionString]: CANDLESTICKS_PERIOD['12h'],
  ['1D' as ResolutionString]: CANDLESTICKS_PERIOD['1d'],
  ['3D' as ResolutionString]: CANDLESTICKS_PERIOD['3d'],
  ['5D' as ResolutionString]: CANDLESTICKS_PERIOD['5d'],
  ['7D' as ResolutionString]: CANDLESTICKS_PERIOD['7d'],
  ['30D' as ResolutionString]: CANDLESTICKS_PERIOD['30d'],
};

// TODO：validate resolution, if not need, can delete
export const resolutionIntervalMap: Record<string, number> = {
  '1D': 24 * 60 * 60,
  '3D': 3 * 24 * 60 * 60,
  '5D': 5 * 24 * 60 * 60,
  '7D': 7 * 24 * 60 * 60,
  '30D': 30 * 24 * 60 * 60,
  '720': 12 * 60 * 60,
  '240': 4 * 60 * 60,
  '60': 60 * 60,
  '15': 15 * 60,
  '5': 5 * 60,
  '3': 3 * 60,
  '1': 60,
  '1S': 1,
};

// query history bars
export const getBars = async ({
  launchTime,
  to,
  count: total,
  instId,
  resolution,
  reqMaxCount = 5,
}: {
  launchTime?: number;
  to: number;
  count: number;
  instId: string;
  resolution: ResolutionString;
  // request max count, default 5
  reqMaxCount?: number;
}): Promise<CandleDataType[]> => {
  if (!supportedResolutions.includes(resolution)) {
    return [];
  }
  const interval = resolutionMap[resolution];
  const intervalNum = resolutionIntervalMap[resolution]!;
  const reqArr = [];
  for (let count = 0; count <= total; count += MAX_LIMIT) {
    if (!launchTime || (launchTime && to - count * intervalNum > launchTime)) {
      reqArr.unshift(
        get<BarsResp>(
          `${BASE_PATH}/v1/historyKLines`,
          {
            symbol: instId,
            interval,
            limit: Math.max(Math.min(total - count, MAX_LIMIT), MIN_LIMIT),
            end_time: to - count * intervalNum,
          },
          {
            timeout: 10000,
          },
        ),
      );
    }
  }

  const dataArr = await Promise.all(reqArr);

  const result = dataArr.flatMap(({ data }) => data?.candles || []);
  let extendData: CandleDataType[] = [];

  if (
    result[0] &&
    !result[0]?.close &&
    launchTime &&
    to - total * intervalNum > launchTime &&
    reqMaxCount
  ) {
    extendData = await getBars({
      launchTime,
      to: to - total * intervalNum,
      count: 200,
      instId,
      resolution,
      reqMaxCount: reqMaxCount - 1,
    });
  }

  return extendData.concat(result);
};
