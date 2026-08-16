import assert from 'node:assert/strict';
import test from 'node:test';

import { i18n } from '@repo/i18n/client';
import type { SwapHistoryRecord } from '@/services/rest/swap';

import {
  getSwapExplorerHref,
  getSwapHistoryAmounts,
  getSwapHistoryPair,
} from './model';

i18n.loadAndActivate({ locale: 'en', messages: {} });

const record: SwapHistoryRecord = {
  id: '1',
  txHash: '0xhash',
  timestampMs: 1,
  payToken: { address: '0x1', symbol: 'PAY' },
  receiveToken: { address: '0x2', symbol: 'OUT' },
  amountIn: '1.23999',
  amountOut: '0.00643300',
  usdValue: '0.004',
  status: 'success',
};

test('formats swap history pair and token amounts', () => {
  assert.equal(getSwapHistoryPair(record), 'PAY > OUT');
  assert.equal(getSwapHistoryAmounts(record), '1.24 PAY → 0.006433 OUT');
});

test('uses the BSC mainnet explorer for transaction links', () => {
  assert.equal(getSwapExplorerHref(record.txHash), 'https://bscscan.com/tx/0xhash');
});
