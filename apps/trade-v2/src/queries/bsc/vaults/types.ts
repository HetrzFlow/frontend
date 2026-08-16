import type { fetchVaultDetail } from '@/services/rest/vaults';
import type { HlvMarket } from '@/stores/synthetics/marketTokens/types';

type VaultDetailResponse = Awaited<ReturnType<typeof fetchVaultDetail>>;

export type VaultDetailQueryItem = Partial<VaultDetailResponse['data']> &
  Pick<VaultDetailResponse['data'], 'vault_address'>;

export type VaultDetailQueryData = {
  data: VaultDetailQueryItem;
};

export type HzvConfig = {
  hlvToken: string;
  longToken: string;
  shortToken: string;
  markets: string[];
  maxCapByMarket?: Record<string, bigint>;
};

export type HzvValues = {
  hlvValue: bigint;
  hlvValueMin?: bigint;
  hlvValueMax?: bigint;
  hlvTokenPrice: bigint;
  hlvTokenPriceMin?: bigint;
  hlvTokenPriceMax?: bigint;
  hlvTotalSupply: bigint;
  hlvMarkets?: HlvMarket[];
};

export const VAULT_MARKETS_CONFIGS_QUERY_KEY = [
  'hz-sdk',
  'vault-market-configs',
] as const;
