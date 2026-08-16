import assert from 'node:assert/strict';
import test from 'node:test';

import { i18n } from '@repo/i18n/client';
import { ROUND_MODE } from '@repo/lib/calc';

import { formatSwapTokenAmount, formatSwapUsdAmount } from './format';

i18n.loadAndActivate({ locale: 'en', messages: {} });

test('formats token amounts by magnitude without abbreviating', () => {
  assert.equal(formatSwapTokenAmount('1234.567'), '1,234.57');
  assert.equal(formatSwapTokenAmount('0.00643300'), '0.006433');
  assert.equal(formatSwapTokenAmount('0.00000123456'), '0.00000123');
  assert.equal(formatSwapTokenAmount('0.99996'), '1.00');
  assert.equal(formatSwapTokenAmount('0'), '0');
  assert.equal(formatSwapTokenAmount('0.000000009'), '<0.00000001');
});

test('truncates protected minimum amounts', () => {
  assert.equal(
    formatSwapTokenAmount('0.00643999', ROUND_MODE.DOWN),
    '0.006439',
  );
});

test('formats dollar amounts with fixed cents and small-value thresholds', () => {
  assert.equal(formatSwapUsdAmount('1234.567'), '$1,234.57');
  assert.equal(formatSwapUsdAmount('0'), '$0.00');
  assert.equal(formatSwapUsdAmount('0.009'), '<$0.01');
  assert.equal(formatSwapUsdAmount('0.009', true), '+<$0.01');
  assert.equal(formatSwapUsdAmount(undefined), '-');
});
