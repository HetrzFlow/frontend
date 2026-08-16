import { calc } from '@repo/lib/calc';

export function getCreditMarketReceiveUsd({
  pnlPortionUsd,
  feesUsd,
}: {
  pnlPortionUsd: string;
  feesUsd: string;
}) {
  return calc.max(calc(pnlPortionUsd || '0').minus(feesUsd || '0'), 0).toFixed();
}

export function getLossRebateAdjustedPnl({
  uPnl,
  pendingLossRebateUsd,
  collateralDeltaAmount,
  collateralAmount,
  isCreditMarket,
}: {
  uPnl: string;
  pendingLossRebateUsd: string;
  collateralDeltaAmount: string;
  collateralAmount: string;
  isCreditMarket: boolean;
}) {
  const pnl = calc(uPnl || '0');

  if (isCreditMarket || pnl.gte(0) || calc(collateralAmount || '0').lte(0)) {
    return pnl.toFixed();
  }

  const appliedLossRebate = calc.min(
    calc(pendingLossRebateUsd || '0')
      .times(collateralDeltaAmount || '0')
      .div(collateralAmount),
    pnl.abs(),
  );

  return pnl.plus(appliedLossRebate).toFixed();
}
