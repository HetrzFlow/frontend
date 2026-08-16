// min remaining sui for gas
export const MIN_REMAINING_SUI = 0.01;

// HzLP min order usd
export const MIN_HZLP_ORDER_USD = 0.05;

//  TODO：hardcode total_weight: 10000
//  TODO: hardcode DELTA_WEIGHT, can query from contract
export const TOTAL_WEIGHT = 10000;
export const DELTA_WEIGHT = 2000;
export const STABLE_THRESHOLD = 200;
export const NON_STABLE_THRESHOLD = 2000;

// HzLP contants
export const HZLP_CONSTANTS = {
  // HzLP symbol
  SYMBOL: 'HzLP',
  SYMBOL_UPPERCASE: 'HZLP',

  // price pair
  PRICE_PAIR: 'HzLP/USD',
  PRICE_PAIR_UPPERCASE: 'HZLP/USD',
  PRICE_PAIRS: ['HzLP/USD', 'HZLP/USD'] as const,
} as const;

// build price pair
export const buildPriceId = (symbol: string): string => {
  // if this is hzlp
  if (
    symbol === HZLP_CONSTANTS.SYMBOL ||
    symbol === HZLP_CONSTANTS.SYMBOL_UPPERCASE
  ) {
    return HZLP_CONSTANTS.PRICE_PAIR;
  }
  // others
  return symbol ? `${symbol}/USD` : '';
};

// whether is hzlp price pair
export const isHzlpPricePair = (priceId: string): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return HZLP_CONSTANTS.PRICE_PAIRS.includes(priceId as any);
};

// debug mode
export const isDebugMode = () => localStorage.getItem('debug') === '1';
