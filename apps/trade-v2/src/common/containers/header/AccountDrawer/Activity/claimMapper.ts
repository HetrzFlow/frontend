import { msg } from '@lingui/core/macro';
import { i18n } from '@repo/i18n/client';
import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import {
  CONTRACT_USD_MULTIPLIER,
  CREDIT_MARKET_CATEGORY,
} from '@/common/constants';
import type {
  ActivityItem,
  ActivityClaimDetail,
} from '@/common/services/rest/activity';
import { getFallbackMarketIcon } from './marketFallback';
import {
  formatTimelineTimestamp,
  getExplorerTxHref,
  normalizeTimelineTimestampMs,
} from './timelineHelpers';
import type {
  ActivityTimelineChildItem,
  ActivityTimelineIcon,
  ActivityTimelineItem,
  ActivityTimelineValueTone,
} from './types';

type ClaimMapperContext = {
  explorerHost?: string;
  insts: Record<
    string,
    | {
        category?: string;
        icon?: string;
        marketTokenAddress?: string;
        name?: string;
        symbol?: string;
      }
    | undefined
  >;
  instBySymbol?: ReadonlyMap<
    string,
    | {
        category?: string;
        icon?: string;
        marketTokenAddress?: string;
        name?: string;
        symbol?: string;
      }
    | undefined
  >;
  usdAmountDisplayDecimal?: number;
};

function getInstByMarketAddress(
  insts: ClaimMapperContext['insts'],
  market: string | undefined,
) {
  if (!market) return undefined;

  return (
    insts[market] ||
    Object.entries(insts).find(([address, inst]) => {
      const normalizedMarket = market.toLowerCase();
      return (
        address.toLowerCase() === normalizedMarket ||
        inst?.marketTokenAddress?.toLowerCase() === normalizedMarket
      );
    })?.[1]
  );
}

function getClaimLabel() {
  return i18n._(msg`Claim`);
}

function getFundingFeeLabel() {
  return i18n._(msg`Funding Fee`);
}

function getPriceImpactLabel() {
  return i18n._(msg`Price Impact`);
}

function getRewardsLabel() {
  return i18n._(msg`Rewards`);
}

function getValueLabel() {
  return i18n._(msg`Value`);
}

function getTypeLabel() {
  return i18n._(msg`Type`);
}

function getClaimTypeLabels() {
  return {
    collateral: getPriceImpactLabel(),
    funding_fees: getFundingFeeLabel(),
    predeposit_cash: getRewardsLabel(),
  } as const;
}

function formatUsdValue(
  value: string | undefined,
  usdAmountDisplayDecimal: number | undefined,
) {
  if (!value) return EMPTY_DISPLAY;

  try {
    return truncateFormat(
      calc(value).div(CONTRACT_USD_MULTIPLIER).toFixed(),
      usdAmountDisplayDecimal ?? 2,
      {
        style: 'currency',
        currency: 'USD',
        showMinDecimalValue: true,
      },
    );
  } catch {
    return EMPTY_DISPLAY;
  }
}

function getClaimDetailMarketKey(detail: ActivityClaimDetail) {
  return detail.market || detail.market_symbol || '';
}

function getClaimDetailMarketLabel(
  detail: ActivityClaimDetail,
  context: ClaimMapperContext,
) {
  return (
    getInstByMarketAddress(context.insts, detail.market)?.name ||
    detail.market_symbol ||
    detail.market
  );
}

function getDistinctMarketLabels(
  item: ActivityItem,
  context: ClaimMapperContext,
) {
  const labels: string[] = [];
  const seen = new Set<string>();

  item.claim_details?.forEach((detail) => {
    const key = getClaimDetailMarketKey(detail);
    const label = getClaimDetailMarketLabel(detail, context);
    if (!key || !label || seen.has(key)) return;
    seen.add(key);
    labels.push(label);
  });

  if (labels.length > 0) {
    return labels;
  }

  item.market_symbols?.forEach((label) => {
    const key = label || '';
    if (!key || seen.has(key)) return;
    seen.add(key);
    labels.push(label);
  });

  return labels;
}

function getClaimEntityName(item: ActivityItem, context: ClaimMapperContext) {
  const labels = getDistinctMarketLabels(item, context);
  if (!labels.length) {
    return item.symbol || getClaimLabel();
  }
  if (labels.length === 1) {
    return labels[0]!;
  }
  return `${labels[0]} +${labels.length - 1}`;
}

function isCreditMarketClaim(item: ActivityItem, context: ClaimMapperContext) {
  return (item.claim_details || []).some(
    (detail) => isCreditMarketClaimDetail(detail, context),
  );
}

function isCreditMarketClaimDetail(
  detail: ActivityClaimDetail,
  context: ClaimMapperContext,
) {
  return (
    !!detail.market &&
    getInstByMarketAddress(context.insts, detail.market)?.category ===
      CREDIT_MARKET_CATEGORY
  );
}

function getPrimaryMarket(item: ActivityItem) {
  return item.claim_details?.[0] || null;
}

function getInstByMarketAddressOrSymbol(
  market: string | undefined,
  symbol: string | undefined,
  context: ClaimMapperContext,
) {
  const { insts } = context;
  const inst = getInstByMarketAddress(insts, market);

  if (inst) {
    return inst;
  }

  if (symbol) {
    return (
      context.instBySymbol?.get(symbol) ||
      Object.values(insts).find((inst) => inst?.symbol === symbol)
    );
  }

  return undefined;
}

function getClaimIcon(
  item: ActivityItem,
  context: ClaimMapperContext,
): ActivityTimelineIcon {
  const primaryMarket = getPrimaryMarket(item);
  const inst = getInstByMarketAddressOrSymbol(
    primaryMarket?.market || item.market_address,
    primaryMarket?.market_symbol || item.market_symbols?.[0],
    context,
  );
  const icon =
    inst?.icon ||
    getFallbackMarketIcon(primaryMarket?.market_symbol || item.market_symbols?.[0]);

  if (icon) {
    return {
      kind: 'coin',
      src: icon,
      alt: getClaimEntityName(item, context),
    };
  }

  return {
    kind: 'neutral',
    alt: getClaimEntityName(item, context),
  };
}

const CLAIM_TYPE_ORDER = [
  'collateral',
  'funding_fees',
  'predeposit_cash',
] as const;

function getClaimTypeLabel(claimType?: string) {
  const labels = getClaimTypeLabels();
  if (!claimType) return getClaimLabel();
  return labels[claimType as keyof typeof labels] || getClaimLabel();
}

function getAggregatedClaimTypeText(claimTypes?: string[]) {
  const labels = getClaimTypeLabels();
  const uniqueTypes = new Set(claimTypes || []);

  const resolved = CLAIM_TYPE_ORDER.filter((claimType) =>
    uniqueTypes.has(claimType),
  )
    .map((claimType) => labels[claimType])
    .filter(Boolean);

  return resolved.join(' & ') || getClaimLabel();
}

function buildClaimChild(
  detail: ActivityClaimDetail,
  item: ActivityItem,
  context: ClaimMapperContext,
): ActivityTimelineChildItem | null {
  const labels = getClaimTypeLabels();
  if (!detail.claim_type || !labels[detail.claim_type as keyof typeof labels]) {
    return null;
  }

  const title = getClaimDetailMarketLabel(detail, context);
  if (!title) {
    return null;
  }

  const inst = getInstByMarketAddressOrSymbol(
    detail.market,
    detail.market_symbol,
    context,
  );
  const icon = inst?.icon || getFallbackMarketIcon(detail.market_symbol);

  return {
    title,
    icon: icon
      ? {
          kind: 'coin',
          src: icon,
          alt: title,
        }
      : {
          kind: 'neutral',
          alt: title,
        },
    tagText: getClaimLabel(),
    tagTone: 'accent',
    primaryLabel: getValueLabel(),
    primaryText: formatUsdValue(
      detail.amount_usd,
      context.usdAmountDisplayDecimal,
    ),
    primaryTone: 'default' as ActivityTimelineValueTone,
    secondaryLabel: getTypeLabel(),
    secondaryText: getClaimTypeLabel(detail.claim_type),
    secondaryTone: 'default' as ActivityTimelineValueTone,
    timestampText: formatTimelineTimestamp(item.timestamp),
    txHash: item.tx_hash,
    txHref: getExplorerTxHref(context.explorerHost, item.tx_hash),
    isCreditMarket: isCreditMarketClaimDetail(detail, context),
  };
}

export function mapClaimItem(
  item: ActivityItem,
  context: ClaimMapperContext,
): ActivityTimelineItem | null {
  if (item.action_type !== 'claim') return null;

  const children = (item.claim_details || [])
    .map((detail) => buildClaimChild(detail, item, context))
    .filter((detail): detail is ActivityTimelineChildItem => detail !== null);

  const entityName = getClaimEntityName(item, context);

  return {
    id: `claim:${item.tx_hash}:${item.timestamp}`,
    source: 'claim',
    icon: getClaimIcon(item, context),
    entityName,
    entityNameCopyText: entityName,
    tagText: getClaimLabel(),
    tagTone: 'accent',
    primaryLabel: getValueLabel(),
    primaryText: formatUsdValue(
      item.claim_value_usd,
      context.usdAmountDisplayDecimal,
    ),
    primaryTone: 'default',
    secondaryLabel: getTypeLabel(),
    secondaryText: getAggregatedClaimTypeText(item.claim_types),
    secondaryTone: 'default',
    timestampMs: normalizeTimelineTimestampMs(item.timestamp),
    timestampText: formatTimelineTimestamp(item.timestamp),
    txHash: item.tx_hash,
    txHashCopyText: item.tx_hash,
    txHref: getExplorerTxHref(context.explorerHost, item.tx_hash),
    isCreditMarket: isCreditMarketClaim(item, context),
    children: children.length ? children : undefined,
  };
}
