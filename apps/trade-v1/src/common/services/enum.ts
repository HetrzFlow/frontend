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
}

// position side
export enum POS_SIDE {
  'long' = 'long',
  'short' = 'short',
}

// trigger type
export enum ORDER_TRIGGER_TYPE {
  // above
  up = 1,
  // below
  down = 0,
}
