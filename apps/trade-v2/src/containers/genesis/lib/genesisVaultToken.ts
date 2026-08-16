import { getInternalUsdConfig } from '@hertzflow/sdk-v2/configs/internalUsd';
import type { Coin } from '@/common/services/rest/inst';
import type { HzvConfig } from '@/queries/bsc/vaults/types';
import type { VaultItem } from '@/services/rest/vaults';
import { GENESIS_ASSETS, type GenesisAssetSymbol } from './constants';

const isGenesisAssetSymbol = (
  symbol: string | undefined,
): symbol is GenesisAssetSymbol =>
  GENESIS_ASSETS.includes(symbol?.toUpperCase() as GenesisAssetSymbol);

const findByAddress = <T extends { address: string }>(
  values: Iterable<T>,
  address: string,
) => {
  const normalizedAddress = address.toLowerCase();
  return Array.from(values).find(
    (value) => value.address.toLowerCase() === normalizedAddress,
  );
};

export const resolveGenesisVaultTokenSymbol = ({
  vault,
  chainId,
  hzvConfigs,
  coins,
}: {
  vault: VaultItem;
  chainId?: number;
  hzvConfigs?: Record<string, HzvConfig>;
  coins?: Record<string, Coin>;
}): GenesisAssetSymbol | undefined => {
  const vaultAddress = vault.vault_address.toLowerCase();
  const hzvConfig = Object.values(hzvConfigs ?? {}).find(
    (config) => config.hlvToken.toLowerCase() === vaultAddress,
  );

  if (
    hzvConfig &&
    hzvConfig.longToken.toLowerCase() === hzvConfig.shortToken.toLowerCase()
  ) {
    const internalUsd = getInternalUsdConfig(chainId, hzvConfig.longToken);
    const underlyingCoin = internalUsd
      ? findByAddress(
          Object.values(coins ?? {}),
          internalUsd.underlyingTokenAddress,
        )
      : undefined;
    const underlyingSymbol = underlyingCoin?.symbol.toUpperCase();

    if (isGenesisAssetSymbol(underlyingSymbol)) return underlyingSymbol;
  }

  return undefined;
};

export interface SelectedGenesisVault {
  symbol: GenesisAssetSymbol;
  vault: VaultItem;
}

export const selectGenesisVaults = (
  vaults: VaultItem[] | undefined,
  {
    chainId,
    hzvConfigs,
    coins,
    allowIndexFallback = false,
  }: {
    chainId?: number;
    hzvConfigs?: Record<string, HzvConfig>;
    coins?: Record<string, Coin>;
    allowIndexFallback?: boolean;
  } = {},
): SelectedGenesisVault[] => {
  const predepositVaults =
    vaults?.filter((vault) => vault.is_predeposit && vault.is_view) ?? [];
  const candidates = predepositVaults.length
    ? predepositVaults
    : allowIndexFallback
      ? (vaults?.slice(0, GENESIS_ASSETS.length) ?? [])
      : [];
  const resolvedVaults = candidates.flatMap<SelectedGenesisVault>((vault) => {
    const symbol = resolveGenesisVaultTokenSymbol({
      vault,
      chainId,
      hzvConfigs,
      coins,
    });
    return symbol ? [{ symbol, vault }] : [];
  });

  if (resolvedVaults.length) return resolvedVaults;
  if (!allowIndexFallback) return [];

  return candidates.flatMap<SelectedGenesisVault>((vault, index) => {
    const symbol = GENESIS_ASSETS[index];
    return symbol ? [{ symbol, vault }] : [];
  });
};
