import type {
  GenesisAsset,
  GenesisUserAssetRow,
  GenesisUserPosition,
} from '@/services/rest/genesis';

export const getGenesisVaultKey = (asset: GenesisAsset): string =>
  asset.vaultAddress?.toLowerCase() ?? `symbol:${asset.symbol}`;

export const findGenesisAssetByVaultKey = (
  assets: GenesisAsset[] | undefined,
  vaultKey: string,
): GenesisAsset | undefined =>
  assets?.find((asset) => getGenesisVaultKey(asset) === vaultKey);

export const findGenesisUserAsset = (
  position: GenesisUserPosition | undefined,
  asset: GenesisAsset | undefined,
): GenesisUserAssetRow | undefined => {
  if (!asset) return undefined;

  const vaultAddress = asset.vaultAddress?.toLowerCase();
  return (
    (vaultAddress
      ? position?.perAsset.find(
          (item) => item.vaultAddress?.toLowerCase() === vaultAddress,
        )
      : undefined) ??
    position?.perAsset.find(
      (item) => !item.vaultAddress && item.symbol === asset.symbol,
    )
  );
};
