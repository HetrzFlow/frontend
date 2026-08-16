import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLiquiditySummaryValue,
  hasSuccessfulLiquidityDetails,
} from '@/common/utils/liquidityHistory';

const details = [
  {
    key: 'success-1',
    executed_tx_hash: '0xsuccess-1',
    status: 'success',
    symbol: 'BTC',
    lp_shares: '1250000000000000000',
    delta_usd: '1200000000000000000000000000000',
    lp_price: '0',
    timestamp: 1713686400,
  },
  {
    key: 'pending-1',
    executed_tx_hash: '',
    status: 'pending',
    symbol: 'ETH',
    lp_shares: '999000000000000000000',
    delta_usd: '999000000000000000000000000000000',
    lp_price: '0',
    timestamp: 1713686401,
  },
  {
    key: 'success-2',
    executed_tx_hash: '0xsuccess-2',
    status: 'success',
    symbol: 'SOL',
    lp_shares: '750000000000000000',
    delta_usd: '800000000000000000000000000000',
    lp_price: '0',
    timestamp: 1713686402,
  },
] as const;

test('aggregates all vault activity sub-entries for summary values', () => {
  const item = { sub_entries: details };
  const expectedShares = details.reduce(
    (total, detail) => total + BigInt(detail.lp_shares),
    0n,
  );
  const expectedValue = details.reduce(
    (total, detail) => total + BigInt(detail.delta_usd),
    0n,
  );

  assert.equal(getLiquiditySummaryValue(item, 'lp_shares'), expectedShares.toString());
  assert.equal(getLiquiditySummaryValue(item, 'delta_usd'), expectedValue.toString());
  assert.equal(hasSuccessfulLiquidityDetails(item), true);
});

test('still shows aggregate values without successful sub-entries', () => {
  const item = {
    lp_shares: '1000000000000000000',
    delta_usd: '1000000000000000000000000000000',
    sub_entries: details.map((detail) => ({ ...detail, status: 'pending' })),
  };
  const expectedShares = details.reduce(
    (total, detail) => total + BigInt(detail.lp_shares),
    0n,
  );
  const expectedValue = details.reduce(
    (total, detail) => total + BigInt(detail.delta_usd),
    0n,
  );

  assert.equal(getLiquiditySummaryValue(item, 'lp_shares'), expectedShares.toString());
  assert.equal(getLiquiditySummaryValue(item, 'delta_usd'), expectedValue.toString());
  assert.equal(hasSuccessfulLiquidityDetails(item), false);
});
