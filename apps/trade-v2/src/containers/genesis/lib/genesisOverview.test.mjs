import assert from 'node:assert/strict';
import test from 'node:test';
import { parseUnits } from 'viem';

import {
  getAffectedUnmaturedUsd,
  getGenesisMeritsLockedAt,
  getGenesisRewardsLockedAt,
  mergeGenesisOverviewIntoConfig,
  mergeGenesisSeasonIntoConfig,
  sharesRawToUsd,
} from './genesisOverview.ts';

test('converts raw vault shares to human-readable USD with raw precision', () => {
  assert.equal(
    sharesRawToUsd({
      sharesRaw: parseUnits('40', 18).toString(),
      supply: parseUnits('100', 18).toString(),
      tvl: parseUnits('250', 30).toString(),
    }),
    '100',
  );
});

test('derives lost principal from withdrawn HzV shares and LP price', () => {
  assert.equal(
    getAffectedUnmaturedUsd({
      withdrawShares: 40,
      unmaturedShares: 100,
      unmaturedUsd: 250,
    }),
    100,
  );
  assert.equal(
    getAffectedUnmaturedUsd({
      withdrawShares: 120,
      unmaturedShares: 100,
      unmaturedUsd: 250,
    }),
    250,
  );
  assert.equal(
    getAffectedUnmaturedUsd({
      withdrawShares: 40,
      unmaturedShares: 0,
      unmaturedUsd: 0,
    }),
    0,
  );
});

const config = {
  seasonName: 'Season 1',
  phase: 'phase1',
  capToken: '4440000',
  depositedToken: '2590000',
  apr: 16,
  boostMultiplier: 10,
  maturityDays: 90,
  startMs: 1_000,
  endMs: 2_000,
  epochTotalMerit: '500000',
  epochStartMs: 1_000,
  epochEndMs: 2_000,
  countdownSec: 100,
  earlyBirds: 0,
  rewardsLocked: '0',
  meritsLocked: '0',
  hzvExchangeRate: '1',
  assets: [],
};

test('ticks rewards linearly and reaches the nominal target at the end', () => {
  const input = {
    unmaturedUsd: 1000,
    apr: 16,
    durationDays: 30,
    startMs: 1_000,
    endMs: 3_000,
  };
  const target = 1000 * (0.16 / 365) * 30;

  assert.equal(getGenesisRewardsLockedAt({ ...input, nowMs: 0 }), 0);
  assert.ok(
    Math.abs(
      getGenesisRewardsLockedAt({ ...input, nowMs: 2_000 }) - target / 2,
    ) < 1e-12,
  );
  assert.ok(
    Math.abs(getGenesisRewardsLockedAt({ ...input, nowMs: 4_000 }) - target) <
      1e-12,
  );
});

test('ticks the configured epoch merit pool from start to end', () => {
  const input = {
    epochTotalMerit: '500000',
    epochStartMs: 1_000,
    epochEndMs: 3_000,
  };

  assert.equal(getGenesisMeritsLockedAt({ ...input, nowMs: 0 }), 0);
  assert.equal(getGenesisMeritsLockedAt({ ...input, nowMs: 2_000 }), 250000);
  assert.equal(getGenesisMeritsLockedAt({ ...input, nowMs: 4_000 }), 500000);
});

test('derives global locked values from contract USD overview data', () => {
  const merged = mergeGenesisOverviewIntoConfig(config, {
    earlyBirds: 1283,
    unmaturedDepositsUsdRaw: parseUnits('1000', 30).toString(),
    updatedAtMs: 1722000000000,
  }, {
    rewardsLocked: '13.1506849315',
    meritsLocked: '2250',
  });

  assert.equal(merged.earlyBirds, 1283);
  assert.ok(Math.abs(Number(merged.rewardsLocked) - 13.1506849315) < 1e-9);
  assert.equal(Number(merged.meritsLocked), 2250);
});

test('keeps existing locked values when the raw overview amount is invalid', () => {
  const merged = mergeGenesisOverviewIntoConfig(config, {
    earlyBirds: 99,
    unmaturedDepositsUsdRaw: 'invalid',
    updatedAtMs: 1722000000000,
  });

  assert.equal(merged.earlyBirds, 99);
  assert.equal(merged.rewardsLocked, '0');
  assert.equal(merged.meritsLocked, '0');
});

test('derives the Genesis phase from an explicit boundary clock', () => {
  const season = {
    seasonId: 1,
    seasonName: 'Genesis',
    status: 'active',
    startMs: 10_000,
    endMs: 20_000,
    durationDays: 1,
    totalSettledMerits: '0',
  };

  assert.equal(
    mergeGenesisSeasonIntoConfig(config, season, 9_000).phase,
    'not_started',
  );
  assert.equal(
    mergeGenesisSeasonIntoConfig(config, season, 10_000).phase,
    'full',
  );
  assert.equal(
    mergeGenesisSeasonIntoConfig(config, season, 20_000).phase,
    'ended',
  );
});
