import { calc } from '@repo/lib/calc';

import type { Order } from '@/common/services/rest/order';
import type { Position } from '@/common/services/rest/position';

export interface OrderEstimate {
  /** Estimated PnL in USD (gross, before fees) */
  estPnl: string;
  /** Estimated PnL as a ratio relative to collateral delta (e.g. 0.05 = 5%) */
  estPnlPct: string;
  /** Estimated receive amount in USD (collateral delta + gross PnL - fees) */
  estReceive: string;
}

/**
 * Calculate estimated PnL and receive amount for a TP/SL order.
 *
 * Gross PnL:
 *   Long:  (triggerPrice - entryPrice) / entryPrice * sizeDelta
 *   Short: (entryPrice - triggerPrice) / entryPrice * sizeDelta
 *
 * Collateral delta:
 *   order.initialCollateralDeltaAmount * collateralTokenPx
 *
 * Est PnL   = Gross PnL - netCosts
 * Est PnL%  = Est PnL / collateralDelta
 * Est Receive = collateralDelta + Gross PnL - netCosts
 */
export function calcOrderEstimate({
  order,
  position,
  fees = '0',
  collateralTokenPx = '1',
  isCreditMarket = false,
}: {
  order: Order;
  position: Position;
  /** Total net costs in USD for this order (fees adjusted by price impact). */
  fees?: string;
  /** Collateral token price in USD */
  collateralTokenPx?: string;
  /** Credit market receive excludes collateral delta. */
  isCreditMarket?: boolean;
}): OrderEstimate {
  const triggerPrice = calc(order.triggerPrice);
  const entryPrice = calc(position.entryPrice);
  const sizeDeltaUsd = calc(order.sizeDeltaUsd).abs();

  // Gross PnL
  const grossPnl = position.isLong
    ? triggerPrice.minus(entryPrice).div(entryPrice).times(sizeDeltaUsd)
    : entryPrice.minus(triggerPrice).div(entryPrice).times(sizeDeltaUsd);

  // Est PnL = Gross PnL - fees
  const estPnl = grossPnl.minus(fees);

  const collateralDelta = calc(order.initialCollateralDeltaAmount || 0)
    .abs()
    .times(collateralTokenPx);

  // Est PnL% = estPnl / collateralDelta (as ratio, e.g. 0.05 for 5%)
  const estPnlPct = collateralDelta.isZero()
    ? calc(0)
    : estPnl.div(collateralDelta);

  // Est Receive = max(0, collateralDelta + grossPnl - fees)
  // Credit Market receive follows close-dialog semantics and excludes collateral delta.
  const estReceive = calc.max(
    calc(0),
    isCreditMarket
      ? grossPnl.minus(fees)
      : collateralDelta.plus(grossPnl).minus(fees),
  );

  return {
    estPnl: estPnl.toFixed(),
    estPnlPct: estPnlPct.toFixed(),
    estReceive: estReceive.toFixed(),
  };
}
