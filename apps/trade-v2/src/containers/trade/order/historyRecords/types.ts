export type HistorySharePayload = {
  isLong: boolean;
  marketAddress: string;
  entryPrice: string;
  exitPrice: string;
  sizeDeltaUsd: string;
  collateralDeltaAmount: string;
  collateralTokenPx: string;
  pnlUsd: string;
  pnlPercent: string;
  leverage?: string;
  isZFP?: boolean;
};
