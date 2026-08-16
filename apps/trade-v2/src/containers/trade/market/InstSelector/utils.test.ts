import assert from 'node:assert/strict';
import test from 'node:test';
import { getMarketSearchRank, normalizeMarketSearch } from './utils';

test('normalizes USD market symbols for search', () => {
  assert.equal(normalizeMarketSearch('D/USD'), 'd');
  assert.equal(normalizeMarketSearch('USD/JPY'), 'jpy');
});

test('ranks an exact market name ahead of prefix and partial matches', () => {
  const searchKey = normalizeMarketSearch('D');

  assert.ok(
    getMarketSearchRank('D/USD', searchKey) >
      getMarketSearchRank('DOGE/USD', searchKey),
  );
  assert.ok(
    getMarketSearchRank('DOGE/USD', searchKey) >
      getMarketSearchRank('AMD/USD', searchKey),
  );
});
