import assert from 'node:assert/strict';
import test from 'node:test';
import { getMaxPoolTradeAmount } from './poolTradeLimit';

const USDT_DECIMALS = 6;
const USD_DECIMALS = 30;
const USD_SCALE = 10n ** BigInt(USD_DECIMALS);

test('converts the USD capacity to the pay token amount', () => {
  const maxAmount = getMaxPoolTradeAmount({
    remainingCapacity: 100n * USD_SCALE,
    payTokenLimitPriceUsd: 2n * USD_SCALE,
    payTokenDecimals: USDT_DECIMALS,
  });

  assert.equal(maxAmount, 50n * 10n ** BigInt(USDT_DECIMALS));
});

test('uses the stricter token amount capacity for max autofill', () => {
  const maxAmount = getMaxPoolTradeAmount({
    remainingCapacity: 100n * USD_SCALE,
    remainingAmountCapacity: 80n * 10n ** BigInt(USDT_DECIMALS),
    payTokenLimitPriceUsd: USD_SCALE,
    payTokenDecimals: USDT_DECIMALS,
  });

  assert.equal(maxAmount, 80n * 10n ** BigInt(USDT_DECIMALS));
});
