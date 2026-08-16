export function resolveTradeIsCreditMarket(trade: unknown) {
  if (!trade || typeof trade !== 'object') {
    return false;
  }

  if (
    'is_credit_market' in trade &&
    typeof trade.is_credit_market === 'boolean'
  ) {
    return trade.is_credit_market;
  }

  return false;
}
