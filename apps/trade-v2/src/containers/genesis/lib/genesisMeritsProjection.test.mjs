import assert from 'node:assert/strict';
import test from 'node:test';
import { calc } from '@repo/lib/calc';

import {
  calculateAffectedUnmaturedUsd,
  calculateGenesisMeritsLockedPreview,
  calculateProportionalWithdrawUsd,
  calculateRemainingBasePoolMerits,
  calculateUsdValue,
  estimatePostActionBoostRate,
  hasGenesisWithdrawalLoss,
  isLpEstimateEpochCurrent,
  isLpEstimateWithoutActiveEpoch,
} from './genesisMeritsProjection.ts';

const assertDecimalClose = (actual, expected, tolerance = '0.000000001') => {
  assert.ok(
    calc(actual).minus(expected).abs().lte(tolerance),
    `expected ${actual} to be close to ${expected}`,
  );
};

test('projects the current epoch remainder plus future equivalent epochs', () => {
  assert.equal(
    calculateRemainingBasePoolMerits({
      lpPoolTotal: '700',
      epochStartSec: 0,
      epochEndSec: 100,
      seasonEndSec: 300,
      nowSec: 50,
    }).toFixed(),
    '1750',
  );
});

test('estimates deposit rate from the backend rate baseline', () => {
  assertDecimalClose(
    estimatePostActionBoostRate({
      action: 'deposit',
      currentRate: '0.1',
      userEligibleUsd: '1000',
      poolEligibleUsd: '10000',
      boostDeltaUsd: '200',
      poolDeltaUsd: '200',
    }).toFixed(),
    '0.11764705882352941176',
  );
});

test('uses the target vault pool and estimated weight for a first deposit', () => {
  assertDecimalClose(
    estimatePostActionBoostRate({
      action: 'deposit',
      currentRate: '0',
      userEligibleUsd: '0',
      poolEligibleUsd: '10000',
      boostDeltaUsd: '200',
      poolDeltaUsd: '200',
      firstDepositPoolEligibleUsd: '4000',
      firstDepositWeight: '0.25',
    }).toFixed(),
    '0.01190476190476190476',
  );
});

test('estimates partial and full withdrawal rates', () => {
  assertDecimalClose(
    estimatePostActionBoostRate({
      action: 'withdraw',
      currentRate: '0.1',
      userEligibleUsd: '1000',
      poolEligibleUsd: '10000',
      boostDeltaUsd: '200',
      poolDeltaUsd: '300',
    }).toFixed(),
    '0.08247422680412371134',
  );
  assert.equal(
    estimatePostActionBoostRate({
      action: 'withdraw',
      currentRate: '0.1',
      userEligibleUsd: '1000',
      poolEligibleUsd: '10000',
      boostDeltaUsd: '1000',
      poolDeltaUsd: '1200',
    }).toFixed(),
    '0',
  );
});

test('only reduces the pool denominator when withdrawing matured shares', () => {
  assertDecimalClose(
    estimatePostActionBoostRate({
      action: 'withdraw',
      currentRate: '0.1',
      userEligibleUsd: '1000',
      poolEligibleUsd: '10000',
      boostDeltaUsd: '0',
      poolDeltaUsd: '200',
    }).toFixed(),
    '0.10204081632653061224',
  );
});

test('keeps current and next equal when no eligible amount is affected', () => {
  const preview = calculateGenesisMeritsLockedPreview({
    action: 'withdraw',
    currentRewardRate: '0.2',
    currentBoostRate: '0.1',
    userRewardEligibleUsd: '1000',
    userBoostEligibleUsd: '1000',
    poolEligibleUsd: '10000',
    boostDeltaUsd: '0',
    poolDeltaUsd: '0',
    estimatedMerits: '17.5',
    estimatedBoostMerits: '157.5',
    settledMerits: '0',
    lpPoolTotal: '700',
    boostMultiplier: '10',
    epochStartSec: 0,
    epochEndSec: 100,
    seasonEndSec: 300,
    asOfSec: 50,
    nowSec: 50,
  });

  assert.equal(preview.currentMeritsLocked, '2100');
  assert.equal(preview.nextMeritsLocked, '2100');
});

test('calculates deposit and withdrawal locked merits previews', () => {
  const common = {
    currentRewardRate: '0.1',
    currentBoostRate: '0.1',
    userRewardEligibleUsd: '1000',
    userBoostEligibleUsd: '1000',
    poolEligibleUsd: '10000',
    boostDeltaUsd: '200',
    poolDeltaUsd: '200',
    estimatedMerits: '7',
    estimatedBoostMerits: '63',
    settledMerits: '0',
    lpPoolTotal: '700',
    boostMultiplier: '10',
    epochStartSec: 0,
    epochEndSec: 100,
    seasonEndSec: 300,
    asOfSec: 50,
    nowSec: 50,
  };
  const deposit = calculateGenesisMeritsLockedPreview({
    ...common,
    action: 'deposit',
  });
  const withdraw = calculateGenesisMeritsLockedPreview({
    ...common,
    action: 'withdraw',
  });

  assertDecimalClose(deposit.currentMeritsLocked, '1820');
  assertDecimalClose(deposit.nextMeritsLocked, '2128.82352941176470588');
  assert.equal(deposit.meritsLost, '0');
  assertDecimalClose(withdraw.nextMeritsLocked, '1485.9714285714285714');
  assertDecimalClose(withdraw.meritsLost, '334.0285714285714286');
});

test('keeps accrued merits when the Season has ended', () => {
  const preview = calculateGenesisMeritsLockedPreview({
    action: 'withdraw',
    currentRewardRate: '0.25',
    currentBoostRate: '0.25',
    userRewardEligibleUsd: '1000',
    userBoostEligibleUsd: '1000',
    poolEligibleUsd: '10000',
    boostDeltaUsd: '200',
    poolDeltaUsd: '200',
    estimatedMerits: '17.5',
    estimatedBoostMerits: '157.5',
    settledMerits: '1000',
    lpPoolTotal: '700',
    boostMultiplier: '10',
    epochStartSec: 0,
    epochEndSec: 100,
    seasonEndSec: 100,
    asOfSec: 90,
    nowSec: 120,
  });

  assert.equal(preview.remainingBasePoolMerits, '0');
  assert.equal(preview.currentMeritsLocked, '1350');
  assert.equal(preview.nextMeritsLocked, '1287');
  assert.equal(preview.meritsLost, '63');
});

test('keeps settled LP merits when there is no active Epoch', () => {
  const preview = calculateGenesisMeritsLockedPreview({
    action: 'withdraw',
    currentRewardRate: '0',
    currentBoostRate: '0',
    userRewardEligibleUsd: '1000',
    userBoostEligibleUsd: '1000',
    poolEligibleUsd: '10000',
    boostDeltaUsd: '200',
    poolDeltaUsd: '200',
    estimatedMerits: '0',
    estimatedBoostMerits: '0',
    settledMerits: '1000',
    lpPoolTotal: '0',
    boostMultiplier: '1',
    epochStartSec: 0,
    epochEndSec: 0,
    seasonEndSec: 100,
    asOfSec: 120,
    nowSec: 120,
  });

  assert.equal(preview.currentMeritsLocked, '1000');
  assert.equal(preview.nextMeritsLocked, '1000');
  assert.equal(preview.meritsLost, '0');
});

test('derives affected unmatured USD without Number precision loss', () => {
  assert.equal(
    calculateAffectedUnmaturedUsd({
      withdrawShares: '40',
      unmaturedShares: '100',
      unmaturedUsd: '250',
    }).toFixed(),
    '100',
  );
});

test('derives the full withdrawn pool USD independently of unmatured USD', () => {
  assert.equal(
    calculateProportionalWithdrawUsd({
      withdrawShares: '40',
      totalShares: '200',
      totalUsd: '500',
    }).toFixed(),
    '100',
  );
});

test('converts a deposit token amount to its USD value', () => {
  assert.equal(
    calculateUsdValue({ amount: '125.5', usdPrice: '0.998' }).toFixed(),
    '125.249',
  );
});

test('expires an LP estimate at the Epoch boundary', () => {
  assert.equal(isLpEstimateEpochCurrent(100, 99_999), true);
  assert.equal(isLpEstimateEpochCurrent(100, 100_000), false);
});

test('recognizes the backend no-active-Epoch sentinel', () => {
  assert.equal(isLpEstimateWithoutActiveEpoch(0, 0), true);
  assert.equal(isLpEstimateWithoutActiveEpoch(100, 100), true);
  assert.equal(isLpEstimateWithoutActiveEpoch(100, 200), false);
  assert.equal(isLpEstimateWithoutActiveEpoch(undefined, undefined), false);
});

test('requires a withdrawal warning only when Merits are lost', () => {
  assert.equal(hasGenesisWithdrawalLoss({ meritsLost: '1' }), true);
  assert.equal(hasGenesisWithdrawalLoss({ meritsLost: '0' }), false);
});
