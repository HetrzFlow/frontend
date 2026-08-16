import assert from 'node:assert/strict';
import test from 'node:test';

import { scaleHlvDepositAllocations } from './scaleHlvDepositAllocations';

test('scaleHlvDepositAllocations preserves aggregate totals', () => {
  const allocations = scaleHlvDepositAllocations({
    allocations: [
      {
        marketAddress: '0x0000000000000000000000000000000000000001',
        longTokenAmount: 51n,
        shortTokenAmount: 21n,
        minHlvTokens: 1n,
      },
      {
        marketAddress: '0x0000000000000000000000000000000000000002',
        longTokenAmount: 49n,
        shortTokenAmount: 79n,
        minHlvTokens: 1n,
      },
    ],
    totalLongTokenAmount: 10n,
    totalShortTokenAmount: 10n,
    scaleAmount: (amount) => amount / 10n,
  });

  assert.deepEqual(
    allocations.map(({ longTokenAmount, shortTokenAmount }) => ({
      longTokenAmount,
      shortTokenAmount,
    })),
    [
      { longTokenAmount: 5n, shortTokenAmount: 2n },
      { longTokenAmount: 5n, shortTokenAmount: 8n },
    ],
  );
  assert.equal(
    allocations.reduce((sum, allocation) => sum + allocation.longTokenAmount, 0n),
    10n,
  );
  assert.equal(
    allocations.reduce((sum, allocation) => sum + allocation.shortTokenAmount, 0n),
    10n,
  );
});
