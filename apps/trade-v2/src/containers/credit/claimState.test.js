import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getCreditClaimState,
  getCreditWindowStatus,
  hasPositiveRawAmount,
} from './claimState.ts';

test('detects positive raw API amounts without display rounding', () => {
  assert.equal(hasPositiveRawAmount('0'), false);
  assert.equal(hasPositiveRawAmount('1'), true);
  assert.equal(hasPositiveRawAmount('invalid'), false);
});

test('derives pending, open, and closed from the claim timestamps', () => {
  const window = { startAt: 100, endAt: 200 };

  assert.equal(getCreditWindowStatus({ ...window, now: 99 }), 'pending');
  assert.equal(getCreditWindowStatus({ ...window, now: 100 }), 'open');
  assert.equal(getCreditWindowStatus({ ...window, now: 199 }), 'open');
  assert.equal(getCreditWindowStatus({ ...window, now: 200 }), 'closed');
});

const cases = [
  {
    name: 'enables both claims while the window is open',
    input: {},
    expected: { creditDisabled: false, tokenDisabled: false },
  },
  {
    name: 'enables only Credit when Token has no claimable amount',
    input: { hasHzflAmount: false },
    expected: { creditDisabled: false, tokenDisabled: true },
  },
  {
    name: 'enables only Token when Credit has no claimable amount',
    input: { hasCreditAmount: false },
    expected: { creditDisabled: true, tokenDisabled: false },
  },
  {
    name: 'keeps claimed Credit disabled with the All claimed label',
    input: {
      creditClaimed: true,
    },
    expected: {
      creditDisabled: true,
      tokenDisabled: false,
      creditLabel: 'claimed',
    },
  },
  {
    name: 'keeps claimed Token disabled with the All claimed label',
    input: {
      hzflClaimed: true,
    },
    expected: {
      creditDisabled: false,
      tokenDisabled: true,
      tokenLabel: 'claimed',
    },
  },
  {
    name: 'disables both claims when neither has a claimable amount',
    input: { hasCreditAmount: false, hasHzflAmount: false },
    expected: { creditDisabled: true, tokenDisabled: true },
  },
];

for (const { name, input, expected } of cases) {
  test(name, () => {
    const state = getCreditClaimState({
      windowStatus: 'open',
      creditClaimed: false,
      hzflClaimed: false,
      hzflEnabled: true,
      hasCreditAmount: true,
      hasHzflAmount: true,
      ...input,
    });

    assert.equal(state.periodEnded, false);
    assert.equal(state.credit.disabled, expected.creditDisabled);
    assert.equal(state.token.disabled, expected.tokenDisabled);
    assert.equal(state.credit.label, expected.creditLabel ?? 'claim');
    assert.equal(state.token.label, expected.tokenLabel ?? 'claim');
  });
}

test('keeps two disabled claim states before the claim period starts', () => {
  const state = getCreditClaimState({
    windowStatus: 'pending',
    creditClaimed: false,
    hzflClaimed: false,
    hzflEnabled: true,
    hasCreditAmount: true,
    hasHzflAmount: true,
  });

  assert.equal(state.periodEnded, false);
  assert.equal(state.credit.disabled, true);
  assert.equal(state.token.disabled, true);
});

test('switches to the single ended state after the claim period', () => {
  const state = getCreditClaimState({
    windowStatus: 'closed',
    creditClaimed: false,
    hzflClaimed: false,
    hzflEnabled: true,
    hasCreditAmount: true,
    hasHzflAmount: true,
  });

  assert.equal(state.periodEnded, true);
  assert.equal(state.credit.disabled, true);
  assert.equal(state.token.disabled, true);
});

test('disables Token while the backend HZFL claim flag is off', () => {
  const state = getCreditClaimState({
    windowStatus: 'open',
    creditClaimed: false,
    hzflClaimed: false,
    hzflEnabled: false,
    hasCreditAmount: true,
    hasHzflAmount: true,
  });

  assert.equal(state.credit.disabled, false);
  assert.equal(state.token.disabled, true);
  assert.equal(state.token.label, 'claim');
});

test('shows Claiming and disables the in-flight claim', () => {
  const state = getCreditClaimState({
    windowStatus: 'open',
    creditClaimed: false,
    hzflClaimed: false,
    hzflEnabled: true,
    hasCreditAmount: true,
    hasHzflAmount: true,
    creditAction: { isClaiming: true },
  });

  assert.equal(state.credit.disabled, true);
  assert.equal(state.credit.label, 'claiming');
  assert.equal(state.token.disabled, false);
});
