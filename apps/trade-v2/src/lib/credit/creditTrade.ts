export const CREDIT_MARKET_CATEGORY = 'credit';
export const CREDIT_TOKEN_SYMBOL = 'Credit';
export const CREDIT_TOKEN_UI_CONFIG = {
  pxDispDecimal: 4,
  szDispDecimal: 2,
  szInputDecimal: 6,
} as const;
export const CREDIT_TOKEN_DISPLAY_DECIMALS =
  CREDIT_TOKEN_UI_CONFIG.szDispDecimal;
export const CREDIT_TOKEN_INPUT_DECIMALS =
  CREDIT_TOKEN_UI_CONFIG.szInputDecimal;

export function isCreditFeatureEnabled(
  markets: Array<{ category?: string; isView?: boolean }> | undefined,
) {
  return !!markets?.some(
    (market) => market.category === CREDIT_MARKET_CATEGORY && market.isView,
  );
}

export function isCreditMarketInst(inst?: { category?: string }) {
  return inst?.category === CREDIT_MARKET_CATEGORY;
}

export function isTradableCreditMarketInst(
  inst?: { category?: string; is_market_pausing?: boolean },
) {
  return !!inst && isCreditMarketInst(inst) && inst.is_market_pausing !== true;
}
