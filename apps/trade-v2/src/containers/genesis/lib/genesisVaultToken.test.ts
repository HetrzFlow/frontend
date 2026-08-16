import assert from 'node:assert/strict';
import test from 'node:test';
import { SOURCE_BSC_TESTNET } from '@hertzflow/sdk-v2/configs/chains';
import { getInternalUsdConfigs } from '@hertzflow/sdk-v2/configs/internalUsd';
import type { Coin } from '@/common/services/rest/inst';
import type { HzvConfig } from '@/queries/bsc/vaults/types';
import type { VaultItem } from '@/services/rest/vaults';
import {
  resolveGenesisVaultTokenSymbol,
  selectGenesisVaults,
} from './genesisVaultToken';

const vaultAddress = '0x1111111111111111111111111111111111111111';

const createVault = () =>
  ({
    vault_address: vaultAddress,
  }) as VaultItem;

test('maps the HLV HFUSD token through the SDK underlying config', () => {
  const internalUsd = getInternalUsdConfigs(SOURCE_BSC_TESTNET)[0]!;
  const hzvConfigs: Record<string, HzvConfig> = {
    [vaultAddress]: {
      hlvToken: vaultAddress,
      longToken: internalUsd.wrappedTokenAddress,
      shortToken: internalUsd.wrappedTokenAddress,
      markets: [],
    },
  };
  const coins = {
    [internalUsd.underlyingTokenAddress]: {
      address: internalUsd.underlyingTokenAddress,
      symbol: 'USDT',
    } as Coin,
  };

  assert.equal(
    resolveGenesisVaultTokenSymbol({
      vault: createVault(),
      chainId: SOURCE_BSC_TESTNET,
      hzvConfigs,
      coins,
    }),
    'USDT',
  );
});

test('accepts U when the SDK underlying token resolves to U', () => {
  const internalUsd = getInternalUsdConfigs(SOURCE_BSC_TESTNET)[0]!;
  const hzvConfigs: Record<string, HzvConfig> = {
    [vaultAddress]: {
      hlvToken: vaultAddress,
      longToken: internalUsd.wrappedTokenAddress,
      shortToken: internalUsd.wrappedTokenAddress,
      markets: [],
    },
  };
  const coins = {
    [internalUsd.underlyingTokenAddress]: {
      address: internalUsd.underlyingTokenAddress,
      symbol: 'U',
    } as Coin,
  };

  assert.equal(
    resolveGenesisVaultTokenSymbol({
      vault: createVault(),
      chainId: SOURCE_BSC_TESTNET,
      hzvConfigs,
      coins,
    }),
    'U',
  );
});

test('does not infer a symbol while SDK config data is unavailable', () => {
  assert.equal(
    resolveGenesisVaultTokenSymbol({
      vault: createVault(),
      chainId: SOURCE_BSC_TESTNET,
    }),
    undefined,
  );
});

test('keeps distinct visible vaults and ignores hidden duplicates', () => {
  const internalUsd = getInternalUsdConfigs(SOURCE_BSC_TESTNET)[0]!;
  const secondVaultAddress = '0x2222222222222222222222222222222222222222';
  const visibleVaults = [vaultAddress, secondVaultAddress].map(
    (address) =>
      ({
        vault_address: address,
        is_predeposit: true,
        is_view: true,
      }) as VaultItem,
  );
  const vaults = [
    { ...visibleVaults[0]!, is_view: false },
    ...visibleVaults,
  ];
  const hzvConfigs = Object.fromEntries(
    visibleVaults.map((vault) => [
      vault.vault_address,
      {
        hlvToken: vault.vault_address,
        longToken: internalUsd.wrappedTokenAddress,
        shortToken: internalUsd.wrappedTokenAddress,
        markets: [],
      } satisfies HzvConfig,
    ]),
  );
  const coins = {
    [internalUsd.underlyingTokenAddress]: {
      address: internalUsd.underlyingTokenAddress,
      symbol: 'USDT',
    } as Coin,
  };

  const selected = selectGenesisVaults(vaults, {
    chainId: SOURCE_BSC_TESTNET,
    hzvConfigs,
    coins,
  });

  assert.deepEqual(
    selected.map(({ symbol, vault }) => [
      symbol,
      vault.vault_address,
      vault.is_view,
    ]),
    [
      ['USDT', vaultAddress, true],
      ['USDT', secondVaultAddress, true],
    ],
  );
});
