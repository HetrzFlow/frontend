import type { HistoryItemDetail } from '@/services/rest/pools';

export type LiquiditySummaryField = 'lp_shares' | 'delta_usd';

type LiquidityHistoryItem = {
  details?: readonly HistoryItemDetail[];
  sub_entries?: readonly HistoryItemDetail[];
  lp_shares?: string;
  delta_usd?: string;
};

export function getLiquidityHistoryDetails(item: LiquidityHistoryItem) {
  return item.details?.length ? item.details : item.sub_entries;
}

export function sumLiquidityDetails(
  details: readonly HistoryItemDetail[],
  field: LiquiditySummaryField,
) {
  let total = 0n;
  let hasValue = false;

  for (const detail of details) {
    const value = detail[field];
    if (value === undefined || value === null || value === '') continue;

    try {
      total += BigInt(value);
      hasValue = true;
    } catch {
      // Keep valid detail values when one malformed value is returned.
    }
  }

  return hasValue ? total : undefined;
}

export function hasSuccessfulLiquidityDetails(item: LiquidityHistoryItem) {
  return (
    getLiquidityHistoryDetails(item)?.some(
      (detail) => detail.status?.trim().toLowerCase() === 'success',
    ) ?? false
  );
}

export function getLiquiditySummaryValue(
  item: LiquidityHistoryItem,
  field: LiquiditySummaryField,
) {
  const details = getLiquidityHistoryDetails(item);
  if (details && details.length > 1) {
    return (sumLiquidityDetails(details, field) ?? item[field])?.toString();
  }

  return item[field];
}
