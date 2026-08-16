import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getCreditMarketReceiveUsd,
  getLossRebateAdjustedPnl,
} from './creditDisplay.ts';

test('credit market receive excludes collateral and floors at zero', () => {
  assert.equal(
    getCreditMarketReceiveUsd({ pnlPortionUsd: '10', feesUsd: '4' }),
    '6',
  );
  assert.equal(
    getCreditMarketReceiveUsd({ pnlPortionUsd: '3', feesUsd: '4' }),
    '0',
  );
});

test('credit market receive floors at zero when fees exceed pnl', () => {
  assert.equal(
    getCreditMarketReceiveUsd({ pnlPortionUsd: '1', feesUsd: '2' }),
    '0',
  );
});

test('credit market helper excludes collateral from receive', () => {
  assert.equal(
    getCreditMarketReceiveUsd({ pnlPortionUsd: '20', feesUsd: '5' }),
    '15',
  );
});

test('loss rebate adjusts normal market losses by the closed collateral slice', () => {
  assert.equal(
    getLossRebateAdjustedPnl({
      uPnl: '-10',
      pendingLossRebateUsd: '20',
      collateralDeltaAmount: '25',
      collateralAmount: '100',
      isCreditMarket: false,
    }),
    '-5',
  );
});

test('loss rebate is not applied to credit market close estimates', () => {
  assert.equal(
    getLossRebateAdjustedPnl({
      uPnl: '-10',
      pendingLossRebateUsd: '20',
      collateralDeltaAmount: '25',
      collateralAmount: '100',
      isCreditMarket: true,
    }),
    '-10',
  );
});
