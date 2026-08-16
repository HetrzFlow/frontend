import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getEffectiveReferralDiscountRate,
  getEffectiveReferralDiscountUsd,
} from './creditReferral.ts';

test('credit margin disables referral discount completely', () => {
  assert.equal(
    getEffectiveReferralDiscountRate({
      isCreditMarket: true,
      referralDiscountRate: '0.2',
    }),
    '0',
  );
});

test('normal market keeps referral discount rate', () => {
  assert.equal(
    getEffectiveReferralDiscountRate({
      isCreditMarket: false,
      referralDiscountRate: '0.2',
    }),
    '0.2',
  );
});

test('credit market forces referral discount amount to zero', () => {
  assert.equal(
    getEffectiveReferralDiscountUsd({
      isCreditMarket: true,
      feeUsd: '100',
      referralDiscountRate: '0.2',
    }),
    '0',
  );
});

test('normal market calculates referral discount amount', () => {
  assert.equal(
    getEffectiveReferralDiscountUsd({
      isCreditMarket: false,
      feeUsd: '100',
      referralDiscountRate: '0.2',
    }),
    '20',
  );
});
