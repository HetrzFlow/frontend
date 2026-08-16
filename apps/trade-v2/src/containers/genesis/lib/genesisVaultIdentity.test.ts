import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  GenesisAsset,
  GenesisUserPosition,
} from '@/services/rest/genesis';
import {
  findGenesisUserAsset,
  getGenesisVaultKey,
} from './genesisVaultIdentity';

const firstAddress = '0x1111111111111111111111111111111111111111';
const secondAddress = '0x2222222222222222222222222222222222222222';

const createAsset = (vaultAddress: string): GenesisAsset => ({
  symbol: 'USDT',
  vaultAddress,
  capToken: '0',
  depositedToken: '0',
});

test('uses the vault address instead of symbol as the identity', () => {
  assert.notEqual(
    getGenesisVaultKey(createAsset(firstAddress)),
    getGenesisVaultKey(createAsset(secondAddress)),
  );
});

test('matches user data by vault address before the duplicate symbol', () => {
  const position = {
    perAsset: [
      { symbol: 'USDT', vaultAddress: firstAddress, deposited: '1' },
      { symbol: 'USDT', vaultAddress: secondAddress, deposited: '2' },
    ],
  } as GenesisUserPosition;

  assert.equal(
    findGenesisUserAsset(position, createAsset(secondAddress))?.deposited,
    '2',
  );
});
