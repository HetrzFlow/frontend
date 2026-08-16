import assert from 'node:assert/strict';
import test from 'node:test';

import { getGenesisActionErrorMessage } from './actionError.ts';

const getMessage = (error) =>
  getGenesisActionErrorMessage({
    error,
    rejectedMessage: 'User rejected the request.',
    fallbackMessage: 'Please try again.',
  });

test('reduces a verbose viem rejection to the localized rejection message', () => {
  assert.equal(
    getMessage(
      new Error(
        'User rejected the request.\n\nDetails: User rejected the request.\nVersion: viem@2.50.4',
      ),
    ),
    'User rejected the request.',
  );
});

test('detects a nested EIP-1193 rejection code', () => {
  assert.equal(
    getMessage({
      message: 'Request failed.',
      cause: { code: 4001, message: 'The user denied the request.' },
    }),
    'User rejected the request.',
  );
});

test('uses shortMessage for other viem errors without details or version', () => {
  assert.equal(
    getMessage({
      shortMessage: 'Wallet is disconnected.',
      message:
        'Wallet is disconnected.\n\nDetails: Provider unavailable.\nVersion: viem@2.50.4',
    }),
    'Wallet is disconnected.',
  );
});

test('extracts the backend business message from an HTTP error body', () => {
  assert.equal(
    getMessage({
      code: 'HTTP_ERROR',
      errMsg: JSON.stringify({
        code: 48006,
        msg: 'challenge consumed',
        data: {},
      }),
    }),
    'challenge consumed',
  );
});

test('uses a fallback for unknown thrown values', () => {
  assert.equal(getMessage(null), 'Please try again.');
});
