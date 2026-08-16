import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSwapTransactionUrl,
  SWAP_REQUEST_ERROR_TOAST_ID,
  SWAP_TRANSACTION_TOAST_ID,
} from './swapTransactionToastModel';

const SUBMITTED_HASH = `0x${'1'.repeat(64)}`;
const CONFIRMED_HASH = `0x${'2'.repeat(64)}`;

test('uses one stable toast id for every swap transaction stage', () => {
  assert.equal(SWAP_TRANSACTION_TOAST_ID, 'toast-swap');
});

test('keeps request errors isolated from transaction progress', () => {
  assert.notEqual(SWAP_REQUEST_ERROR_TOAST_ID, SWAP_TRANSACTION_TOAST_ID);
});

test('keeps submitted and replacement receipt links distinct', () => {
  assert.equal(
    getSwapTransactionUrl('https://bscscan.com/', SUBMITTED_HASH),
    `https://bscscan.com/tx/${SUBMITTED_HASH}`,
  );
  assert.equal(
    getSwapTransactionUrl('https://bscscan.com', CONFIRMED_HASH),
    `https://bscscan.com/tx/${CONFIRMED_HASH}`,
  );
});

test('does not render a link without a valid transaction hash', () => {
  assert.equal(getSwapTransactionUrl('https://bscscan.com'), undefined);
  assert.equal(
    getSwapTransactionUrl('https://bscscan.com', '0x1234'),
    undefined,
  );
});
