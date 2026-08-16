import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampSlippageValue,
  DEFAULT_SLIPPAGE_OPTIONS,
  getSlippageState,
  SWAP_SLIPPAGE_OPTIONS,
} from './slippageState';

test('keeps default and swap presets separate', () => {
  assert.deepEqual(DEFAULT_SLIPPAGE_OPTIONS, ['0.01', '0.02', '0.03']);
  assert.deepEqual(SWAP_SLIPPAGE_OPTIONS, ['0.003', '0.005', '0.01']);
});

test('classifies swap slippage boundaries and invalid values', () => {
  const classify = (value: string) => getSlippageState(value, '0.003', '0.01');

  assert.equal(classify(''), 'empty');
  assert.equal(classify('0'), 'invalid');
  assert.equal(classify('0.00'), 'invalid');
  assert.equal(classify('0.00009'), 'invalid');
  assert.equal(classify('0.0001'), 'low');
  assert.equal(classify('0.0029'), 'low');
  assert.equal(classify('0.003'), 'normal');
  assert.equal(classify('0.01'), 'normal');
  assert.equal(classify('0.0101'), 'high');
  assert.equal(classify('0.05'), 'high');
  assert.equal(classify('0.0501'), 'invalid');
});

test('clamps swap slippage to the supported range', () => {
  assert.equal(clampSlippageValue('0'), 0.0001);
  assert.equal(clampSlippageValue('0.00009'), 0.0001);
  assert.equal(clampSlippageValue('0.0001'), 0.0001);
  assert.equal(clampSlippageValue('0.05'), 0.05);
  assert.equal(clampSlippageValue('0.0501'), 0.05);
});
