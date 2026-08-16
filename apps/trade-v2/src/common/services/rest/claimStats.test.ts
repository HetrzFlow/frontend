import assert from 'node:assert/strict';
import test from 'node:test';
import { getAddress } from 'viem';
import { normalizeClaimStats } from './claimStats';
import type { AllClaimableCollaterals } from './statsTypes';

const MARKET = '0x1111111111111111111111111111111111111111';
const TOKEN = '0x2222222222222222222222222222222222222222';
const PRECISION = 10n ** 30n;

function createClaims(
  overrides: Partial<AllClaimableCollaterals['claimable_price_impact'][number]> = {},
): AllClaimableCollaterals {
  return {
    claimable_price_impact: [
      {
        amount: (10n * PRECISION).toString(),
        market_address: MARKET,
        symbol: 'USDT',
        token_address: TOKEN,
        time_key: Math.floor(Date.now() / 1000),
        factor: PRECISION.toString(),
        factor_by_time: '0',
        reduction_factor: '0',
        ...overrides,
      },
    ],
    total_claimed_usd: '25',
  };
}

const constants = {
  claimableCollateralDelay: 3600n,
  claimableCollateralReductionFactor: 0n,
  claimableCollateralTimeDivisor: 1n,
};

test('normalizes claim addresses and applies the claim factor', () => {
  const result = normalizeClaimStats(createClaims(), constants);

  assert.equal(result.claimablePriceImpact.length, 1);
  assert.equal(result.claimablePriceImpact[0]?.market_address, getAddress(MARKET));
  assert.equal(result.claimablePriceImpact[0]?.token_address, getAddress(TOKEN));
  assert.equal(result.claimablePriceImpact[0]?.amount, (10n * PRECISION).toString());
  assert.equal(result.totalClaimedUsd, '25');
});

test('filters claims fully consumed by their reduction factor', () => {
  const result = normalizeClaimStats(
    createClaims({ reduction_factor: PRECISION.toString() }),
    constants,
  );

  assert.deepEqual(result.claimablePriceImpact, []);
});
