import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatLeaderboardRank,
  formatLeaderboardRankPercent,
  getPnlTextClassName,
  resolveLeaderboardRankBadge,
} from './display.ts';

test('normalizes backend rank percent formats', () => {
  assert.equal(formatLeaderboardRankPercent('40'), '40%');
  assert.equal(formatLeaderboardRankPercent('40%'), '40%');
  assert.equal(formatLeaderboardRankPercent('top 40%'), '40%');
});

test('uses backend rank percent for ranks outside top 100', () => {
  assert.equal(
    formatLeaderboardRank({
      rank: 449,
      rankPercent: '40',
    }),
    'top 40%',
  );
});

test('shows empty rank when backend rank percent is missing outside top 100', () => {
  assert.equal(
    formatLeaderboardRank({
      rank: 449,
    }),
    '--',
  );
});

test('uses rank images only for the top three ranks', () => {
  assert.deepEqual(resolveLeaderboardRankBadge(3), {
    kind: 'image',
    rank: 3,
  });
  assert.deepEqual(resolveLeaderboardRankBadge(4), {
    kind: 'text',
    value: '4',
  });
});

test('shows empty rank instead of a missing rank image for invalid ranks', () => {
  assert.deepEqual(resolveLeaderboardRankBadge(0), {
    kind: 'text',
    value: '--',
  });
  assert.deepEqual(resolveLeaderboardRankBadge(), {
    kind: 'text',
    value: '--',
  });
});

test('uses app up/down colors for pnl values', () => {
  assert.equal(getPnlTextClassName('+$0.50'), 'text-up');
  assert.equal(getPnlTextClassName('-$0.30'), 'text-down');
});
