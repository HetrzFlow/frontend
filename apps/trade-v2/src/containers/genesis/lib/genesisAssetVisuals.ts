import { IMAGES_MAP } from '@/common';
import type { GenesisAsset } from '@/services/rest/genesis';

interface GenesisAssetVisual {
  displayName: string;
  icon: string;
  background: string;
}

export const GENESIS_ASSET_VISUALS = {
  USD1: {
    displayName: 'USD1',
    icon: IMAGES_MAP.coinIcons.USD1,
    background: '/trade-static/genesis/1coin.png',
  },
  USDT: {
    displayName: 'USDT',
    icon: IMAGES_MAP.coinIcons.USDT,
    background: '/trade-static/genesis/tcoin.png',
  },
  U: {
    displayName: 'U',
    icon: IMAGES_MAP.coinIcons.U,
    background: '/trade-static/genesis/ucoin.png',
  },
} satisfies Record<GenesisAsset['symbol'], GenesisAssetVisual>;

export const getGenesisAssetVisual = (symbol: GenesisAsset['symbol']) =>
  GENESIS_ASSET_VISUALS[symbol];

export const getGenesisVaultDisplayName = ({
  symbol,
  vaultName,
}: Pick<GenesisAsset, 'symbol' | 'vaultName'>) =>
  GENESIS_ASSET_VISUALS[symbol]?.displayName ?? vaultName ?? symbol;
