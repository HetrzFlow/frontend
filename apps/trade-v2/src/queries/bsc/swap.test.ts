import assert from 'node:assert/strict';
import test from 'node:test';

import { swapQueryKeys } from './swap';

test('builds deterministic price and account history keys', () => {
  const first = '0x55d398326f99059ff775485246999027b3197955';
  const second = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d';

  assert.deepEqual(
    swapQueryKeys.prices([second, first, second.toUpperCase()]),
    swapQueryKeys.prices([first, second]),
  );
  assert.deepEqual(
    swapQueryKeys.history('0xABC'),
    [
      'bsc-data-query',
      'swap',
      'user-history',
      '0xabc',
      20,
    ],
  );
});
