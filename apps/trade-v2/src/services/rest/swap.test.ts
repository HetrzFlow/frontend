import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mapUserSwapHistory,
  mapRecommendedSwapTokens,
  mapSwapPrices,
  normalizeSwapPriceAddresses,
} from './swap';

const USDT = '0x55d398326f99059ff775485246999027b3197955';
const USDC = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d';

test('normalizes, deduplicates, and sorts price addresses', () => {
  assert.deepEqual(
    normalizeSwapPriceAddresses([USDT.toUpperCase(), 'invalid', USDC, USDT]),
    [USDT, USDC].sort(),
  );
});

test('maps only valid Pyth price statuses', () => {
  assert.deepEqual(
    mapSwapPrices({
      items: [
        {
          address: USDT.toUpperCase(),
          price: '0.999',
          publish_time: 123,
          status: 'normal',
        },
        {
          address: USDC,
          price: '',
          publish_time: 0,
          status: 'no_feed',
        },
        {
          address: USDC,
          price: '1',
          publish_time: 123,
          status: 'invalid' as 'normal',
        },
      ],
    }),
    [
      {
        address: USDT,
        price: '0.999',
        publishTime: 123,
        status: 'normal',
      },
      {
        address: USDC,
        price: '',
        publishTime: 0,
        status: 'no_feed',
      },
    ],
  );
});

test('keeps recommendation metadata required by the selector', () => {
  assert.deepEqual(
    mapRecommendedSwapTokens({
      items: [
        {
          address: USDC.toUpperCase(),
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 18,
          logoURI: 'https://example.com/usdc.png',
        },
      ],
    }),
    [
      {
        address: USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 18,
        logoUri: 'https://example.com/usdc.png',
      },
    ],
  );
});

test('maps user swap history records and preserves token logos', () => {
  assert.deepEqual(
    mapUserSwapHistory(
      {
        items: [
          {
            tx_hash: '0xhash',
            block_time: 123,
            pay_token: {
              address: `0x${USDT.slice(2).toUpperCase()}`,
              symbol: 'USDT',
              logo_uri: 'https://example.com/usdt.png',
            },
            receive_token: {
              address: USDC,
              symbol: 'USDC',
              logoURI: 'https://example.com/usdc.png',
            },
            amount_in: '1.980544235878047564',
            amount_out: '1.982647744717007262',
            usd_value: '1.98',
            status: 'Swap Succeeded',
          },
          {
            tx_hash: '0xother',
            block_time: 124,
            pay_token: { address: USDT, symbol: 'USDT' },
            receive_token: { address: USDC, symbol: 'USDC' },
            amount_in: '1',
            amount_out: '1',
            status: 'Swap Failed',
          },
        ],
      },
      20,
    ),
    [
      {
        id: '0xhash-20',
        txHash: '0xhash',
        timestampMs: 123000,
        payToken: {
          address: USDT,
          symbol: 'USDT',
          logoUri: 'https://example.com/usdt.png',
        },
        receiveToken: {
          address: USDC,
          symbol: 'USDC',
          logoUri: 'https://example.com/usdc.png',
        },
        amountIn: '1.980544235878047564',
        amountOut: '1.982647744717007262',
        usdValue: '1.98',
        status: 'success',
      },
    ],
  );
});

test('uses the page offset when generating stable history ids', () => {
  const records = mapUserSwapHistory(
    {
      items: Array.from({ length: 101 }, (_, index) => ({
        tx_hash: `0x${index}`,
        block_time: index,
        pay_token: { address: USDT, symbol: 'USDT' },
        receive_token: { address: USDC, symbol: 'USDC' },
        amount_in: '1',
        amount_out: '1',
        usd_value: '0',
        status: 'Swap Succeeded',
      })),
    },
    20,
  );

  assert.equal(records.length, 101);
  assert.equal(records.at(-1)?.id, '0x100-120');
  assert.equal(records[0]?.usdValue, null);
});
