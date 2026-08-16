// order side
export enum SIDE {
  'buy' = 'buy',
  'sell' = 'sell',
}

// trade type
export enum TRADE_TYPE {
  'long' = 'long',
  'short' = 'short',
  'swap' = 'swap',
}

// order type
export enum ORDER_TYPE {
  'market' = 'market',
  'limit' = 'limit',
  'trigger' = 'trigger',
  'take_profit' = 'take_profit',
  'stop_loss' = 'stop_loss',
  'tp/sl' = 'tp/sl',
  'liquidated' = 'liquidated',
}

// position side
export enum POS_SIDE {
  'long' = 'long',
  'short' = 'short',
}

// candlesticks period
export enum CANDLESTICKS_PERIOD {
  '1d' = '1d',
  '3d' = '3d',
  '5d' = '5d',
  '7d' = '7d',
  '30d' = '30d',
  '12h' = '12h',
  '4h' = '4h',
  '1h' = '1h',
  '15m' = '15m',
  '5m' = '5m',
  '3m' = '3m',
  '1m' = '1m',
}

// Liquidity taker or maker of the last filled, T: taker M: maker
export enum EXEC_TYPE {
  T = 'T',
  M = 'M',
}

// order state
export enum ORDER_STATE {
  canceled = 'canceled',
  live = 'live',
  partially_filled = 'partially_filled',
  filled = 'filled',
}

// trigger type
export enum ORDER_TRIGGER_TYPE {
  // above to trigger
  up = 1,
  // below to trigger
  down = 0,
}

// order container tab
export enum ORDER_TAB_VALUE {
  POSITION = 'positions',
  ORDER = 'perpOrders',
  HISTORY = 'history',
  SWAP = 'swaps',
  CLAIM = 'claim',
}

// strategy banner market colors (ranked by exposure desc)
export const STRATEGY_MARKET_COLORS = [
  '#0F7F98',
  '#168EA6',
  '#08A7A5',
  '#73CDCC',
  '#B8C5C9',
] as const;

// strategy banner others color
export const STRATEGY_MARKET_OTHERS_COLOR = '#B8C5C9';
