export const LIQUIDITY_HISTORY_REFRESH_EVENT = 'liquidity-history-refresh';

export type LiquidityHistoryRefreshEventDetail = {
  activityType: 'pool' | 'vault';
  marketAddress: string;
};
