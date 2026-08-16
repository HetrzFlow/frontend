import { msg } from '@lingui/core/macro';
import { i18n } from '@repo/i18n/client';
import { calc } from '@repo/lib/calc';
import { CONTRACT_USD_MULTIPLIER } from '@/common';
import type {
  ClaimHistoryDetailDataType,
  ClaimHistoryItemDataType,
  ClaimHistoryTableDataType,
  ClaimType,
} from './type';

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  collateral: i18n._(msg`Price Impact`),
  funding_fees: i18n._(msg`Funding Fee`),
};

const CLAIM_TYPE_ORDER: ClaimType[] = ['collateral', 'funding_fees'];

const getDistinctMarketKeys = (details: ClaimHistoryDetailDataType[]) => {
  return [
    ...new Set(
      details.map((detail) => `${detail.market}-${detail.market_symbol}`),
    ),
  ];
};

export const isBatchClaimHistory = (item: ClaimHistoryItemDataType) => {
  return item.total_claim_count > 1 || item.details.length > 1;
};

export const getClaimHistoryExtraMarketCount = (
  details: ClaimHistoryDetailDataType[],
) => {
  return Math.max(getDistinctMarketKeys(details).length - 1, 0);
};

export const getClaimHistorySymbolLabel = (item: ClaimHistoryItemDataType) => {
  const firstDetail = item.details[0];
  const marketSymbols = item.market_symbols.filter(Boolean);

  if (firstDetail?.market_symbol) {
    return firstDetail.market_symbol;
  }

  if (marketSymbols.length > 0) {
    return marketSymbols[0]!;
  }

  return '--';
};

export const getClaimHistoryTypeLabel = (item: ClaimHistoryItemDataType) => {
  if (item.details.length === 0) {
    return '--';
  }

  const claimTypes = new Set(item.details.map((detail) => detail.claim_type));

  return CLAIM_TYPE_ORDER.filter((claimType) => claimTypes.has(claimType))
    .map((claimType) => CLAIM_TYPE_LABELS[claimType])
    .join(' & ');
};

export const getClaimHistoryDetailsByMarket = (
  details: ClaimHistoryDetailDataType[],
) => {
  return details.reduce<Record<string, ClaimHistoryDetailDataType[]>>(
    (acc, detail) => {
      const key = detail.market;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(detail);
      return acc;
    },
    {},
  );
};

export const mapClaimHistoryItem = (
  item: ClaimHistoryItemDataType,
): ClaimHistoryTableDataType => {
  const detailsByMarket = getClaimHistoryDetailsByMarket(item.details);
  const firstDetail = item.details[0];

  return {
    kind: 'history',
    id: item.tx_hash,
    tx_hash: item.tx_hash,
    claim_time_ms: item.claim_time_ms,
    total_claim_count: item.total_claim_count,
    total_amount_usd: item.total_amount_usd,
    market_symbols: item.market_symbols,
    details: item.details,
    detailsByMarket,
    symbolLabel: getClaimHistorySymbolLabel(item),
    typeLabel: getClaimHistoryTypeLabel(item),
    valueUsd: item.total_amount_usd,
    primaryMarketAddress: firstDetail?.market,
    isBatch: isBatchClaimHistory(item),
    extraMarketCount: getClaimHistoryExtraMarketCount(item.details),
    claim_type: item.details.length === 1 ? firstDetail?.claim_type : undefined,
  };
};

export const mapClaimHistoryItems = (items: ClaimHistoryItemDataType[]) => {
  return items.map(mapClaimHistoryItem);
};

export const getClaimHistoryValueUsd = (valueUsd: string) => {
  return calc(valueUsd).div(CONTRACT_USD_MULTIPLIER).toFixed();
};
