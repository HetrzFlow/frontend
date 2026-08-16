import assert from 'node:assert/strict';
import test from 'node:test';

import { mapSeasonItem, mapXpStats, normalizePct } from './points.adapters.ts';

test('normalizePct keeps whole-number percentages unchanged', () => {
  assert.equal(normalizePct('45.0000'), 45);
});

test('normalizePct converts ratio values to display percentages', () => {
  assert.equal(normalizePct('0.4500'), 45);
});

test('mapSeasonItem converts backend season data to frontend shape', () => {
  const result = mapSeasonItem({
    season_id: 2,
    season_name: 'SEASON 2',
    status: 'active',
    start_at: 1743465600000,
    end_at: 1751328000000,
    pool_total: '500000',
    trading_pct: '45.0000',
    liquidity_pct: '30.0000',
    referral_pct: '15.0000',
  });

  assert.equal(result.seasonId, '2');
  assert.equal(result.seasonName, 'SEASON 2');
  assert.equal(result.status, 'active');
  assert.equal(result.tradingPct, 45);
  assert.equal(result.liquidityPct, 30);
  assert.equal(result.referralPct, 15);
  assert.match(result.startAt, /^2025-04-01T/);
  assert.match(result.endAt, /^2025-07-01T/);
});

test('mapXpStats maps backend xp stats to frontend current or season point shape', () => {
  const result = mapXpStats({
    season_id: 0,
    total_points: '120.50',
    trading_points: '60.25',
    lp_points: '40.00',
    referral_points: '20.25',
    estimated_trading_points: '1.50',
    estimated_lp_points: '0.25',
    is_estimated: true,
    last_settled_date: '20260416',
    total_fees_generated_usd: '999.99',
  });

  assert.deepEqual(result, {
    total: '120.50',
    trading: '60.25',
    liquidity: '40.00',
    referral: '20.25',
    estimatedTrading: '1.50',
    estimatedLiquidity: '0.25',
    isEstimated: true,
    lastSettledDate: '20260416',
    totalFeesGeneratedUsd: '999.99',
  });
});
