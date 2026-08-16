import test from 'node:test';
import assert from 'node:assert/strict';

import { getHomeRoutingDecision } from './host-routing.ts';

test('redirects the testnet host root to the mainnet host root', () => {
  const decision = getHomeRoutingDecision({
    hostHeader: 'test.example.com',
    pathname: '/',
    testnetHost: 'test.example.com',
    mainnetHost: 'app.example.com',
  });

  assert.deepEqual(decision, {
    type: 'redirect',
    destinationHost: 'app.example.com',
    statusCode: 307,
  });
});

test('ignores port suffixes in the host header', () => {
  const decision = getHomeRoutingDecision({
    hostHeader: 'test.example.com:3001',
    pathname: '/',
    testnetHost: 'test.example.com',
    mainnetHost: 'app.example.com',
  });

  assert.equal(decision.type, 'redirect');
});

test('normalizes env host values before matching', () => {
  const decision = getHomeRoutingDecision({
    hostHeader: 'test.example.com',
    pathname: '/',
    testnetHost: 'HTTPS://TEST.EXAMPLE.COM:443',
    mainnetHost: 'https://APP.EXAMPLE.COM',
  });

  assert.deepEqual(decision, {
    type: 'redirect',
    destinationHost: 'app.example.com',
    statusCode: 307,
  });
});

test('passes through locale-prefixed trade requests so microfrontends can route them', () => {
  const decision = getHomeRoutingDecision({
    hostHeader: 'test.example.com',
    pathname: '/zh/trade',
    testnetHost: 'test.example.com',
    mainnetHost: 'app.example.com',
  });

  assert.deepEqual(decision, { type: 'next' });
});

test('passes through locale-prefixed trade requests on the mainnet host so trade-v2 can decide blocking', () => {
  const decision = getHomeRoutingDecision({
    hostHeader: 'app.example.com',
    pathname: '/zh/trade',
    testnetHost: 'test.example.com',
    mainnetHost: 'app.example.com',
  });

  assert.deepEqual(decision, { type: 'next' });
});

test('passes through non-root requests', () => {
  const decision = getHomeRoutingDecision({
    hostHeader: 'test.example.com',
    pathname: '/features',
    testnetHost: 'test.example.com',
    mainnetHost: 'app.example.com',
  });

  assert.deepEqual(decision, { type: 'next' });
});
