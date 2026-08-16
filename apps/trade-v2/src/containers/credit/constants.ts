export const CREDIT_ASSET_BASE = '/trade-static/credit';

export const CREDIT_ASSETS = {
  coinLarge: `${CREDIT_ASSET_BASE}/m5 1.png`,
  coinSmall: `${CREDIT_ASSET_BASE}/m5 2.png`,
  shareCredit: `${CREDIT_ASSET_BASE}/share-credit.png`,
  sharePoints: `${CREDIT_ASSET_BASE}/share-points.png`,
  shareBgEllipse2: `${CREDIT_ASSET_BASE}/share-bg-ellipse-2.svg`,
  shareBgEllipse3: `${CREDIT_ASSET_BASE}/share-bg-ellipse-3.svg`,
  shareBgEllipse4: `${CREDIT_ASSET_BASE}/share-bg-ellipse-4.svg`,
  shareBgEllipseMask: `${CREDIT_ASSET_BASE}/share-bg-ellipse-mask.png`,
  shareBgEllipse6: `${CREDIT_ASSET_BASE}/share-bg-ellipse-6.svg`,
  shareBgEllipse7: `${CREDIT_ASSET_BASE}/share-bg-ellipse-7.svg`,
  faqLine: `${CREDIT_ASSET_BASE}/faq-plus-horizontal.svg`,
} as const;

export const CREDIT_PAYOUT_SYMBOL_BY_WRAPPER_SYMBOL: Record<string, string> = {
  HFUSD: 'USDT',
  HFUSD1: 'USD1',
};
