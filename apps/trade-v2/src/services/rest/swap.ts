import { isAddress } from 'viem';
import { get } from '@repo/lib/rest';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toLowerAddressParam } from '@/lib/address';

const SWAP_API_PATH = `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc`;
const SUCCESS_CODE = 200;
export const SWAP_HISTORY_PAGE_SIZE = 20;

type SwapApiResponse<T> = {
  code?: number;
  msg?: string;
  message?: string;
  data?: T;
};

const getSwapApiData = <T>(
  response: SwapApiResponse<T>,
  fallbackMessage: string,
) => {
  if (response.code !== SUCCESS_CODE || !response.data) {
    throw new Error(response.msg || response.message || fallbackMessage);
  }
  return response.data;
};

export type SwapPriceStatus = 'normal' | 'market_closed' | 'no_feed';

export type SwapPrice = {
  address: string;
  price: string;
  publishTime: number;
  status: SwapPriceStatus;
};

type SwapPricesData = {
  items?: {
    address?: string;
    price?: string;
    publish_time?: number;
    status?: SwapPriceStatus;
  }[];
};

export const normalizeSwapPriceAddresses = (addresses: readonly string[]) =>
  Array.from(
    new Set(
      addresses
        .map((address) => address.toLowerCase())
        .filter((address) => /^0x[a-f0-9]{40}$/.test(address)),
    ),
  ).sort();

export const mapSwapPrices = (data: SwapPricesData): SwapPrice[] =>
  (data.items ?? []).flatMap((item) =>
    item.address &&
    typeof item.price === 'string' &&
    typeof item.publish_time === 'number' &&
    (item.status === 'normal' ||
      item.status === 'market_closed' ||
      item.status === 'no_feed')
      ? [
          {
            address: item.address.toLowerCase(),
            price: item.price,
            publishTime: item.publish_time,
            status: item.status,
          },
        ]
      : [],
  );

export const fetchSwapPrices = async (
  addresses: readonly string[],
  signal?: AbortSignal,
) => {
  const normalizedAddresses = normalizeSwapPriceAddresses(addresses);
  if (!normalizedAddresses.length) return [];

  const response = await get<SwapApiResponse<SwapPricesData>>(
    `${SWAP_API_PATH}/swap/prices`,
    { addresses: normalizedAddresses.join(',') },
    { signal },
  );

  return mapSwapPrices(
    getSwapApiData(response, 'Failed to fetch swap prices'),
  );
};

export type RecommendedSwapToken = {
  address: string;
  symbol: string;
  name: string;
  decimals?: number;
  logoUri?: string;
};

type RecommendedSwapTokensData = {
  items?: {
    address?: string;
    symbol?: string;
    name?: string;
    decimals?: number;
    logoURI?: string;
  }[];
};

export const mapRecommendedSwapTokens = (
  data: RecommendedSwapTokensData,
): RecommendedSwapToken[] =>
  (data.items ?? []).flatMap((item) =>
    item.address && item.symbol && item.name
      ? [
          {
            address: item.address.toLowerCase(),
            symbol: item.symbol,
            name: item.name,
            decimals: item.decimals,
            logoUri: item.logoURI,
          },
        ]
      : [],
  );

export const fetchRecommendedSwapTokens = async (signal?: AbortSignal) => {
  const response = await get<SwapApiResponse<RecommendedSwapTokensData>>(
    `${SWAP_API_PATH}/swap/recommend-tokens`,
    undefined,
    { signal },
  );

  return mapRecommendedSwapTokens(
    getSwapApiData(response, 'Failed to fetch recommended swap tokens'),
  );
};

export type SwapHistoryRecord = {
  id: string;
  txHash: string;
  timestampMs: number;
  payToken: {
    address: string;
    symbol: string;
    logoUri?: string;
  };
  receiveToken: {
    address: string;
    symbol: string;
    logoUri?: string;
  };
  amountIn: string;
  amountOut: string;
  usdValue: string | null;
  status: 'success';
};

type UserSwapHistoryItem = {
  tx_hash?: string;
  block_time?: number;
  pay_token?: {
    address?: string;
    symbol?: string;
    logo_uri?: string | null;
    logoURI?: string | null;
  };
  receive_token?: {
    address?: string;
    symbol?: string;
    logo_uri?: string | null;
    logoURI?: string | null;
  };
  amount_in?: string;
  amount_out?: string;
  usd_value?: string | null;
  status?: string;
};

type UserSwapHistoryData = {
  items?: UserSwapHistoryItem[];
  total?: number;
  page?: number;
  page_size?: number;
  has_more?: boolean;
};

export type SwapHistoryPage = {
  records: SwapHistoryRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export const mapUserSwapHistory = (
  data: UserSwapHistoryData,
  indexOffset = 0,
): SwapHistoryRecord[] =>
  (data.items ?? []).flatMap((item, index) =>
    item.tx_hash &&
    typeof item.block_time === 'number' &&
    item.pay_token?.address &&
    isAddress(item.pay_token.address, { strict: false }) &&
    item.pay_token.symbol &&
    item.receive_token?.address &&
    isAddress(item.receive_token.address, { strict: false }) &&
    item.receive_token.symbol &&
    typeof item.amount_in === 'string' &&
    typeof item.amount_out === 'string' &&
    item.status === 'Swap Succeeded'
      ? [
          {
            id: `${item.tx_hash}-${indexOffset + index}`,
            txHash: item.tx_hash,
            timestampMs: item.block_time * 1000,
            payToken: {
              address: item.pay_token.address.toLowerCase(),
              symbol: item.pay_token.symbol,
              logoUri:
                item.pay_token.logo_uri ||
                item.pay_token.logoURI ||
                undefined,
            },
            receiveToken: {
              address: item.receive_token.address.toLowerCase(),
              symbol: item.receive_token.symbol,
              logoUri:
                item.receive_token.logo_uri ||
                item.receive_token.logoURI ||
                undefined,
            },
            amountIn: item.amount_in,
            amountOut: item.amount_out,
            usdValue:
              typeof item.usd_value === 'string' &&
              Number.isFinite(Number(item.usd_value)) &&
              Number(item.usd_value) > 0
                ? item.usd_value
                : null,
            status: 'success' as const,
          },
        ]
      : [],
  );

export const fetchSwapHistory = async ({
  account,
  page = 1,
  limit = SWAP_HISTORY_PAGE_SIZE,
  signal,
}: {
  account: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<SwapHistoryPage> => {
  const normalizedAccount = toLowerAddressParam(account);
  if (!normalizedAccount || !isAddress(normalizedAccount)) {
    throw new Error('Invalid swap history account');
  }

  const response = await get<SwapApiResponse<UserSwapHistoryData>>(
    `${SWAP_API_PATH}/user/swaps/local`,
    {
      account: normalizedAccount,
      page,
      limit,
    },
    { signal },
  );

  const data = getSwapApiData(response, 'Failed to fetch swap history');
  const pageSize = data.page_size ?? limit;
  const currentPage = data.page ?? page;

  return {
    records: mapUserSwapHistory(data, (currentPage - 1) * pageSize),
    total: data.total ?? 0,
    page: currentPage,
    pageSize,
    hasMore: data.has_more ?? false,
  };
};
