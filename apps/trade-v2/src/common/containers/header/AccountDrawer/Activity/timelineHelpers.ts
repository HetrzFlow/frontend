import { dateFormat, EMPTY_DISPLAY } from '@repo/lib/format';

export function normalizeTimelineTimestampMs(value?: number | string) {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) return 0;
  return num > 1e12 ? num : num * 1000;
}

export function formatTimelineTimestamp(value?: number | string) {
  const ms = normalizeTimelineTimestampMs(value);
  if (!ms) return EMPTY_DISPLAY;
  return dateFormat(ms, 'yyyy/MM/dd HH:mm:ss');
}

export function getExplorerTxHref(explorerHost: string | undefined, hash?: string) {
  if (!explorerHost || !hash) return undefined;
  return `${explorerHost}/tx/${hash}`;
}
