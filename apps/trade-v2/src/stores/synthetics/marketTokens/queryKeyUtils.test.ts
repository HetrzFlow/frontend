import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeAddressSet } from './queryKeyUtils';

test('serializes reordered addresses to the same query-key segment', () => {
  assert.equal(
    serializeAddressSet(['0xbbb', '0xaaa']),
    serializeAddressSet(['0xaaa', '0xbbb']),
  );
});

test('does not mutate the input address array', () => {
  const addresses = ['0xbbb', '0xaaa'];
  const original = addresses.slice();

  serializeAddressSet(addresses);

  assert.deepEqual(addresses, original);
});

test('accepts readonly address arrays', () => {
  const addresses = ['0xbbb', '0xaaa'] as const;

  assert.equal(serializeAddressSet(addresses), '0xaaa-0xbbb');
});
