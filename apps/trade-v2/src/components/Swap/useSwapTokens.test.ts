import assert from 'node:assert/strict';
import test from 'node:test';

import { getSupportedWalletTokenGroups, getSwapTokenValue } from './tokenValue';
import { fetchSwapTokenByAddress, type SwapToken } from './useSwapTokens';

const token: SwapToken = {
  chainId: 56,
  address: '0x1',
  name: 'Token',
  symbol: 'TOKEN',
  decimals: 6,
  logoURI: '',
  price: '2.5',
};

test('derives token balance and USD holding value from wallet balance', () => {
  assert.deepEqual(getSwapTokenValue(token, 1_250_000n), {
    balance: '1.25',
    usdValue: '3.125',
  });
  assert.deepEqual(getSwapTokenValue(token), {
    balance: '0',
    usdValue: '0',
  });
});

test('groups supported wallet tokens by holding value', () => {
  const supportedToken = (
    address: string,
    symbol: string,
    balance: string,
    usdValue?: string,
  ): SwapToken => ({ ...token, address, symbol, balance, usdValue });

  const groups = getSupportedWalletTokenGroups([
    supportedToken('0x2', 'MID', '2', '2'),
    supportedToken('0x1', 'HIGH', '1', '10'),
    supportedToken('0x3', 'LOW', '3', '0.5'),
    supportedToken('0x4', 'NO_PRICE', '4'),
    supportedToken('0x5', 'EMPTY', '0', '20'),
    supportedToken('0x1', 'DUPLICATE', '1', '10'),
  ]);

  assert.deepEqual(
    groups.tokens.map(({ symbol }) => symbol),
    ['HIGH', 'MID'],
  );
  assert.deepEqual(
    groups.hiddenTokens.map(({ symbol }) => symbol),
    ['LOW', 'NO_PRICE'],
  );
});

test('forwards cancellation when fetching token metadata', async (t) => {
  const address = '0x1111111111111111111111111111111111111111';
  const controller = new AbortController();

  t.mock.method(
    globalThis,
    'fetch',
    async (
      _input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      assert.equal(init?.signal, controller.signal);
      return new Response(
        JSON.stringify({
          code: 0,
          data: {
            coin_list: [
              {
                chainId: 56,
                address,
                name: 'Route Token',
                symbol: 'ROUTE',
                decimals: 18,
                logoURI: '',
              },
            ],
          },
        }),
        { status: 200 },
      );
    },
  );

  assert.equal(
    (await fetchSwapTokenByAddress(address, controller.signal)).symbol,
    'ROUTE',
  );
});
