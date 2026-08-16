import assert from 'node:assert/strict';
import test from 'node:test';

import { isTradableCreditMarketInst } from './creditTrade.ts';

test('tradable credit market excludes pausing markets', () => {
  assert.equal(
    isTradableCreditMarketInst({
      category: 'credit',
      is_market_pausing: true,
    }),
    false,
  );
  assert.equal(
    isTradableCreditMarketInst({
      category: 'credit',
      is_market_pausing: false,
    }),
    true,
  );
  assert.equal(isTradableCreditMarketInst({ category: 'credit' }), true);
  assert.equal(isTradableCreditMarketInst({ category: 'crypto' }), false);
});
