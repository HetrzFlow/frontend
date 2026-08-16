import { get, NET_ERR_CODE } from '@repo/lib/rest';
import { CANDLESTICKS_PERIOD } from '@/constants/enum';
import type { ResolutionString } from '@/lib/charting_library/charting_library';
import { KLINE_API_BASE_URL } from './const';

const BASE_PATH = `${KLINE_API_BASE_URL}/api`;

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

// supported resolutions for stocks
export const stocksSupportedResolutions = [
  '1',
  '5',
  '15',
  '60',
  '240',
  '1D',
] as ResolutionString[];

export const resolutionMap: Record<ResolutionString, CANDLESTICKS_PERIOD> = {
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

// validate resolution, if not need, can delete
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
};

// query history bars
export const getBars = async ({
  launchTime,
  to,
  count: total,
  instId,
  resolution,
  reqMaxCount = 10,
  minLimit = MIN_LIMIT,
}: {
  launchTime?: number;
  to: number;
  count: number;
  instId: string;
  resolution: ResolutionString;
  // request max count, default 5
  reqMaxCount?: number;
  minLimit?: number;
}): Promise<CandleDataType[]> => {
  if (!supportedResolutions.includes(resolution)) {
    return [];
  }
  const interval = resolutionMap[resolution];
  const intervalNum = resolutionIntervalMap[resolution]!;
  // Cap per-request bars by available history. When launchTime is known,
  // requesting more bars than `(to - launchTime) / interval` is wasted —
  // worse on coarse intervals (e.g. 1000 bars of 30D ≈ 82 years).
  const maxLimit = launchTime
    ? Math.min(
        MAX_LIMIT,
        Math.max(1, Math.ceil((to - launchTime) / intervalNum)),
      )
    : MAX_LIMIT;
  const cappedMinLimit = Math.min(minLimit, maxLimit);
  const cappedTotal = Math.min(total, maxLimit);
  const reqArr = [];

  for (let count = 0; count < cappedTotal; count += maxLimit) {
    if (!launchTime || (launchTime && to - count * intervalNum > launchTime)) {
      reqArr.unshift(
        get<BarsResp>(
          `${BASE_PATH}/v1/historyKLines`,
          {
            symbol: instId,
            interval,
            limit: Math.max(
              Math.min(cappedTotal - count, maxLimit),
              cappedMinLimit,
            ),
            end_time: to - count * intervalNum,
          },
          {
            timeout: 10000,
          },
        ),
      );
    }
  }

  let dataArr: BarsResp[];
  try {
    dataArr = await Promise.all(reqArr);
  } catch (err) {
    // 4xx means the request range is fundamentally invalid (e.g. end_time
    // older than what backend serves) — return empty so TV stops paging.
    // Other errors (network/5xx) propagate so the datafeed retry loop kicks in.
    if (
      (err as { code?: string; status?: number })?.code ===
        NET_ERR_CODE.HttpError &&
      ((err as { status?: number }).status ?? 0) >= 400 &&
      ((err as { status?: number }).status ?? 0) < 500
    ) {
      return [];
    }
    throw err;
  }

  const result = dataArr.flatMap(({ data }) => data?.candles || []);
  let extendData: CandleDataType[] = [];
  const isEmpty =
    dataArr[0] && (!dataArr[0].data.candles || !dataArr[0].data.candles.length);

  if (
    (isEmpty || (result[0] && !result[0]?.close)) &&
    launchTime &&
    to - cappedTotal * intervalNum > launchTime &&
    reqMaxCount
  ) {
    try {
      extendData = await getBars({
        launchTime,
        to: to - cappedTotal * intervalNum,
        count: maxLimit,
        instId,
        resolution,
        reqMaxCount: reqMaxCount - 1,
        minLimit,
      });
    } catch {
      extendData = [];
    }
  }

  return extendData.concat(result);
};
