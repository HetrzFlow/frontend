import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getExternalSwapRouteStatus,
  getExternalSwapRouteSummary,
  shouldLoadRouteTokens,
} from './routeState';
import type {
  ExternalSwapRouteStream,
  ExternalSwapRouteStreamHop,
} from '@hertzflow/sdk-v2/types/externalSwap';

const state = (
  overrides: Partial<Parameters<typeof getExternalSwapRouteStatus>[0]> = {},
) =>
  getExternalSwapRouteStatus({
    hasInput: true,
    canFetch: true,
    isDebouncing: false,
    isFetching: false,
    hasQuote: false,
    isFrozen: false,
    ...overrides,
  });

test('selects the route UI state and surfaces quote failures', () => {
  assert.equal(state({ hasInput: false }), 'idle');
  assert.equal(state({ canFetch: false }), 'idle');
  assert.equal(state({ isDebouncing: true }), 'finding');
  assert.equal(state(), 'finding');
  assert.equal(state({ isFetching: true }), 'finding');
  assert.equal(
    state({ hasQuote: true, isFetching: true }),
    'ready',
    'an existing quote stays visible during background refresh',
  );
  assert.equal(
    state({ hasQuote: true, error: { code: 'NO_ROUTE' } }),
    'no-route',
    'a failed background refresh makes the quote unavailable',
  );
  assert.equal(state({ error: { code: 'NO_ROUTE' } }), 'no-route');
  assert.equal(state({ error: new Error('network') }), 'error');
  assert.equal(
    state({ hasInput: false, hasQuote: true, isFrozen: true }),
    'ready',
    'the submitted route remains frozen until the transaction finishes',
  );
});

const hop = (providerCode: string): ExternalSwapRouteStreamHop => ({
  providerCode,
  pool: '0x0000000000000000000000000000000000000000',
  tokenIn: '0x0000000000000000000000000000000000000001',
  tokenOut: '0x0000000000000000000000000000000000000002',
  amountIn: 1n,
  amountOut: 1n,
  feeRate: '0.0025',
});

test('summarizes one route without an expand affordance', () => {
  const streams: ExternalSwapRouteStream[] = [
    { percentageBps: 10_000, hops: [hop('PANCAKEV3')] },
  ];

  assert.deepEqual(getExternalSwapRouteSummary(streams), {
    mainProviderCode: 'PANCAKEV3',
    streamCount: 1,
    extraStreamCount: 0,
    canExpand: false,
  });
});

test('uses the first hop of the highest-ranked stream for multiple routes', () => {
  const streams: ExternalSwapRouteStream[] = [
    { percentageBps: 6_000, hops: [hop('PANCAKEV2'), hop('THENAV3')] },
    { percentageBps: 4_000, hops: [hop('UNISWAPV3')] },
  ];

  assert.deepEqual(getExternalSwapRouteSummary(streams), {
    mainProviderCode: 'PANCAKEV2',
    streamCount: 2,
    extraStreamCount: 1,
    canExpand: true,
  });
  assert.equal(getExternalSwapRouteSummary([]), undefined);
});

test('loads route token metadata only after idle or an explicit open', () => {
  assert.equal(
    shouldLoadRouteTokens({
      open: false,
      routeKey: 'current-route',
      idleRouteKey: undefined,
    }),
    false,
  );
  assert.equal(
    shouldLoadRouteTokens({
      open: false,
      routeKey: 'current-route',
      idleRouteKey: 'previous-route',
    }),
    false,
  );
  assert.equal(
    shouldLoadRouteTokens({
      open: false,
      routeKey: 'current-route',
      idleRouteKey: 'current-route',
    }),
    true,
  );
  assert.equal(
    shouldLoadRouteTokens({
      open: true,
      routeKey: 'current-route',
      idleRouteKey: undefined,
    }),
    true,
  );
});
