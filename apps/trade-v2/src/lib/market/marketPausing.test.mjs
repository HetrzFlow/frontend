import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isMarketActionBlockedByPausing,
  MARKET_PAUSING_ACTION,
} from './marketPausing.ts';

test('market pausing blocks only opening and collateral increase', () => {
  assert.equal(
    isMarketActionBlockedByPausing({
      isMarketPausing: true,
      action: MARKET_PAUSING_ACTION.openPosition,
    }),
    true,
  );
  assert.equal(
    isMarketActionBlockedByPausing({
      isMarketPausing: true,
      action: MARKET_PAUSING_ACTION.depositCollateral,
    }),
    true,
  );
});

test('market pausing still allows close, decrease, cancel, and withdraw', () => {
  assert.equal(
    isMarketActionBlockedByPausing({
      isMarketPausing: true,
      action: MARKET_PAUSING_ACTION.closePosition,
    }),
    false,
  );
  assert.equal(
    isMarketActionBlockedByPausing({
      isMarketPausing: true,
      action: MARKET_PAUSING_ACTION.withdrawCollateral,
    }),
    false,
  );
  assert.equal(
    isMarketActionBlockedByPausing({
      isMarketPausing: true,
      action: MARKET_PAUSING_ACTION.cancelOrder,
    }),
    false,
  );
});

test('when market is not pausing no action is blocked', () => {
  assert.equal(
    isMarketActionBlockedByPausing({
      isMarketPausing: false,
      action: MARKET_PAUSING_ACTION.openPosition,
    }),
    false,
  );
  assert.equal(
    isMarketActionBlockedByPausing({
      isMarketPausing: false,
      action: MARKET_PAUSING_ACTION.depositCollateral,
    }),
    false,
  );
});
