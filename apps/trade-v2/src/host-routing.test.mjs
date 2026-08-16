import assert from 'node:assert/strict';
import test from 'node:test';

import { getTradeRoutingDecision } from './host-routing.ts';

test('allows trade requests on the testnet host', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'test.example.com',
    pathname: '/trade',
    mainnetHost: 'app.example.com',
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, { type: 'next' });
});

test('redirects trade requests to maintenance when maintenance redirect is enabled', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'test.example.com',
    pathname: '/zh/trade',
    mainnetHost: 'app.example.com',
    redirectMaintenance: true,
    maintenanceUrl: 'https://maintenance.example.com',
  });

  assert.deepEqual(decision, {
    type: 'redirect',
    destinationUrl: 'https://maintenance.example.com',
    statusCode: 307,
  });
});

test('rewrites trade requests on the mainnet host to a blocked not-found route', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'app.example.com',
    pathname: '/trade',
    mainnetHost: 'app.example.com',
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/en/_blocked-not-found',
  });
});

test('ignores port suffixes in the host header', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'app.example.com:3002',
    pathname: '/trade/orders',
    mainnetHost: 'app.example.com',
    redirectMaintenance: false,
  });

  assert.equal(decision.type, 'rewrite');
});

test('normalizes env host values before matching', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'app.example.com',
    pathname: '/trade',
    mainnetHost: 'HTTPS://APP.EXAMPLE.COM:443',
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/en/_blocked-not-found',
  });
});

test('rewrites locale-prefixed trade requests on the mainnet host to a blocked not-found route', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'app.example.com',
    pathname: '/zh/trade',
    mainnetHost: 'app.example.com',
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/zh/_blocked-not-found',
  });
});

test('does not treat prefixed non-trade paths as trade routes', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'app.example.com',
    pathname: '/trademark',
    mainnetHost: 'app.example.com',
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, { type: 'next' });
});

test('rewrites pools requests on the mainnet host to a blocked not-found route', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'app.example.com',
    pathname: '/pools',
    mainnetHost: 'app.example.com',
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/en/_blocked-not-found',
  });
});

test('redirects vaults requests to maintenance when maintenance redirect is enabled', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'test.example.com',
    pathname: '/zh/vaults',
    mainnetHost: 'app.example.com',
    redirectMaintenance: true,
    maintenanceUrl: 'https://maintenance.example.com',
  });

  assert.deepEqual(decision, {
    type: 'redirect',
    destinationUrl: 'https://maintenance.example.com',
    statusCode: 307,
  });
});

test('rewrites dashboard requests on the mainnet host to a blocked not-found route', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'app.example.com',
    pathname: '/dashboard',
    mainnetHost: 'app.example.com',
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/en/_blocked-not-found',
  });
});

test('passes through non-trade paths', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'app.example.com',
    pathname: '/markets',
    mainnetHost: 'app.example.com',
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, { type: 'next' });
});

test('does not treat the removed Points paths as trade routes', () => {
  for (const pathname of ['/points', '/zh-Hans/points']) {
    const decision = getTradeRoutingDecision({
      hostHeader: 'app.example.com',
      pathname,
      mainnetHost: 'app.example.com',
      redirectMaintenance: false,
    });

    assert.deepEqual(decision, { type: 'next' });
  }
});

test('rewrites the standalone Genesis root without changing the public URL', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/',
    genesisStandalone: true,
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/en/genesis',
  });
});

test('passes the OAuth callback through on the standalone Genesis host', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/auth/callback',
    genesisStandalone: true,
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, { type: 'next' });
});

test('rewrites a supported locale root to its Genesis page', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/zh-Hans',
    genesisStandalone: true,
    supportedLocales: ['en', 'zh-Hans', 'zh-Hant'],
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/zh-Hans/genesis',
  });
});

test('redirects the default-locale root to the standalone canonical root', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/en',
    genesisStandalone: true,
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'redirect-path',
    destinationPathname: '/',
    statusCode: 308,
  });
});

test('redirects a localized Genesis path to its canonical locale root', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/zh-Hant/genesis',
    genesisStandalone: true,
    supportedLocales: ['en', 'zh-Hans', 'zh-Hant'],
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'redirect-path',
    destinationPathname: '/zh-Hant',
    statusCode: 308,
  });
});

test('redirects the unprefixed Genesis path to the canonical root', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/genesis',
    genesisStandalone: true,
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'redirect-path',
    destinationPathname: '/',
    statusCode: 308,
  });
});

test('redirects the default-locale Genesis path to the canonical root', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/en/genesis',
    genesisStandalone: true,
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'redirect-path',
    destinationPathname: '/',
    statusCode: 308,
  });
});

test('rewrites other standalone routes to a not-found page', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/en/vaults',
    genesisStandalone: true,
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/en/_blocked-not-found',
  });
});

test('rewrites nested Genesis paths to a not-found page', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/genesis/unknown',
    genesisStandalone: true,
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/en/_blocked-not-found',
  });
});

test('does not mistake an unsupported locale root for a Genesis route', () => {
  const decision = getTradeRoutingDecision({
    hostHeader: 'early.example.com',
    pathname: '/fr',
    genesisStandalone: true,
    supportedLocales: ['en', 'zh-Hans', 'zh-Hant'],
    redirectMaintenance: false,
  });

  assert.deepEqual(decision, {
    type: 'rewrite',
    destinationPathname: '/en/_blocked-not-found',
  });
});
