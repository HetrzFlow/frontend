export const GENESIS_RULES_URL =
  'https://hertzflow.gitbook.io/hertzflow-docs/rewards/season-1-genesis-vault';

export const GENESIS_ASSETS = ['USD1', 'USDT', 'U'] as const;
export type GenesisAssetSymbol = (typeof GENESIS_ASSETS)[number];

export const GENESIS_USD_FORMAT_OPTIONS = {
  style: 'currency',
  currency: 'USD',
} as const;

export const GENESIS_INTEGER_FORMAT_OPTIONS = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} as const;
