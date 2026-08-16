export const TRADE_EVENT_OPEN_ACTION_TYPES = new Set([
  'market_open',
  'market_increase',
  'limit_open',
  'limit_increase',
  'created_limit',
  'updated_limit',
  'cancelled_limit',
  'deposit',
]);

export const TRADE_EVENT_DECREASE_ACTION_TYPES = new Set([
  'market_close',
  'market_decrease',
  'limit_close',
  'limit_decrease',
  'tp_close',
  'tp_decrease',
  'sl_close',
  'sl_decrease',
  'liquidated',
  'withdrawal',
]);

export const TRADE_EVENT_LEVERAGE_ACTION_TYPES = new Set([
  'market_open',
  'market_close',
  'limit_open',
  'limit_close',
  'tp_close',
  'tp_decrease',
  'sl_close',
  'sl_decrease',
  'liquidated',
]);

export function isTradeDecreaseActionType(value: string) {
  return TRADE_EVENT_DECREASE_ACTION_TYPES.has(value);
}

export function isTradeOpenActionType(value: string) {
  return TRADE_EVENT_OPEN_ACTION_TYPES.has(value);
}

export function hasTradeLeverage(value: string) {
  return TRADE_EVENT_LEVERAGE_ACTION_TYPES.has(value);
}

export function getTradeEventTypeTone(value: string) {
  switch (value) {
    case 'failed_market_open':
    case 'failed_market_increase':
    case 'failed_market_close':
    case 'failed_market_decrease':
    case 'failed_deposit':
    case 'failed_withdrawal':
    case 'failed_limit':
    case 'failed_tp':
    case 'failed_sl':
    case 'liquidated':
      return 'down';
    default:
      return 'neutral';
  }
}
