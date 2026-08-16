import assert from 'node:assert/strict';
import test from 'node:test';
import { mapClaimItem } from './claimMapper';

test('prefers inst name resolved by market address for claim entity name, with symbol as fallback', () => {
  const item = {
    action_type: 'claim',
    tx_hash: '0xabc',
    timestamp: 1713686400000,
    claim_value_usd: '1000000',
    claim_types: ['funding_fees'],
    market_address: '0xmarket',
    symbol: 'BTC/USD',
    claim_details: [
      {
        claim_type: 'funding_fees',
        market: '0xmarket',
        market_symbol: 'BTC/USD',
        amount_usd: '1000000',
      },
    ],
  };

  const result = mapClaimItem(item as never, {
    explorerHost: 'https://bscscan.com',
    usdAmountDisplayDecimal: 2,
    insts: {
      '0xmarket': {
        name: 'Bitcoin',
        symbol: 'BTC/USD',
      },
    },
  });

  assert.equal(result?.entityName, 'Bitcoin');
  assert.equal(result?.entityNameCopyText, 'Bitcoin');
});

test('marks claim activity as credit market with case-insensitive detail market lookup', () => {
  const item = {
    action_type: 'claim',
    tx_hash: '0xabc',
    timestamp: 1713686400000,
    claim_value_usd: '1000000',
    claim_types: ['funding_fees'],
    claim_details: [
      {
        claim_type: 'funding_fees',
        market: '0x1c9018a78be9fed23b68ccdad236b30f46804fb5',
        market_symbol: 'BTC/USD',
        amount_usd: '1000000',
      },
    ],
  };

  const result = mapClaimItem(item as never, {
    usdAmountDisplayDecimal: 2,
    insts: {
      'btc-credit': {
        category: 'credit',
        marketTokenAddress: '0x1C9018A78bE9fed23B68ccDad236b30f46804FB5',
        name: 'Bitcoin',
        symbol: 'BTC/USD',
      },
    },
  });

  assert.equal(result?.isCreditMarket, true);
  assert.equal(result?.children?.[0]?.isCreditMarket, true);
});

test('maps predeposit cash claims to rewards and preserves their detail', () => {
  const item = {
    action_type: 'claim',
    tx_hash: '0xreward',
    timestamp: 1713686400000,
    claim_value_usd: '2500000000000000000000000000000',
    claim_types: ['predeposit_cash'],
    claim_details: [
      {
        claim_type: 'predeposit_cash',
        market: '0xvault',
        market_symbol: 'USDT',
        amount_usd: '2500000000000000000000000000000',
      },
    ],
  };

  const result = mapClaimItem(item as never, {
    usdAmountDisplayDecimal: 2,
    insts: {},
  });

  assert.equal(result?.secondaryText, 'Rewards');
  assert.equal(result?.children?.length, 1);
  assert.equal(result?.children?.[0]?.secondaryText, 'Rewards');
});
