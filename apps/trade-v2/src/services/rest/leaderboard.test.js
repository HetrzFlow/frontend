import assert from 'node:assert/strict';
import test from 'node:test';

import { mapLeaderboardEntry, mapMeritsRank } from './leaderboard.ts';

const baseEntry = {
  rank: 101,
  trader: '0x644a98bca0a8063bab4c84241a3cc072ad37e102',
  volume: '19026371.15',
  pnl: '0.5',
  rank_percent: 55,
  referee: 1234,
  referral_volume: '199805.83',
  lp_points: '0.00',
  referral_points: '12.2',
  total_points: '99.9',
};
const checksumTrader = '0x644a98BcA0A8063bAB4c84241a3CC072Ad37e102';

test('maps leaderboard snake_case fields and display values', () => {
  const row = mapLeaderboardEntry({
    ...baseEntry,
    win_count: 7,
    loss_count: 3,
    total_trades: 10,
  });

  assert.equal(row.rankPercent, '55');
  assert.equal(row.trader, '0x644a…e102');
  assert.equal(row.traderAddress, checksumTrader);
  assert.equal(row.pnl30d, '+$0.50');
  assert.equal(row.volume30d, '$19.03M');
  assert.equal(row.trades, '10');
  assert.equal(row.winRate, '70.00%');
  assert.equal(row.refereeAllTime, '1,234');
  assert.equal(row.referralVolume, '$199.81K');
  assert.equal(row.refPoints, '12');
  assert.equal(row.totalPoints, '100');
});

test('shows empty win rate and signed zero for zero-trade entries', () => {
  const row = mapLeaderboardEntry({
    ...baseEntry,
    pnl: '-0.3',
    rank_percent: null,
    win_count: 0,
    loss_count: 0,
    total_trades: 0,
  });

  assert.equal(row.rankPercent, undefined);
  assert.equal(row.pnl30d, '-$0.30');
  assert.equal(row.trades, '0');
  assert.equal(row.winRate, '—');
  assert.equal(
    mapLeaderboardEntry({ ...baseEntry, referral_volume: '0.00' })
      .referralVolume,
    '$0.00',
  );
});

test('maps Merits rank from the ledger and leaderboard user entry', () => {
  assert.deepEqual(
    mapMeritsRank({ season_rank: 9 }, { you: { rank_percent: '15' } }),
    { position: 9, topPercent: '15' },
  );
  assert.deepEqual(
    mapMeritsRank({ season_rank: 101 }, { you: { rank_percent: 'top 2%' } }),
    { position: 101, topPercent: 'top 2%' },
  );
  assert.deepEqual(
    mapMeritsRank({ season_rank: null }, { you: { rank_percent: null } }),
    { position: null, topPercent: null },
  );
});
