import { formatAmount } from '@hertzflow/sdk-v2/utils/numbers';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import {
  EMPTY_DISPLAY,
  percentFormat,
  truncateFormat,
  unitFormat,
} from '@repo/lib/format';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
  CREDIT_TOKEN_DECIMALS,
  CREDIT_TOKEN_SYMBOL,
  HZFL_TOKEN_DECIMALS,
  HZFL_TOKEN_DISPLAY_DECIMALS,
  HZFL_TOKEN_SYMBOL,
  HZLP_TOKEN_DECIMALS,
  ZERO_STR,
} from '@/common/constants';
import type { ActivityItem } from '@/common/services/rest/activity';
import type { Inst } from '@/common/services/rest/inst';
import { getLiquiditySummaryValue } from '@/common/utils/liquidityHistory';
import {
  hasTradeLeverage,
  isTradeDecreaseActionType,
} from '@/common/utils/tradeEventType';
import { getCollateralPriceTokenAddress } from '@/lib/trade/collateralPriceToken';
import {
  getSettledLossRebateUsd,
  getTradeEntryPrice,
  getTradeExitPrice,
  getTradeIndexedMidPrice,
  scaleTradePrice,
} from '@/lib/trade/tradeHistoryPrice';
import { mapClaimItem } from './claimMapper';
import { getFallbackMarketIcon } from './marketFallback';
import {
  formatTimelineTimestamp,
  getExplorerTxHref,
  normalizeTimelineTimestampMs,
} from './timelineHelpers';
import type {
  ActivityTimelineChildItem,
  ActivityTimelineItem,
  ActivityTimelineTagTone,
  ActivityTimelineValueTone,
} from './types';
import type { MarketConfig } from '@hertzflow/sdk-v2/types/markets';

export type ActivityTextLabels = {
  claim: string;
  creditClaim: string;
  hzflClaim: string;
  long: string;
  short: string;
  size: string;
  collateral: string;
  price: string;
  value: string;
  shares: string;
  feeRebate: string;
  referralRebate: string;
  type: string;
  usedHzCredit: string;
  vault: string;
  pool_deposit: string;
  pool_withdraw: string;
  pool_cancelled_deposit: string;
  pool_cancelled_withdraw: string;
  vault_deposit: string;
  vault_withdraw: string;
  vault_cancelled_deposit: string;
  vault_cancelled_withdraw: string;
};

export type TradeEventLabelFn = (actionType: string) => string;
export type TradeEventToneFn = (actionType: string) => string;

type ActivityMapperCoin = {
  decimals: number;
  symbol?: string;
  address?: string;
  icon?: string;
};

type ActivityMapperTokenPrice = {
  minPrice?: bigint;
  maxPrice?: bigint;
};

const FALLBACK_INDEX_TOKEN_DECIMALS = 18;

type ActivityMapperContext = {
  chainId?: number;
  insts: Record<string, Inst>;
  coins: Record<string, ActivityMapperCoin | undefined>;
  pricesMap: Record<string, ActivityMapperTokenPrice | undefined>;
  marketsConfigs?: Record<string, MarketConfig>;
  usdtPrice?: string;
  usdAmountDisplayDecimal: number;
  leverDecimal: number;
  explorerHost?: string;
  labels: ActivityTextLabels;
  getTradeEventLabel: TradeEventLabelFn;
  getTradeEventTone: TradeEventToneFn;
};

type ActivityMapperResolvedContext = ActivityMapperContext & {
  instBySymbol: Map<string, Inst>;
};

function formatCurrencyValue(
  value: string | number | undefined,
  decimals: number,
) {
  if (value === undefined || value === null || value === '')
    return EMPTY_DISPLAY;

  try {
    return truncateFormat(calc(value).abs().toFixed(), decimals, {
      style: 'currency',
      currency: 'USD',
    });
  } catch {
    return EMPTY_DISPLAY;
  }
}

function formatSignedCurrencyValue(
  value: string | number | undefined,
  decimals: number,
) {
  if (value === undefined || value === null || value === '')
    return EMPTY_DISPLAY;

  try {
    return truncateFormat(calc(value).toFixed(), decimals, {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'exceptZero',
    });
  } catch {
    return EMPTY_DISPLAY;
  }
}

function formatLiquidityValue(
  value: string | undefined,
  usdAmountDisplayDecimal: number,
) {
  if (!value) return EMPTY_DISPLAY;

  try {
    return unitFormat(
      calc(value).abs().div(CONTRACT_USD_MULTIPLIER).toFixed(),
      usdAmountDisplayDecimal,
      {
        style: 'currency',
        currency: 'USD',
        showMinDecimalValue: true,
        stripTrailingZeros: true,
      },
    );
  } catch {
    return EMPTY_DISPLAY;
  }
}

function formatReferralRewardValue(
  item: ActivityItem,
  context: ActivityMapperContext,
) {
  if (!item.reward_amount) return EMPTY_DISPLAY;

  const token = item.reward_token_address
    ? context.coins[item.reward_token_address]
    : undefined;

  try {
    const normalizedValue = token
      ? calc(item.reward_amount).div(calc(10).pow(token.decimals)).toFixed()
      : item.reward_amount;

    return unitFormat(normalizedValue, 2, {
      style: 'currency',
      currency: 'USD',
      showMinDecimalValue: true,
      stripTrailingZeros: true,
    });
  } catch {
    return EMPTY_DISPLAY;
  }
}

function normalizeRawAmount(value: string, decimals: number) {
  return calc(value).div(calc(10).pow(decimals)).toFixed();
}

function formatTokenQuantity(value: string | undefined, decimals: number) {
  return formatTokenQuantityWithDisplayDecimals(value, decimals, 2);
}

function formatTokenQuantityWithDisplayDecimals(
  value: string | undefined,
  decimals: number,
  displayDecimals: number,
) {
  if (!value) return EMPTY_DISPLAY;

  try {
    return unitFormat(normalizeRawAmount(value, decimals), displayDecimals, {
      showMinDecimalValue: true,
      stripTrailingZeros: true,
    });
  } catch {
    return EMPTY_DISPLAY;
  }
}

function getUsdTokenPrice(
  usdtPrice: string | undefined,
  coins: Record<string, ActivityMapperCoin | undefined>,
  pricesMap: Record<string, ActivityMapperTokenPrice | undefined>,
) {
  if (usdtPrice) {
    return calc(usdtPrice);
  }

  const usdt = Object.values(coins).find((coin) => coin?.symbol === 'USDT');
  const tokenPrices = usdt?.address ? pricesMap[usdt.address] : undefined;
  const minPrice = tokenPrices?.minPrice ?? tokenPrices?.maxPrice;
  const maxPrice = tokenPrices?.maxPrice ?? tokenPrices?.minPrice;

  if (!minPrice || !maxPrice) {
    return undefined;
  }

  return calc(minPrice.toString())
    .plus(maxPrice.toString())
    .div(2)
    .div(CONTRACT_USD_MULTIPLIER);
}

function formatCreditValueUsd(
  value: string | undefined,
  context: ActivityMapperContext,
) {
  if (!value) return EMPTY_DISPLAY;

  const usdtPrice = getUsdTokenPrice(
    context.usdtPrice,
    context.coins,
    context.pricesMap,
  );
  if (!usdtPrice) return EMPTY_DISPLAY;

  try {
    return unitFormat(
      calc(normalizeRawAmount(value, CREDIT_TOKEN_DECIMALS))
        .times(usdtPrice)
        .toFixed(),
      context.usdAmountDisplayDecimal,
      {
        style: 'currency',
        currency: 'USD',
        showMinDecimalValue: true,
        stripTrailingZeros: true,
      },
    );
  } catch {
    return EMPTY_DISPLAY;
  }
}

function formatUsdtAmountUsd(
  value: string | undefined,
  context: ActivityMapperContext,
) {
  if (!value) return EMPTY_DISPLAY;

  const usdtPrice = getUsdTokenPrice(
    context.usdtPrice,
    context.coins,
    context.pricesMap,
  );
  const usdtDecimals = context.coins.USDT?.decimals;

  if (!usdtPrice || usdtDecimals === undefined) return EMPTY_DISPLAY;

  try {
    return unitFormat(
      calc(normalizeRawAmount(value, usdtDecimals)).times(usdtPrice).toFixed(),
      context.usdAmountDisplayDecimal,
      {
        style: 'currency',
        currency: 'USD',
        showMinDecimalValue: true,
        stripTrailingZeros: true,
      },
    );
  } catch {
    return EMPTY_DISPLAY;
  }
}

function hasPositiveReferralRewardAmount(item: ActivityItem) {
  if (!item.reward_amount) return false;

  try {
    return calc(item.reward_amount).gt(0);
  } catch {
    return false;
  }
}

function formatSharesValue(value?: string) {
  try {
    const parsed = BigInt(value ?? ZERO_STR);
    const normalized = parsed < 0n ? -parsed : parsed;
    return formatAmount(
      normalized,
      HZLP_TOKEN_DECIMALS,
      4,
      true,
      EMPTY_DISPLAY,
    );
  } catch {
    return EMPTY_DISPLAY;
  }
}

function computeLeverageText(
  item: ActivityItem,
  coins: Record<string, ActivityMapperCoin | undefined>,
  context: ActivityMapperContext,
  leverDecimal: number,
): string | undefined {
  const actionType = item.action ?? '';
  if (!hasTradeLeverage(actionType)) return undefined;
  if (!item.size_delta_usd || !item.collateral_delta_amount) return undefined;
  try {
    const collateralToken = item.collateral_token
      ? coins[item.collateral_token]
      : undefined;
    const avgPrice = getCollateralTokenUsdPrice(
      item,
      collateralToken,
      context,
    );
    if (!avgPrice) return undefined;
    const tokenMul = calc(10).pow(collateralToken?.decimals || 0);
    const collateralUsd = calc(item.collateral_delta_amount)
      .abs()
      .div(tokenMul)
      .times(avgPrice);
    if (!collateralUsd.gt(0)) return undefined;
    const leverage = calc(item.size_delta_usd)
      .abs()
      .div(CONTRACT_USD_MULTIPLIER)
      .div(collateralUsd);
    return `${truncateFormat(leverage, leverDecimal, {
      stripTrailingZeros: true,
      round: ROUND_MODE.ROUND,
    })}x`;
  } catch {
    return undefined;
  }
}

function getCollateralTokenUsdPrice(
  item: ActivityItem,
  collateralToken: ActivityMapperCoin | undefined,
  context: ActivityMapperContext,
) {
  if (!collateralToken) return undefined;

  try {
    if (!item.collateral_token) return undefined;

    if (item.collateral_token_price_min && item.collateral_token_price_max) {
      return calc(item.collateral_token_price_max)
        .plus(item.collateral_token_price_min)
        .div(2)
        .times(calc(10).pow(collateralToken.decimals))
        .div(CONTRACT_PRECISION_MULTIPLIER);
    }

    const priceTokenAddress = getCollateralPriceTokenAddress({
      chainId: context.chainId,
      collateralTokenAddress: item.collateral_token,
      isCreditMarket: item.is_credit_market,
      usdtTokenAddress: context.coins.USDT?.address,
    });
    const tokenPrices =
      context.pricesMap[priceTokenAddress || item.collateral_token];
    if (!tokenPrices?.minPrice && !tokenPrices?.maxPrice) return undefined;

    const minPrice = tokenPrices.minPrice ?? tokenPrices.maxPrice;
    const maxPrice = tokenPrices.maxPrice ?? tokenPrices.minPrice;
    if (!minPrice || !maxPrice) return undefined;

    return calc(minPrice.toString())
      .plus(maxPrice.toString())
      .div(2)
      .div(CONTRACT_USD_MULTIPLIER);
  } catch {
    return undefined;
  }
}

function formatSignedCollateralUsd(
  item: ActivityItem,
  coins: Record<string, ActivityMapperCoin | undefined>,
  context: ActivityMapperContext,
  usdAmountDisplayDecimal: number,
  sign: 1 | -1 = 1,
) {
  if (!item.collateral_delta_amount) return EMPTY_DISPLAY;
  const collateralToken = item.collateral_token
    ? coins[item.collateral_token]
    : undefined;
  if (!collateralToken) return EMPTY_DISPLAY;
  try {
    const tokenMul = calc(10).pow(collateralToken.decimals);
    const amount = calc(item.collateral_delta_amount).abs().div(tokenMul);
    const price = getCollateralTokenUsdPrice(item, collateralToken, context);
    if (!price) return EMPTY_DISPLAY;
    return formatSignedCurrencyValue(
      amount.times(price).times(sign).toFixed(),
      usdAmountDisplayDecimal,
    );
  } catch {
    return EMPTY_DISPLAY;
  }
}

function getLiquidityTagTone(
  action: string,
  status?: string,
): ActivityTimelineTagTone {
  const normalizedAction = action.trim().toLowerCase();
  const isCancelled =
    status?.trim().toLowerCase() === 'cancelled' ||
    normalizedAction.includes('cancelled');

  if (isCancelled) return 'neutral';

  if (normalizedAction.includes('withdraw')) return 'down';
  if (normalizedAction.includes('deposit')) return 'accent';
  return 'neutral';
}

function getLiquidityValueTone(action: string): ActivityTimelineValueTone {
  const tagTone = getLiquidityTagTone(action);
  if (tagTone === 'down') return 'down';
  if (tagTone === 'accent') return 'accent';
  return 'default';
}

function getLiquidityTagText(
  source: 'pool' | 'vault',
  action: string,
  status: string | undefined,
  labels: ActivityTextLabels,
) {
  const normalizedAction = action.trim().toLowerCase();
  const isCancelled =
    status?.trim().toLowerCase() === 'cancelled' ||
    normalizedAction.includes('cancelled');
  const isWithdraw = normalizedAction.includes('withdraw');

  if (source === 'pool') {
    if (isCancelled) {
      return isWithdraw
        ? labels.pool_cancelled_withdraw
        : labels.pool_cancelled_deposit;
    }
    return isWithdraw ? labels.pool_withdraw : labels.pool_deposit;
  }

  if (isCancelled) {
    return isWithdraw
      ? labels.vault_cancelled_withdraw
      : labels.vault_cancelled_deposit;
  }
  return isWithdraw ? labels.vault_withdraw : labels.vault_deposit;
}

function buildInstBySymbolLookup(insts: Record<string, Inst | undefined>) {
  const instBySymbol = new Map<string, Inst>();

  Object.values(insts).forEach((inst) => {
    if (!inst?.symbol || instBySymbol.has(inst.symbol)) return;
    instBySymbol.set(inst.symbol, inst);
  });

  return instBySymbol;
}

function getInstByMarketAddressOrSymbol(
  marketAddress: string | undefined,
  symbol: string | undefined,
  context: ActivityMapperResolvedContext,
) {
  if (marketAddress && context.insts[marketAddress]) {
    return context.insts[marketAddress];
  }

  if (symbol) {
    return context.instBySymbol.get(symbol);
  }

  return undefined;
}

function getMarketIcon(inst: Inst | undefined, symbol: string | undefined) {
  return inst?.icon || getFallbackMarketIcon(symbol);
}

function formatTradeExecutionPrice(
  item: ActivityItem,
  isDecrease: boolean,
  context: ActivityMapperResolvedContext,
) {
  const inst = getInstByMarketAddressOrSymbol(
    item.market,
    item.market_symbol,
    context,
  );
  const indexToken = inst?.indexTokenAddress
    ? context.coins[inst.indexTokenAddress]
    : undefined;
  const indexTokenDecimals =
    indexToken?.decimals ?? FALLBACK_INDEX_TOKEN_DECIMALS;

  try {
    const price = isDecrease
      ? getTradeExitPrice({
          isLong: item.is_long,
          indexTokenPriceMin: item.index_token_price_min,
          indexTokenPriceMax: item.index_token_price_max,
          executionPrice: item.execution_price,
          indexTokenDecimals,
        })
      : getTradeEntryPrice({
          isOpen: true,
          indexTokenDecimals,
          sizeDeltaUsd: item.size_delta_usd,
          sizeDeltaTokens: item.size_delta_tokens,
          sizeInUsd: item.size_in_usd,
          sizeInTokens: item.size_in_tokens,
        });
    const midPrice = getTradeIndexedMidPrice({
      indexTokenPriceMin: item.index_token_price_min,
      indexTokenPriceMax: item.index_token_price_max,
      indexTokenDecimals,
    });
    const directIndexTokenPrice = scaleTradePrice(
      item.index_token_price,
      indexTokenDecimals,
    );
    const fallbackPrice = scaleTradePrice(
      item.trigger_price,
      indexTokenDecimals,
    );

    return formatCurrencyValue(
      price || midPrice || directIndexTokenPrice || fallbackPrice,
      inst?.pxDispDecimal ?? 2,
    );
  } catch {
    return EMPTY_DISPLAY;
  }
}

function buildLiquidityChildItem(
  detail: {
    delta_usd?: string;
    lp_shares?: string;
    timestamp?: number;
    executed_tx_hash?: string;
  },
  action: string,
  context: ActivityMapperContext,
): ActivityTimelineChildItem {
  const txHash = detail.executed_tx_hash;
  const primaryTone = getLiquidityValueTone(action);

  return {
    primaryLabel: context.labels.value,
    primaryText: formatLiquidityValue(
      detail.delta_usd,
      context.usdAmountDisplayDecimal,
    ),
    primaryTone,
    secondaryLabel: context.labels.shares,
    secondaryText: formatSharesValue(detail.lp_shares),
    secondaryTone: 'default',
    timestampText: formatTimelineTimestamp(detail.timestamp),
    txHash,
    txHref: getExplorerTxHref(context.explorerHost, txHash),
  };
}

function getActivityLossRebateUsd(item: ActivityItem): string | undefined {
  const settled = getSettledLossRebateUsd(item.pnl_detail);
  return calc(settled).gt(0) ? settled : undefined;
}

function formatLossRebateRate(
  item: ActivityItem,
  context: ActivityMapperResolvedContext,
) {
  const inst = getInstByMarketAddressOrSymbol(
    item.market,
    item.market_symbol,
    context,
  );
  const marketConfig = inst?.marketTokenAddress
    ? context.marketsConfigs?.[inst.marketTokenAddress]
    : undefined;
  const rawRate = marketConfig?.lossRebateRate;

  if (!rawRate) return undefined;

  try {
    return percentFormat(
      calc(rawRate.toString()).div(CONTRACT_USD_MULTIPLIER),
      0,
    );
  } catch {
    return undefined;
  }
}

function formatLossRebateValue(
  lossRebateUsd: string | undefined,
  usdAmountDisplayDecimal: number,
) {
  if (!lossRebateUsd) return undefined;

  try {
    return truncateFormat(lossRebateUsd, usdAmountDisplayDecimal, {
      style: 'currency',
      currency: 'USD',
    });
  } catch {
    return undefined;
  }
}

function mapTradeItem(
  item: ActivityItem,
  context: ActivityMapperResolvedContext,
): ActivityTimelineItem | null {
  if (item.action_type !== 'trade') return null;

  const inst = getInstByMarketAddressOrSymbol(
    item.market,
    item.market_symbol,
    context,
  );
  const entityName =
    inst?.name || item.market_symbol || item.market || EMPTY_DISPLAY;
  const normalizedAction = item.action.trim().toLowerCase();
  const isDecrease =
    isTradeDecreaseActionType(normalizedAction) ||
    normalizedAction.includes('liquidate');

  const sign = isDecrease ? -1 : 1;

  let sizeDeltaUsd = EMPTY_DISPLAY;
  try {
    if (!item.size_delta_usd) throw new Error('missing size delta usd');
    sizeDeltaUsd = formatSignedCurrencyValue(
      calc(item.size_delta_usd)
        .abs()
        .div(CONTRACT_USD_MULTIPLIER)
        .times(sign)
        .toFixed(),
      context.usdAmountDisplayDecimal,
    );
  } catch {
    sizeDeltaUsd = EMPTY_DISPLAY;
  }

  const isHyper = item.is_zfp ?? false;
  const isLong = item.is_long ?? false;
  const directionTone: ActivityTimelineValueTone = isLong ? 'accent' : 'down';
  const lossRebateUsd = !isHyper ? getActivityLossRebateUsd(item) : undefined;

  // action_type aligns with history records (e.g. market_open, limit_close, liquidated)
  const actionType = item.action ?? '';
  const tagText = context.getTradeEventLabel(actionType) || actionType;
  const tagTone = context.getTradeEventTone(
    actionType,
  ) as ActivityTimelineTagTone;

  return {
    id: `trade:${item.tx_hash}:${item.log_index ?? 0}`,
    source: 'trade',
    icon: {
      kind: 'coin',
      src: getMarketIcon(inst, item.market_symbol),
      alt: entityName,
    },
    entityName,
    entityNameCopyText: entityName,
    tagText,
    tagTone: tagTone || 'neutral',
    primaryLabel: context.labels.size,
    primaryText: sizeDeltaUsd,
    primaryTone: 'default',
    secondaryLabel: context.labels.collateral,
    secondaryText: formatSignedCollateralUsd(
      item,
      context.coins,
      context,
      context.usdAmountDisplayDecimal,
      sign,
    ),
    secondaryTone: 'default',
    tertiaryLabel: context.labels.price,
    tertiaryText: formatTradeExecutionPrice(item, isDecrease, context),
    tertiaryTone: 'default',
    timestampMs: normalizeTimelineTimestampMs(item.timestamp),
    timestampText: formatTimelineTimestamp(item.timestamp),
    txHash: item.tx_hash,
    txHashCopyText: item.tx_hash,
    txHref: getExplorerTxHref(context.explorerHost, item.tx_hash),
    isHyper,
    isCreditMarket: item.is_credit_market === true,
    leverageText: computeLeverageText(
      item,
      context.coins,
      context,
      context.leverDecimal,
    ),
    directionText: item.direction
      ? isLong
        ? context.labels.long
        : context.labels.short
      : undefined,
    directionTone,
    lossRebateUsd,
    lossRebateText: formatLossRebateValue(
      lossRebateUsd,
      context.usdAmountDisplayDecimal,
    ),
    lossRebateRateText: formatLossRebateRate(item, context),
    marketAddress: item.market,
  };
}

function mapLiquidityItem(
  item: ActivityItem,
  source: 'pool' | 'vault',
  context: ActivityMapperResolvedContext,
): ActivityTimelineItem | null {
  if (item.action_type !== source) return null;

  const inst = getInstByMarketAddressOrSymbol(
    item.market_address,
    item.symbol,
    context,
  );
  const entityName =
    inst?.name || item.symbol || item.market_address || EMPTY_DISPLAY;
  const txHash = item.executed_tx_hash || item.tx_hash;
  const primaryTone = getLiquidityValueTone(item.action);
  const children = item.sub_entries?.length
    ? item.sub_entries.map((child) =>
        buildLiquidityChildItem(child, item.action, context),
      )
    : undefined;

  return {
    id: `${source}:${item.tx_hash}:${item.timestamp}`,
    source,
    icon:
      source === 'vault'
        ? {
            kind: 'vault',
            alt: entityName,
          }
        : {
            kind: 'coin',
            src: getMarketIcon(inst, item.symbol),
            alt: entityName,
          },
    entityName,
    entityNameCopyText: entityName,
    tagText: getLiquidityTagText(
      source,
      item.action,
      item.status,
      context.labels,
    ),
    tagTone: getLiquidityTagTone(item.action, item.status),
    primaryLabel: context.labels.value,
    primaryText: formatLiquidityValue(
      getLiquiditySummaryValue(item, 'delta_usd'),
      context.usdAmountDisplayDecimal,
    ),
    primaryTone,
    secondaryLabel: context.labels.shares,
    secondaryText: formatSharesValue(
      getLiquiditySummaryValue(item, 'lp_shares'),
    ),
    secondaryTone: 'default',
    timestampMs: normalizeTimelineTimestampMs(item.timestamp),
    timestampText: formatTimelineTimestamp(item.timestamp),
    txHash,
    txHashCopyText: txHash,
    txHref: getExplorerTxHref(context.explorerHost, txHash),
    children,
  };
}

function mapReferralClaimItem(
  item: ActivityItem,
  context: ActivityMapperResolvedContext,
): ActivityTimelineItem | null {
  if (item.action_type !== 'referral_claim') return null;
  if (!hasPositiveReferralRewardAmount(item)) return null;

  const txHash = item.tx_hash;

  return {
    id: `referral_claim:${txHash}:${item.source_log_index ?? 0}`,
    source: 'referral_claim',
    icon: {
      kind: 'referralRebate',
      alt: context.labels.referralRebate,
    },
    entityName: context.labels.referralRebate,
    entityNameCopyText: context.labels.referralRebate,
    tagText: context.labels.claim,
    tagTone: 'accent',
    primaryLabel: context.labels.value,
    primaryText: formatReferralRewardValue(item, context),
    primaryTone: 'default',
    secondaryLabel: context.labels.type,
    secondaryText: context.labels.referralRebate,
    secondaryTone: 'default',
    timestampMs: normalizeTimelineTimestampMs(item.timestamp),
    timestampText: formatTimelineTimestamp(item.timestamp),
    txHash,
    txHashCopyText: txHash,
    txHref: getExplorerTxHref(context.explorerHost, txHash),
    txLinkIcon: 'figmaArrow',
  };
}

function mapCreditClaimItem(
  item: ActivityItem,
  context: ActivityMapperResolvedContext,
): ActivityTimelineItem | null {
  if (item.action_type !== 'credit_claim' && item.action_type !== 'hzfl_claim')
    return null;

  const txHash = item.tx_hash;
  const isHzflClaim = item.action_type === 'hzfl_claim';
  const entityName = isHzflClaim ? HZFL_TOKEN_SYMBOL : CREDIT_TOKEN_SYMBOL;

  return {
    id: `${item.action_type}:${txHash}:${item.source_log_index ?? item.timestamp}`,
    source: item.action_type,
    icon: {
      kind: 'credit',
      alt: entityName,
    },
    entityName,
    entityNameCopyText: entityName,
    tagText: context.labels.claim,
    tagTone: 'accent',
    primaryLabel: context.labels.value,
    primaryText: isHzflClaim
      ? formatTokenQuantityWithDisplayDecimals(
          item.hzfl_amount,
          HZFL_TOKEN_DECIMALS,
          HZFL_TOKEN_DISPLAY_DECIMALS,
        )
      : formatCreditValueUsd(item.credit_amount, context),
    primaryTone: 'default',
    secondaryLabel: context.labels.type,
    secondaryText: isHzflClaim
      ? context.labels.hzflClaim
      : context.labels.creditClaim,
    secondaryTone: 'default',
    timestampMs: normalizeTimelineTimestampMs(item.timestamp),
    timestampText: formatTimelineTimestamp(item.timestamp),
    txHash,
    txHashCopyText: txHash,
    txHref: getExplorerTxHref(context.explorerHost, txHash),
    txLinkIcon: 'figmaArrow',
  };
}

function mapFeeRebateItem(
  item: ActivityItem,
  context: ActivityMapperResolvedContext,
): ActivityTimelineItem | null {
  if (item.action_type !== 'fee_rebate') return null;

  const txHash = item.tx_hash;
  const entityName = 'USDT';
  const usedCreditAmount = item.used_credit_amount;
  const usdtToken = context.coins.USDT;

  return {
    id: `fee_rebate:${txHash}:${item.source_log_index ?? item.timestamp}`,
    source: 'fee_rebate',
    icon: {
      kind: 'coin',
      src: usdtToken?.icon,
      alt: entityName,
    },
    entityName,
    entityNameCopyText: entityName,
    tagText: context.labels.claim,
    tagTone: 'accent',
    primaryLabel: context.labels.value,
    primaryText: formatUsdtAmountUsd(item.rebate_amt_usdt, context),
    primaryTone: 'default',
    secondaryLabel: context.labels.type,
    secondaryText: context.labels.feeRebate,
    secondaryTone: 'default',
    detailLabel: usedCreditAmount ? context.labels.usedHzCredit : undefined,
    detailText: usedCreditAmount
      ? formatTokenQuantity(usedCreditAmount, CREDIT_TOKEN_DECIMALS)
      : undefined,
    detailTone: 'default',
    timestampMs: normalizeTimelineTimestampMs(item.timestamp),
    timestampText: formatTimelineTimestamp(item.timestamp),
    txHash,
    txHashCopyText: txHash,
    txHref: getExplorerTxHref(context.explorerHost, txHash),
    txLinkIcon: 'figmaArrow',
  };
}

export function mapActivityItems(
  items: ActivityItem[],
  context: ActivityMapperContext,
): ActivityTimelineItem[] {
  const resolvedContext: ActivityMapperResolvedContext = {
    ...context,
    instBySymbol: buildInstBySymbolLookup(context.insts),
  };
  const mappedItems: ActivityTimelineItem[] = [];

  for (const item of items) {
    let mapped: ActivityTimelineItem | null = null;

    switch (item.action_type) {
      case 'trade':
        mapped = mapTradeItem(item, resolvedContext);
        break;
      case 'pool':
        mapped = mapLiquidityItem(item, 'pool', resolvedContext);
        break;
      case 'vault':
        mapped = mapLiquidityItem(item, 'vault', resolvedContext);
        break;
      case 'claim':
        mapped = mapClaimItem(item, resolvedContext);
        break;
      case 'referral_claim':
        mapped = mapReferralClaimItem(item, resolvedContext);
        break;
      case 'credit_claim':
        mapped = mapCreditClaimItem(item, resolvedContext);
        break;
      case 'hzfl_claim':
        mapped = mapCreditClaimItem(item, resolvedContext);
        break;
      case 'fee_rebate':
        mapped = mapFeeRebateItem(item, resolvedContext);
        break;
      default:
        break;
    }

    if (mapped) {
      mappedItems.push(mapped);
    }
  }

  return mappedItems;
}
