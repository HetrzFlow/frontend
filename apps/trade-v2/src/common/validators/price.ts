import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { type BN, calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { getCachedPriceTickerData, Position } from '@/common/services';
import { MARKET_PX, MAX_LOSS_RATE } from '@/constants/trade';
import {
  calcCapSlPx,
  calcCapTpPx,
  calcLiqPxByPosition,
} from '@/lib/trade/formulas';
import type {
  MarketConfig,
  MarketValues,
} from '@hertzflow/sdk-v2/types/markets';

type ValidationResult = {
  message: string;
  adjustedValue: string;
};

const EMPTY_VALIDATION_RESULT: ValidationResult = {
  message: '',
  adjustedValue: '',
};

const PRICE_VALIDATION_BUFFER_RATE = '0.0001';

const getPriceValidationBuffer = (referencePx: string | BN) =>
  calc(referencePx).abs().times(PRICE_VALIDATION_BUFFER_RATE);

const gtWithPriceBuffer = (px: BN, thresholdPx: string | BN) =>
  px.gt(calc(thresholdPx).plus(getPriceValidationBuffer(thresholdPx)));

const ltWithPriceBuffer = (px: BN, thresholdPx: string | BN) =>
  px.lt(calc(thresholdPx).minus(getPriceValidationBuffer(thresholdPx)));

const getMarkPx = (symbol: string, markPx?: string) =>
  markPx || getCachedPriceTickerData(symbol)?.[0]?.p;

const formatUsdPrice = (px: string | BN, pxDispDecimal?: number) =>
  truncateFormat(px, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });

const createValidationResult = (
  message: string,
  adjustedValue: string,
): ValidationResult => ({
  message,
  adjustedValue,
});

export const limitPriceValidator = ({
  isLong,
  px,
  symbol,
  markPx: _markPx,
}: {
  isLong: boolean;
  px: string;
  symbol: string;
  markPx?: string;
}) => {
  const markPx = getMarkPx(symbol, _markPx);
  const pxCalc = calc(px);
  if (markPx) {
    // long, px should be less than markPx
    if (isLong && gtWithPriceBuffer(pxCalc, markPx)) {
      return i18n._(msg`Above Max Limit Price`);
    }

    // short, px should be more than markPx
    if (!isLong && ltWithPriceBuffer(pxCalc, markPx)) {
      return i18n._(msg`Below Min Limit Price`);
    }
  }
};

export const tpPxValidator = ({
  tpPx,
  symbol,
  px,
  pxDispDecimal,
  isLong,
  hasPosition,
  nextSizeUsd,
  nextCollateralUsd,
  nextEntryPx,
  allFeeUsd,
  displayPosition = 'btn',
  markPx: _markPx,
  maxProfitRate = 25,
}: {
  tpPx?: string;
  px: string;
  pxDispDecimal?: number;
  symbol: string;
  isLong: boolean;
  hasPosition: boolean;
  nextEntryPx?: string;
  nextSizeUsd?: string;
  nextCollateralUsd?: string;
  allFeeUsd?: string;
  displayPosition?: 'btn' | 'input';
  markPx?: string;
  maxProfitRate?: number;
}): ValidationResult => {
  const isMarket = px === MARKET_PX;
  const markPx = getMarkPx(symbol, _markPx);
  const triggerPx = isMarket ? markPx : px;
  if (!tpPx || !triggerPx) return EMPTY_VALIDATION_RESULT;
  const tpPxCalc = calc(tpPx);

  let message = '';

  // no current position, compare tpPx and triggerPx
  if (!hasPosition) {
    if (isLong && ltWithPriceBuffer(tpPxCalc, triggerPx)) {
      if (displayPosition === 'input') {
        const dispTriggerPx = formatUsdPrice(triggerPx, pxDispDecimal);
        message = isMarket
          ? i18n._(msg`Below Mark Price ${dispTriggerPx}`)
          : i18n._(msg`Below Highest Limit Price ${dispTriggerPx}`);
      } else {
        message = isMarket
          ? i18n._(msg`TP Price Below Mark Price`)
          : i18n._(msg`TP Price Below Highest Limit Price`);
      }
      return createValidationResult(message, triggerPx);
    }

    if (!isLong && gtWithPriceBuffer(tpPxCalc, triggerPx)) {
      if (displayPosition === 'input') {
        const dispTriggerPx = formatUsdPrice(triggerPx, pxDispDecimal);
        message = isMarket
          ? i18n._(msg`Above Mark Price ${dispTriggerPx}`)
          : i18n._(msg`Above Lowest Limit Price ${dispTriggerPx}`);
      } else {
        message = isMarket
          ? i18n._(msg`TP Price Above Mark Price`)
          : i18n._(msg`TP Price Above Lowest Limit Price`);
      }
      return createValidationResult(message, triggerPx);
    }
  } else {
    if (markPx) {
      // there is position, compare tpPx and markPx
      if (isLong && ltWithPriceBuffer(tpPxCalc, markPx)) {
        if (displayPosition === 'input') {
          const dispMarkPx = formatUsdPrice(markPx, pxDispDecimal);
          message = i18n._(msg`Below Mark Price ${dispMarkPx}`);
        } else {
          message = i18n._(msg`TP Price Below Mark Price`);
        }
        return createValidationResult(message, markPx);
      }

      if (!isLong && gtWithPriceBuffer(tpPxCalc, markPx)) {
        if (displayPosition === 'input') {
          const dispMarkPx = formatUsdPrice(markPx, pxDispDecimal);
          message = i18n._(msg`Above Mark Price ${dispMarkPx}`);
        } else {
          message = i18n._(msg`TP Price Above Mark Price`);
        }
        return createValidationResult(message, markPx);
      }
    }
  }
  if (nextSizeUsd && nextCollateralUsd && nextEntryPx) {
    const capTpPx = calcCapTpPx({
      collateralUsd: nextCollateralUsd,
      maxProfitRate: maxProfitRate,
      allFeeUsd: allFeeUsd || '0',
      sizeUsd: nextSizeUsd,
      entryPx: nextEntryPx,
      isLong: isLong,
    });
    if (
      isLong &&
      // TP Price Cap = [(25 * Collateral + Fees) / Size + 1] * Entry Price
      gtWithPriceBuffer(tpPxCalc, capTpPx)
    ) {
      if (displayPosition === 'input') {
        const dispPx = formatUsdPrice(capTpPx.toFixed(), pxDispDecimal);
        message = i18n._(msg`Max TP Price ${dispPx}`);
      } else {
        message = i18n._(msg`Above Max TP Price`);
      }
      return createValidationResult(message, capTpPx.toFixed());
    }

    if (
      !isLong &&
      // TP Price Cap = [-(25 * Collateral + Fees) / Size + 1] * Entry Price
      ltWithPriceBuffer(tpPxCalc, capTpPx)
    ) {
      if (displayPosition === 'input') {
        const dispPx = formatUsdPrice(capTpPx.toFixed(), pxDispDecimal);
        message = i18n._(msg`Min TP Price ${dispPx}`);
      } else {
        message = i18n._(msg`Below Min TP Price`);
      }
      return createValidationResult(message, capTpPx.toFixed());
    }
  }
  return EMPTY_VALIDATION_RESULT;
};

export const slPxValidator = ({
  slPx,
  symbol,
  px,
  isLong,
  hasPosition: _hasPosition,
  position,
  nextSizeUsd,
  nextCollateralUsd,
  nextEntryPx,
  allFeeUsd,
  pxDispDecimal,
  displayPosition = 'btn',
  markPx: _markPx,
  collateralTokenPx,
  marketConfigs,
  marketValues,
  minCollateralUsd,
  liqPx: _liqPx,
  indexTokenDecimals,
  hyperSlLossCeil,
}: {
  slPx?: string;
  px: string;
  symbol: string;
  isLong: boolean;
  position?: Position;
  hasPosition?: boolean;
  nextEntryPx?: string;
  nextSizeUsd?: string;
  nextCollateralUsd?: string;
  allFeeUsd?: string;
  pxDispDecimal?: number;
  displayPosition?: 'btn' | 'input';
  markPx?: string;
  collateralTokenPx?: string;
  marketConfigs?: MarketConfig;
  marketValues?: MarketValues;
  minCollateralUsd?: bigint;
  liqPx?: string;
  indexTokenDecimals?: number;
  /** Hyper mode: max loss rate ceiling (e.g. 0.3 = 30%). SL price must not exceed this loss. */
  hyperSlLossCeil?: number;
}): ValidationResult => {
  const isMarket = px === MARKET_PX;
  const markPx = getMarkPx(symbol, _markPx);
  const triggerPx = isMarket ? markPx : px;

  if (!slPx || !triggerPx) return EMPTY_VALIDATION_RESULT;

  const hasPosition = _hasPosition ?? !!position;
  const slPxCalc = calc(slPx);

  let message = '';
  // no current position, compare slPx and triggerPx
  if (!hasPosition) {
    if (isLong && gtWithPriceBuffer(slPxCalc, triggerPx)) {
      if (displayPosition === 'input') {
        const dispTriggerPx = formatUsdPrice(triggerPx, pxDispDecimal);
        message = isMarket
          ? i18n._(msg`Above Mark Price ${dispTriggerPx}`)
          : i18n._(msg`Above Highest Limit Price ${dispTriggerPx}`);
      } else {
        message = isMarket
          ? i18n._(msg`SL Price Above Mark Price`)
          : i18n._(msg`SL Price Above Max Limit Price`);
      }
      return createValidationResult(message, triggerPx);
    }

    if (!isLong && ltWithPriceBuffer(slPxCalc, triggerPx)) {
      if (displayPosition === 'input') {
        const dispTriggerPx = formatUsdPrice(triggerPx, pxDispDecimal);
        message = isMarket
          ? i18n._(msg`Below Mark Price ${dispTriggerPx}`)
          : i18n._(msg`Below Highest Limit Price ${dispTriggerPx}`);
      } else {
        message = isMarket
          ? i18n._(msg`SL Price Below Mark Price`)
          : i18n._(msg`SL Price Below Min Limit Price`);
      }
      return createValidationResult(message, triggerPx);
    }
  } else {
    if (markPx) {
      // there is position, compare tpPx and markPx
      if (isLong && gtWithPriceBuffer(slPxCalc, markPx)) {
        if (displayPosition === 'input') {
          const dispPx = formatUsdPrice(markPx, pxDispDecimal);
          message = i18n._(msg`Above Mark Price ${dispPx}`);
        } else {
          message = i18n._(msg`SL Price Above Mark Price`);
        }
        return createValidationResult(message, markPx);
      }

      if (!isLong && ltWithPriceBuffer(slPxCalc, markPx)) {
        if (displayPosition === 'input') {
          const dispPx = formatUsdPrice(markPx, pxDispDecimal);
          message = i18n._(msg`Below Mark Price ${dispPx}`);
        } else {
          message = i18n._(msg`SL Price Below Mark Price`);
        }
        return createValidationResult(message, markPx);
      }

      const liqPx =
        _liqPx ??
        calcLiqPxByPosition({
          position: position!,
          collateralTokenPx,
          indexTokenPx: markPx,
          indexTokenDecimals,
          marketConfigs,
          marketValues,
          minCollateralUsd,
        });

      if (
        (isLong && ltWithPriceBuffer(slPxCalc, liqPx)) ||
        (!isLong && gtWithPriceBuffer(slPxCalc, liqPx))
      ) {
        if (displayPosition === 'input') {
          const dispPx = formatUsdPrice(liqPx, pxDispDecimal);
          message = i18n._(msg`Worse than Liq Price ${dispPx}`);
        } else {
          message = i18n._(msg`SL Price worse than Liq Price`);
        }
        return createValidationResult(message, calc(liqPx).toFixed());
      }
    }
  }

  if (nextSizeUsd && nextCollateralUsd && nextEntryPx) {
    const capSlPx = calcCapSlPx({
      collateralUsd: nextCollateralUsd,
      maxLossRate: MAX_LOSS_RATE,
      allFeeUsd: allFeeUsd || '0',
      sizeUsd: nextSizeUsd,
      entryPx: nextEntryPx,
      isLong: isLong,
    });

    if (
      isLong &&
      // TP Price Cap = [(-0.8 * Collateral + Fees) / Size + 1] * Entry Price
      ltWithPriceBuffer(slPxCalc, capSlPx)
    ) {
      if (displayPosition === 'input') {
        const dispPx = formatUsdPrice(capSlPx.toFixed(), pxDispDecimal);
        message = i18n._(msg`Min SL Price ${dispPx}`);
      } else {
        message = i18n._(msg`Below Min SL Price`);
      }
      return createValidationResult(message, capSlPx.toFixed());
    }

    if (
      !isLong &&
      // TP Price Cap = [-(-0.8 * Collateral + Fees) / Size + 1] * Entry Price
      gtWithPriceBuffer(slPxCalc, capSlPx)
    ) {
      if (displayPosition === 'input') {
        const dispPx = formatUsdPrice(capSlPx.toFixed(), pxDispDecimal);
        message = i18n._(msg`Max SL Price ${dispPx}`);
      } else {
        message = i18n._(msg`Above Max SL Price`);
      }
      return createValidationResult(message, capSlPx.toFixed());
    }

    // Hyper mode: SL price must not exceed the ceil loss rate
    if (hyperSlLossCeil !== undefined) {
      const ceilSlPx = calcCapSlPx({
        collateralUsd: nextCollateralUsd,
        maxLossRate: hyperSlLossCeil,
        allFeeUsd: allFeeUsd || '0',
        sizeUsd: nextSizeUsd,
        entryPx: nextEntryPx,
        isLong: isLong,
      });

      if (isLong && gtWithPriceBuffer(slPxCalc, ceilSlPx)) {
        if (displayPosition === 'input') {
          const dispPx = truncateFormat(ceilSlPx, pxDispDecimal, {
            style: 'currency',
            currency: 'USD',
          });
          message = i18n._(msg`Max SL Price ${dispPx}`);
        } else {
          message = i18n._(msg`Above Max SL Price`);
        }
        return { message, adjustedValue: ceilSlPx.toFixed() };
      }

      if (!isLong && ltWithPriceBuffer(slPxCalc, ceilSlPx)) {
        if (displayPosition === 'input') {
          const dispPx = truncateFormat(ceilSlPx, pxDispDecimal, {
            style: 'currency',
            currency: 'USD',
          });
          message = i18n._(msg`Min SL Price ${dispPx}`);
        } else {
          message = i18n._(msg`Below Min SL Price`);
        }
        return { message, adjustedValue: ceilSlPx.toFixed() };
      }
    }
  }

  return EMPTY_VALIDATION_RESULT;
};
