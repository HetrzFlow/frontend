export const DAY_MS = 24 * 60 * 60 * 1000;

const Y_TICK_COUNT = 5;

export type ChartPoint = {
  timestamp: number;
  value: number | string | null | undefined;
};
export type ProcessedChartPoint = {
  timestamp: number;
  chartValue: number | null;
};
export type PeriodLike = string | undefined;
export type ChartValueType = 'currency' | 'percent';

/**
 * Replaces the backend's current-day snapshot with the latest live value.
 * Historical points remain untouched; when the backend has not emitted a
 * point for today yet, a point is appended at the start of the UTC day.
 */
export function mergeCurrentDayChartPoint<T extends ChartPoint>(
  points: T[],
  value: ChartPoint['value'],
  now = Date.now(),
): T[] {
  if (value === undefined || value === null || points.length === 0) {
    return value === undefined || value === null
      ? points
      : [...points, { timestamp: getStartOfDay(now), value } as T];
  }

  const currentDay = getStartOfDay(now);
  let currentDayIndex = -1;
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (getStartOfDay(points[index]!.timestamp) === currentDay) {
      currentDayIndex = index;
      break;
    }
  }

  if (currentDayIndex >= 0) {
    return points.map((point, index) =>
      index === currentDayIndex ? { ...point, value } : point,
    );
  }

  return [...points, { timestamp: currentDay, value } as T];
}

type NormalizedChartPoint = ProcessedChartPoint & {
  dayTimestamp: number;
};
type RenderableChartPoint = NormalizedChartPoint & {
  chartValue: number;
};

export function normalizePeriod(period?: PeriodLike) {
  return String(period ?? '').toUpperCase();
}

export function getFixedPeriodDays(period: PeriodLike) {
  const normalized = normalizePeriod(period);
  if (normalized.includes('7D')) return 7;
  if (normalized.includes('30D')) return 30;
  if (normalized.includes('90D')) return 90;
  if (normalized.includes('180D')) return 180;
  return undefined;
}

export function getStepDays(period: PeriodLike, totalDays: number) {
  const normalized = normalizePeriod(period);
  if (normalized.includes('7D')) return 1;
  if (normalized.includes('30D')) return 5;
  if (normalized.includes('90D')) return 15;
  if (normalized.includes('180D')) return 30;

  const dynamicStep = Math.max(1, Math.round(totalDays / 6));
  if (dynamicStep < 10) return dynamicStep;

  return Math.max(5, Math.round(dynamicStep / 5) * 5);
}

export function getStartOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export function getChartDomain(timestamps: number[], period: PeriodLike) {
  if (!timestamps.length) return undefined;

  const first = getStartOfDay(timestamps[0]!);
  const end = getStartOfDay(timestamps[timestamps.length - 1]!);
  if (first === end) {
    return {
      start: first - DAY_MS / 2,
      end: end + DAY_MS / 2,
    };
  }

  const fixedPeriodDays = getFixedPeriodDays(period);
  if (!fixedPeriodDays) {
    return { start: first, end };
  }

  const fixedStart = end - (fixedPeriodDays - 1) * DAY_MS;
  return {
    start: Math.max(first, fixedStart),
    end,
  };
}

export function buildXTicks(
  start: number,
  end: number,
  period: PeriodLike,
  totalDays: number,
) {
  if (start >= end) return [start];

  const stepDays = getStepDays(period, totalDays);
  const stepMs = stepDays * DAY_MS;
  const ticks: number[] = [];

  for (let target = start; target <= end; target += stepMs) {
    ticks.push(target);
  }

  if (ticks[ticks.length - 1] !== end) {
    const lastTick = ticks[ticks.length - 1];
    if (lastTick !== undefined && end - lastTick < stepMs / 2) {
      ticks[ticks.length - 1] = end;
      return ticks;
    }

    ticks.push(end);
  }

  return ticks;
}

export function getXAxisTickAnchor(index: number, lastIndex: number) {
  if (index <= 0) return 'start';
  if (index >= lastIndex) return 'end';
  return 'middle';
}

function getNiceStep(targetStep: number, forceInteger: boolean) {
  if (!Number.isFinite(targetStep) || targetStep <= 0) {
    return forceInteger ? 1 : 0.25;
  }
  const order = Math.pow(10, Math.floor(Math.log10(targetStep)));
  const unit = order / 10;
  const step = Math.ceil(targetStep / unit) * unit;
  return forceInteger ? Math.max(1, Math.ceil(step)) : step;
}

export function buildYAxisTicks(
  values: number[],
  valueType: ChartValueType,
) {
  const clampToZero = valueType === 'currency';
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    minValue = Math.min(minValue, value);
    maxValue = Math.max(maxValue, value);
  }

  if (minValue === Number.POSITIVE_INFINITY) {
    return Array.from({ length: Y_TICK_COUNT }, (_, index) => index);
  }

  if (clampToZero) {
    minValue = Math.max(0, minValue);
    maxValue = Math.max(0, maxValue);
  }

  if (minValue === maxValue) {
    const offset = getNiceStep(
      Math.abs(maxValue || 1) / (Y_TICK_COUNT - 1),
      clampToZero,
    );
    minValue = clampToZero
      ? Math.max(0, minValue - offset * 2)
      : minValue - offset * 2;
    maxValue += offset * 2;
  }

  const forceInteger = clampToZero;
  let step = getNiceStep((maxValue - minValue) / (Y_TICK_COUNT - 1), forceInteger);
  let adjustedStart = Math.floor(minValue / step) * step;
  if (clampToZero) {
    adjustedStart = Math.max(0, adjustedStart);
  }
  let adjustedEnd = adjustedStart + step * (Y_TICK_COUNT - 1);

  while (adjustedEnd < maxValue) {
    step = getNiceStep((maxValue - adjustedStart) / (Y_TICK_COUNT - 1), forceInteger);
    adjustedStart = Math.floor(minValue / step) * step;
    if (clampToZero) {
      adjustedStart = Math.max(0, adjustedStart);
    }
    adjustedEnd = adjustedStart + step * (Y_TICK_COUNT - 1);
  }

  return Array.from(
    { length: Y_TICK_COUNT },
    (_, index) => adjustedStart + step * index,
  );
}

function toChartValue(
  value: ChartPoint['value'],
  valueType: ChartValueType,
  currencyDivisor: number,
) {
  if (value === null || value === undefined || value === '') return null;

  const raw = Number(value);
  if (!Number.isFinite(raw)) return null;

  return valueType === 'currency' ? raw / currencyDivisor : raw;
}

function trimLeadingZeroValuePoints<T extends { chartValue: number | null }>(
  points: T[],
) {
  const firstNonZeroIndex = points.findIndex(
    (item) => item.chartValue !== null && item.chartValue !== 0,
  );

  if (firstNonZeroIndex <= 0) return points;

  return points.slice(firstNonZeroIndex);
}

function isRenderablePoint(
  point: NormalizedChartPoint,
): point is RenderableChartPoint {
  return point.chartValue !== null;
}

export function buildChartData(
  data: Array<ChartPoint>,
  valueType: ChartValueType,
  period: PeriodLike,
  currencyDivisor: number,
): Array<ProcessedChartPoint> {
  const sortedData: NormalizedChartPoint[] = data
    .map((item) => ({
      timestamp: item.timestamp,
      dayTimestamp: getStartOfDay(item.timestamp),
      chartValue: toChartValue(item.value, valueType, currencyDivisor),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const fixedPeriodDays = getFixedPeriodDays(period);
  const windowData = fixedPeriodDays
    ? trimLeadingZeroValuePoints(sortedData)
    : sortedData;
  const renderableWindowData = windowData.filter(isRenderablePoint);

  if (!renderableWindowData.length) return [];

  if (!fixedPeriodDays) {
    return renderableWindowData.map((item) => ({
      timestamp: item.dayTimestamp,
      chartValue: item.chartValue,
    }));
  }

  const end = getStartOfDay(
    renderableWindowData[renderableWindowData.length - 1]!.timestamp,
  );
  const fixedStart = end - (fixedPeriodDays - 1) * DAY_MS;
  const firstDataStart = renderableWindowData[0]!.dayTimestamp;
  const start = Math.max(fixedStart, firstDataStart);
  const pointsByDay = new Map<number, ProcessedChartPoint>();

  for (const item of renderableWindowData) {
    if (item.dayTimestamp < start || item.dayTimestamp > end) continue;
    pointsByDay.set(item.dayTimestamp, {
      timestamp: item.dayTimestamp,
      chartValue: item.chartValue,
    });
  }

  const result: Array<ProcessedChartPoint> = [];
  for (let timestamp = start; timestamp <= end; timestamp += DAY_MS) {
    const point = pointsByDay.get(timestamp);
    if (point) result.push(point);
  }

  return result;
}
