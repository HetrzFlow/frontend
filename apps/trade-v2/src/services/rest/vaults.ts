import { get } from '@repo/lib/rest';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toChecksumAddress, toLowerAddressParam } from '@/lib/address';
import {
  APY_PERIOD,
  HistoryReq,
  normalizeApyPeriod,
  parseHistoryApiResponse,
  type HistoryApiEnvelope,
} from './pools';

const SUCCESS_CODE = 200;

export type GlobalStatus = {
  total_tvl: string;
  total_earned_fees: string;
};
export type MarketExposureItem = {
  market_address: string;
  symbol: string;
  long_token: string;
  short_token: string;
  distribution_amount: string;
  max_cap: string;
};

export type VaultLocalizedText = string | Record<string, string | undefined>;

export type VaultItem = {
  vault_address: string;
  vault_name: string;
  is_predeposit?: boolean;
  lp_price?: string;
  curator: string;
  net_apy: string;
  fee_apy: string;
  tvl: string;
  supply: string;
  is_view: boolean;
  tvl_cap: string;
  tokens_balance: string;
  market_exposure: MarketExposureItem[];
  realized_pnl: string;
  unrealized_pnl: string;
  total_earned_fees_usd: string;
  fees_30d?: string;
};

export type VaultsListRes = {
  data: {
    global_stats: GlobalStatus;
    items: VaultItem[];
  };
};

type VaultApiItem = Omit<VaultItem, 'market_exposure'> & {
  market_exposure: VaultItem['market_exposure'] | null;
};

type VaultsListApiResponse = Omit<VaultsListRes, 'data'> & {
  data: Omit<VaultsListRes['data'], 'items'> & {
    items: VaultApiItem[] | null;
  };
};

const mapMarketExposureItem = <T extends MarketExposureItem>(item: T): T => ({
  ...item,
  market_address: toChecksumAddress(item.market_address),
});

const mapVaultItem = (item: VaultApiItem): VaultItem => ({
  ...item,
  vault_address: toChecksumAddress(item.vault_address),
  market_exposure: (item.market_exposure ?? []).map(mapMarketExposureItem),
});

export const fetchVaultsList = async ({
  wallet_address,
}: {
  wallet_address?: string;
}) => {
  const response = await get<VaultsListApiResponse>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/vaults`,
    {
      wallet_address: toLowerAddressParam(wallet_address),
    },
  );
  return {
    ...response,
    data: {
      ...response.data,
      items: (response.data.items ?? []).map(mapVaultItem),
    },
  };
};

export type VaultDetailItem = {
  vault_address: string;
  vault_name: string;
  is_predeposit?: boolean;
  curator: string;
  description: VaultLocalizedText;
  logo_path: string;
  vault_token_address: string;
  long_token_address: string;
  short_token_address: string;
  net_apy_7d_ago: string;
  fee_apy_7d_ago: string;
  net_apy: string;
  tvl: string;
  supply: string;
  tvl_cap: string;
  is_disabled: boolean;
  last_update_time_ms: number;
  market_exposure: MarketExposureItem[];
  total_earned_fees_usd: string;
  fees_30d?: string;
  realized_pnl: string;
  tokens_balance: string;
  total_bought: string;
  average_deposit_price: string;
};
export type VaultDetailRes = {
  data: VaultDetailItem;
};

type VaultDetailApiResponse = {
  code?: number;
  message?: string;
  msg?: string;
  data?: Partial<Omit<VaultDetailItem, 'market_exposure'>> & {
    market_exposure?: VaultDetailItem['market_exposure'] | null;
  };
};

const mapVaultDetailItem = (
  item: NonNullable<VaultDetailApiResponse['data']>,
): VaultDetailItem =>
  ({
    ...item,
    vault_address: toChecksumAddress(item.vault_address),
    vault_token_address: toChecksumAddress(item.vault_token_address),
    long_token_address: toChecksumAddress(item.long_token_address),
    short_token_address: toChecksumAddress(item.short_token_address),
    market_exposure: (item.market_exposure ?? []).map(mapMarketExposureItem),
  }) as VaultDetailItem;

export const fetchVaultDetail = async ({
  vault_address,
  wallet_address,
}: {
  vault_address: string;
  wallet_address?: string;
}) => {
  const vaultAddressParam = vault_address.toLowerCase();
  const response = await get<VaultDetailApiResponse>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/vault/${vaultAddressParam}`,
    {
      wallet_address: toLowerAddressParam(wallet_address),
    },
  );
  const errorMessage =
    response.code !== undefined && response.code !== SUCCESS_CODE
      ? response.msg || response.message || 'Failed to fetch vault detail'
      : undefined;
  const data = response.data;

  if (errorMessage || !data?.vault_address) {
    throw new Error(errorMessage || 'Vault not found');
  }

  return {
    ...response,
    data: mapVaultDetailItem(data),
  };
};

export const fetchVaultHistoryData = async (req: HistoryReq) => {
  const { market_address, cursor, limit, wallet_address, action } = req;
  const vaultAddressParam = market_address.toLowerCase();
  const response = await get<HistoryApiEnvelope>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/vault/${vaultAddressParam}/liquidity-history`,
    {
      cursor,
      limit,
      wallet_address: toLowerAddressParam(wallet_address),
      action,
    },
  );
  return parseHistoryApiResponse(response);
};

type VaultNetAprChartItem = {
  timestamp: number;
  net_apr: string;
  fee_apr: string;
};

type FeePerformance = {
  fee_apy: string;
  performance_fee_rate: string;
  performance_fee: string;
  net_apy: string;
};
export type VaultNetAprChartRes = {
  data: {
    vault_address: string;
    period: APY_PERIOD;
    points: Array<VaultNetAprChartItem>;
    period_net_apy: string;
    period_fee_apy: string;
    period_fee_apr: string;
    management_fee: string;
    performance_fee_rate: string;
    performance: FeePerformance;
  };
};

export const fetchVaultNetAprChartData = async ({
  vault_address,
  period,
}: {
  vault_address: string;
  period: APY_PERIOD;
}) => {
  const vaultAddressParam = vault_address.toLowerCase();
  const response = await get<VaultNetAprChartRes>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/vault/${vaultAddressParam}/net-apr`,
    {
      period: normalizeApyPeriod(period),
    },
  );
  return {
    ...response,
    data: {
      ...response.data,
      vault_address: toChecksumAddress(response.data.vault_address),
    },
  };
};

type TvlCap = {
  tvl_cap: string;
  deposited: string;
  remaining: string;
};
export type VaultTvlChartRes = {
  data: {
    vault_address: string;
    period: APY_PERIOD;
    points: Array<{
      timestamp: number;
      value: string;
    }>;
    capacity: TvlCap;
  };
};

export const fetchVaultTvlChartData = async ({
  vault_address,
  period,
}: {
  vault_address: string;
  period: APY_PERIOD;
}) => {
  const vaultAddressParam = vault_address.toLowerCase();
  const response = await get<VaultTvlChartRes>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/vault/${vaultAddressParam}/tvl`,
    {
      period: normalizeApyPeriod(period),
    },
  );
  return {
    ...response,
    data: {
      ...response.data,
      vault_address: toChecksumAddress(response.data.vault_address),
    },
  };
};
