import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTradeIsCreditMarket } from './tradeCreditFields.ts';

test('resolveTradeIsCreditMarket prefers explicit API field when present', () => {
  assert.equal(
    resolveTradeIsCreditMarket({
      trade_type: 'market',
      is_credit_market: true,
    }),
    true,
  );
  assert.equal(
    resolveTradeIsCreditMarket({
      trade_type: 'credit',
      is_credit_market: false,
    }),
    false,
  );
});

test('resolveTradeIsCreditMarket does not infer from trade_type', () => {
  assert.equal(resolveTradeIsCreditMarket({ trade_type: 'credit' }), false);
  assert.equal(resolveTradeIsCreditMarket({ trade_type: 'market' }), false);
});
