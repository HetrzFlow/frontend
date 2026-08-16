import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getRouteTokenAddresses,
  getRouteTokenQueries,
  getRouteTokenState,
} from './useRouteTokens';
import type { SwapToken } from './useSwapTokens';
import type { ExternalSwapRouteStream } from '@hertzflow/sdk-v2/types/externalSwap';

const token = (address: string): SwapToken => ({
  chainId: 56,
  address,
  name: address,
  symbol: address,
  decimals: 18,
  logoURI: '',
  price: '',
});

test('deduplicates and sorts unknown route token addresses', () => {
  const streams = [
    {
      percentageBps: 10_000,
      hops: [
        {
          providerCode: 'PANCAKEV3',
          pool: '0x4444444444444444444444444444444444444444',
          tokenIn: '0x1111111111111111111111111111111111111111',
          tokenOut: '0x3333333333333333333333333333333333333333',
          amountIn: 1n,
          amountOut: 1n,
          feeRate: '0.0005',
        },
        {
          providerCode: 'PANCAKEV2',
          pool: '0x5555555555555555555555555555555555555555',
          tokenIn: '0x3333333333333333333333333333333333333333',
          tokenOut: '0x2222222222222222222222222222222222222222',
          amountIn: 1n,
          amountOut: 1n,
          feeRate: '0.0025',
        },
      ],
    },
  ] as ExternalSwapRouteStream[];

  assert.deepEqual(
    getRouteTokenAddresses(streams, [
      token('0x1111111111111111111111111111111111111111'),
      token('0x2222222222222222222222222222222222222222'),
    ]),
    ['0x3333333333333333333333333333333333333333'],
  );
});

test('exposes resolved route tokens without waiting for every address', () => {
  const firstAddress = '0x1111111111111111111111111111111111111111';
  const secondAddress = '0x2222222222222222222222222222222222222222';
  const firstToken = token(firstAddress);

  assert.deepEqual(
    getRouteTokenState(
      [],
      [firstAddress, secondAddress],
      [
        { data: firstToken, isError: false },
        { data: undefined, isError: false },
      ],
    ),
    {
      tokenByAddress: {
        [firstAddress]: firstToken,
      },
      statusByAddress: {
        [secondAddress]: 'loading',
      },
    },
  );
});

test('keeps resolved route tokens when another address fails', () => {
  const firstAddress = '0x1111111111111111111111111111111111111111';
  const secondAddress = '0x2222222222222222222222222222222222222222';
  const firstToken = token(firstAddress);

  assert.deepEqual(
    getRouteTokenState(
      [],
      [firstAddress, secondAddress],
      [
        { data: firstToken, isError: false },
        { data: undefined, isError: true },
      ],
    ),
    {
      tokenByAddress: {
        [firstAddress]: firstToken,
      },
      statusByAddress: {
        [secondAddress]: 'error',
      },
    },
  );
});

test('uses an independent cached query for each route token address', () => {
  const firstAddress = '0x1111111111111111111111111111111111111111';
  const secondAddress = '0x2222222222222222222222222222222222222222';

  assert.deepEqual(
    getRouteTokenQueries([firstAddress, secondAddress], true).map(
      ({ queryKey, enabled, retry }) => ({ queryKey, enabled, retry }),
    ),
    [
      {
        queryKey: ['peach', 'swap-token', firstAddress],
        enabled: true,
        retry: 1,
      },
      {
        queryKey: ['peach', 'swap-token', secondAddress],
        enabled: true,
        retry: 1,
      },
    ],
  );
});
