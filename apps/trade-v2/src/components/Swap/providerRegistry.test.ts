import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSwapProvider,
  SWAP_PROVIDER_CODES,
} from './providerRegistry';

test('maps all supported Peach provider codes to a named icon', () => {
  assert.equal(SWAP_PROVIDER_CODES.length, 24);

  for (const code of SWAP_PROVIDER_CODES) {
    const provider = getSwapProvider(code);

    assert.equal(provider.code, code);
    assert.ok(provider.displayName);
    assert.ok(provider.familyName);
    assert.ok(provider.Icon);
  }
});

test('groups provider variants under their route-facing family name', () => {
  assert.equal(getSwapProvider('PANCAKE_INFINITY_CL').familyName, 'PancakeSwap');
  assert.equal(getSwapProvider('UNISWAPV4').familyName, 'Uniswap');
  assert.equal(getSwapProvider('SQUADSWAP_V3').familyName, 'SquadSwap');
  assert.equal(getSwapProvider('THENA_FUSION').familyName, 'Thena');
  assert.equal(getSwapProvider('SUSHISWAP_V2').familyName, 'SushiSwap');
  assert.equal(getSwapProvider('pancakev3').familyName, 'PancakeSwap');
});

test('keeps an unknown Peach provider code and leaves its icon unresolved', () => {
  assert.deepEqual(getSwapProvider('FUTURE_DEX'), {
    code: 'FUTURE_DEX',
    displayName: 'FUTURE_DEX',
    familyName: 'FUTURE_DEX',
  });
});
