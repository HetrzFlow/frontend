import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getExclusiveTierCode,
  getVisibleExclusiveTierRows,
} from './referralTierVisibility';

const visibleTierIds = (currentTierId?: number, hiddenTierCode?: string) =>
  getVisibleExclusiveTierRows(
    getExclusiveTierCode(currentTierId, hiddenTierCode),
  ).map((row) => row.id);

test('regular users do not see exclusive tiers', () => {
  assert.deepEqual(visibleTierIds(1), []);
  assert.deepEqual(visibleTierIds(2), []);
  assert.deepEqual(visibleTierIds(3), []);
});

test('OG users see only the OG exclusive tier', () => {
  assert.deepEqual(visibleTierIds(1002), ['og']);
});

test('Alpha and Sigma users see Alpha and Sigma but not OG', () => {
  assert.deepEqual(visibleTierIds(1001), ['alpha', 'sigma']);
  assert.deepEqual(visibleTierIds(1003), ['alpha', 'sigma']);
});

test('hidden tier code is used when the on-chain tier does not identify a VIP', () => {
  assert.deepEqual(visibleTierIds(undefined, ' OG '), ['og']);
  assert.deepEqual(visibleTierIds(3, 'alpha'), ['alpha', 'sigma']);
});
