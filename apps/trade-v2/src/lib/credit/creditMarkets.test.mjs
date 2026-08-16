import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CREDIT_CATEGORY,
  CREDIT_ROUTE_PREFIX,
  buildTradeRouteInstId,
  buildTradeRouteInstIdByCategory,
  isCreditCategory,
  parseTradeRouteInstId,
} from './creditMarkets.ts';

test('parses a regular trade route instId', () => {
  assert.deepEqual(parseTradeRouteInstId('BTCUSD'), {
    routeName: 'BTCUSD',
    isCreditMarket: false,
    routeInstId: 'BTCUSD',
  });
});

test('parses a credit trade route instId', () => {
  assert.deepEqual(parseTradeRouteInstId('credit:BTCUSD'), {
    routeName: 'BTCUSD',
    isCreditMarket: true,
    routeInstId: 'credit:BTCUSD',
  });
});

test('builds a credit trade route instId', () => {
  assert.equal(buildTradeRouteInstId('BTCUSD', true), 'credit:BTCUSD');
});

test('builds a regular trade route instId', () => {
  assert.equal(buildTradeRouteInstId('BTCUSD', false), 'BTCUSD');
});

test('detects credit categories', () => {
  assert.equal(isCreditCategory('credit'), true);
  assert.equal(isCreditCategory('crypto'), false);
  assert.equal(CREDIT_CATEGORY, 'credit');
});

test('builds a credit trade route instId from the credit category', () => {
  assert.equal(buildTradeRouteInstIdByCategory('BTCUSD', 'credit'), 'credit:BTCUSD');
  assert.equal(buildTradeRouteInstIdByCategory('BTCUSD', 'crypto'), 'BTCUSD');
});

test('exposes the expected credit route prefix', () => {
  assert.equal(CREDIT_ROUTE_PREFIX, 'credit:');
});
