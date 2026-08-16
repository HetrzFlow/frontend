import assert from 'node:assert/strict';
import test from 'node:test';
import { getRequestableMarketAddresses } from './marketTokenQueryUtils';
import type { Address } from 'viem';

const market = '0x0000000000000000000000000000000000000001' as Address;
const indexToken = '0x0000000000000000000000000000000000000002';
const longToken = '0x0000000000000000000000000000000000000003';
const shortToken = '0x0000000000000000000000000000000000000004';
const insts = {
  [market]: {
    indexTokenAddress: indexToken,
    longTokenAddress: longToken,
    shortTokenAddress: shortToken,
  },
};
const coins = {
  [indexToken]: { decimals: 18 },
  [longToken]: { decimals: 6 },
  [shortToken]: { decimals: 6 },
};
const price = { minPrice: 1n, maxPrice: 1n };

test('waits for every required market price before requesting LP price', () => {
  assert.deepEqual(
    getRequestableMarketAddresses(
      [market],
      insts,
      { [indexToken]: price, [longToken]: price },
      coins,
    ),
    [],
  );

  assert.deepEqual(
    getRequestableMarketAddresses(
      [market],
      insts,
      {
        [indexToken]: price,
        [longToken]: price,
        [shortToken]: price,
      },
      coins,
    ),
    [market],
  );
});
