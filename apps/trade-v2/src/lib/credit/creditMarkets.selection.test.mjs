import assert from 'node:assert/strict';
import test from 'node:test';

import { selectInstForTradeRoute } from './creditMarkets.ts';

const regularInst = {
  id: 'regular-market',
  symbol: 'BTC/USD',
  name: 'BTCUSD',
  category: 'crypto',
};

const creditInst = {
  id: 'credit-market',
  symbol: 'BTC/USD',
  name: 'BTCUSD',
  category: 'credit',
};

test('selects the regular inst when the route is not a credit market route', () => {
  const selected = selectInstForTradeRoute({
    insts: [regularInst, creditInst],
    routeName: 'BTCUSD',
    isCreditMarketRoute: false,
  });

  assert.equal(selected?.id, 'regular-market');
});

test('selects the credit inst when the route is a credit market route', () => {
  const selected = selectInstForTradeRoute({
    insts: [regularInst, creditInst],
    routeName: 'BTCUSD',
    isCreditMarketRoute: true,
  });

  assert.equal(selected?.id, 'credit-market');
});

test('falls back to the first matching symbol when no credit category match exists', () => {
  const selected = selectInstForTradeRoute({
    insts: [{ ...regularInst, id: 'only-regular' }],
    routeName: 'BTCUSD',
    isCreditMarketRoute: true,
  });

  assert.equal(selected?.id, 'only-regular');
});

test('keeps the preferred market when multiple markets share a route name', () => {
  const secondRegularInst = {
    ...regularInst,
    id: 'second-regular-market',
  };
  const selected = selectInstForTradeRoute({
    insts: [regularInst, secondRegularInst],
    routeName: 'BTCUSD',
    isCreditMarketRoute: false,
    preferredInstId: secondRegularInst.id,
  });

  assert.equal(selected?.id, 'second-regular-market');
});
