export const MARKET_PAUSING_ACTION = {
  openPosition: 'openPosition',
  depositCollateral: 'depositCollateral',
  closePosition: 'closePosition',
  withdrawCollateral: 'withdrawCollateral',
  cancelOrder: 'cancelOrder',
} as const;

export type MarketPausingAction =
  (typeof MARKET_PAUSING_ACTION)[keyof typeof MARKET_PAUSING_ACTION];

export function isMarketActionBlockedByPausing({
  isMarketPausing,
  action,
}: {
  isMarketPausing: boolean;
  action: MarketPausingAction;
}) {
  if (!isMarketPausing) return false;

  return (
    action === MARKET_PAUSING_ACTION.openPosition ||
    action === MARKET_PAUSING_ACTION.depositCollateral
  );
}
