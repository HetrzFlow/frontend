import { calc } from '@repo/lib/calc';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
} from '@/common/constants';

function hasValue(value: string | null | undefined) {
  return value !== undefined && value !== null && value !== '';
}

function hasNonZeroValue(value: string | null | undefined) {
  if (!hasValue(value)) return false;

  return !calc(value || '0').eq(0);
}

export function scaleTradeUsd(value: string | null | undefined): string {
  if (!hasValue(value)) return '';
  return calc(value || '0')
    .div(CONTRACT_USD_MULTIPLIER)
    .toFixed();
}

/**
 * Settled loss rebate (USD) derived from raw contract-precision pnl_detail fields.
 * Only applied on losing trades; capped at |grossPnl| so the rebate never exceeds the loss.
 * Returns "0" when no rebate applies; callers should treat 0 as "do not display".
 */
export function getSettledLossRebateUsd(
  pnlDetail:
    | { gross_pnl?: string; loss_rebate?: string }
    | null
    | undefined,
): string {
  if (!pnlDetail) return '0';
  const grossPnlUsd = calc(scaleTradeUsd(pnlDetail.gross_pnl) || 0);
  if (grossPnlUsd.gte(0)) return '0';
  const rawLossRebateUsd = calc(scaleTradeUsd(pnlDetail.loss_rebate) || 0);
  return calc.min(grossPnlUsd.abs(), rawLossRebateUsd).toFixed();
}

export function scaleTradeTokenAmount(
  value: string | null | undefined,
  tokenDecimals: number | undefined,
): string {
  if (!hasValue(value) || tokenDecimals === undefined) return '';
  return calc(value || '0')
    .div(calc(10).pow(tokenDecimals))
    .toFixed();
}

export function scaleTradePrice(
  value: string | null | undefined,
  tokenDecimals: number | undefined,
): string {
  if (!hasNonZeroValue(value) || tokenDecimals === undefined) return '';
  return calc(value || '0')
    .times(calc(10).pow(tokenDecimals))
    .div(CONTRACT_PRECISION_MULTIPLIER)
    .toFixed();
}

export function getTradeEntryPrice(params: {
  isOpen: boolean;
  indexTokenDecimals: number | undefined;
  sizeDeltaUsd?: string | null;
  sizeDeltaTokens?: string | null;
  sizeInUsd?: string | null;
  sizeInTokens?: string | null;
}): string {
  const {
    isOpen,
    indexTokenDecimals,
    sizeDeltaUsd,
    sizeDeltaTokens,
    sizeInUsd,
    sizeInTokens,
  } = params;

  const deltaUsd = scaleTradeUsd(sizeDeltaUsd);
  const deltaTokens = scaleTradeTokenAmount(
    sizeDeltaTokens,
    indexTokenDecimals,
  );
  const hasDelta =
    !!deltaUsd && !!deltaTokens && calc(deltaTokens).abs().gt(0);

  if (isOpen) {
    if (!hasDelta) return '';
    return calc(deltaUsd).div(deltaTokens).toFixed();
  }

  const currentUsd = scaleTradeUsd(sizeInUsd);
  const currentTokens = scaleTradeTokenAmount(sizeInTokens, indexTokenDecimals);
  if (!currentUsd || !currentTokens) return '';

  if (!hasDelta) {
    return calc(currentUsd).div(currentTokens).toFixed();
  }

  const totalTokens = calc(currentTokens).plus(deltaTokens);
  if (!totalTokens.abs().gt(0)) return '';

  return calc(currentUsd).plus(deltaUsd).div(totalTokens).toFixed();
}

export function getTradeExitPrice(params: {
  isLong?: boolean | null;
  indexTokenPriceMin?: string | null;
  indexTokenPriceMax?: string | null;
  executionPrice: string | null | undefined;
  indexTokenDecimals: number | undefined;
}): string {
  const {
    isLong,
    indexTokenPriceMin,
    indexTokenPriceMax,
    executionPrice,
    indexTokenDecimals,
  } = params;

  const resolvedExitPrice =
    isLong === true
      ? hasNonZeroValue(indexTokenPriceMin)
        ? indexTokenPriceMin
        : executionPrice
      : hasNonZeroValue(indexTokenPriceMax)
        ? indexTokenPriceMax
        : executionPrice;

  return scaleTradePrice(resolvedExitPrice, indexTokenDecimals);
}

export function getTradeIndexedMidPrice(params: {
  indexTokenPriceMin?: string | null;
  indexTokenPriceMax?: string | null;
  indexTokenDecimals: number | undefined;
}): string {
  const { indexTokenPriceMin, indexTokenPriceMax, indexTokenDecimals } = params;

  if (
    !hasNonZeroValue(indexTokenPriceMin) ||
    !hasNonZeroValue(indexTokenPriceMax) ||
    indexTokenDecimals === undefined
  ) {
    return '';
  }

  return calc(indexTokenPriceMin || '0')
    .plus(indexTokenPriceMax || '0')
    .div(2)
    .times(calc(10).pow(indexTokenDecimals))
    .div(CONTRACT_PRECISION_MULTIPLIER)
    .toFixed();
}
