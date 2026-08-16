import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateEstimate,
  formatMerits,
  getBreakdownPercentages,
  getCountdown,
  getMeritsOverview,
  getMeritsTopPercent,
  resolveDefaultScope,
  toMeritsBreakdown,
  toMeritsCatalog,
} from './model.ts';

test('uses Top 1% for top-100 ranks without rank percent', () => {
  assert.equal(getMeritsTopPercent(9, null), '1');
  assert.equal(getMeritsTopPercent(101, 'top 2%'), '2');
  assert.equal(getMeritsTopPercent(101, null), null);
});

const apiSeasons = [
  {
    seasonId: 1,
    seasonName: 'Season 1',
    status: 'settled',
    startMs: 100,
    endMs: 200,
    tracks: ['lp'],
    totalSettledMerits: '3437',
  },
  {
    seasonId: 2,
    seasonName: 'Season 2',
    status: 'active',
    startMs: 300,
    endMs: 400,
    tracks: ['trading', 'spot'],
    totalSettledMerits: '10000000000000000000',
  },
];

test('estimate ticks from the API baseline and floors to two decimals', () => {
  const estimate = {
    rewardShare: '0.25',
    boostRewardShare: '0.25',
    estimated10xMerits: '175',
    lpPoolTotal: '700',
    boostExtraMultiplier: '9',
    epochStartSec: 0,
    epochEndSec: 100,
    asOfSec: 50,
  };
  assert.equal(calculateEstimate(estimate, 60_000), '350');
  assert.equal(
    calculateEstimate({ ...estimate, rewardShare: '1.1' }, 60_000),
    null,
  );
});

test('countdown keeps days separate from hours', () => {
  assert.deepEqual(getCountdown(90_061_000, 0), {
    days: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
  });
});

test('breakdown percentages total one hundred', () => {
  const percentages = getBreakdownPercentages([
    { source: 'trading', amount: '1' },
    { source: 'liquidity', amount: '1' },
    { source: 'referral', amount: '1' },
  ]);
  assert.equal(
    percentages.reduce((sum, value) => sum + value, 0),
    100,
  );
});

test('catalog normalizes status, tracks, ordering, and default scope', () => {
  const catalog = toMeritsCatalog(apiSeasons);
  assert.equal(resolveDefaultScope(catalog), '2');
  assert.deepEqual(catalog.seasons[0].enabledSources, ['trading', 'swap']);
  assert.equal(catalog.seasons[1].status, 'ended');
});

test('overview uses the user summary total without Number precision loss', () => {
  assert.equal(
    getMeritsOverview('10000000000000003437').settledMerits,
    '10000000000000003437',
  );
  assert.equal(
    formatMerits('10000000000000003437'),
    '10,000,000,000,000,003,437',
  );
  assert.deepEqual(
    getMeritsOverview('3437', { position: 9, topPercent: '15' }).rank,
    { position: 9, topPercent: '15' },
  );
});

test('composition follows enabled sources and maps lp and spot fields', () => {
  assert.deepEqual(
    toMeritsBreakdown(
      {
        seasonCumulative: {
          trading: '1',
          lp: '2',
          referral: '3',
          spot: '4',
        },
      },
      ['liquidity', 'swap'],
    ),
    [
      { source: 'liquidity', amount: '2' },
      { source: 'swap', amount: '4' },
    ],
  );
});
