import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { serializeAddressSet } from './queryKeyUtils';

// ============================================================================
// Refresh Intervals
// ============================================================================

export const MARKET_TOKENS_REFRESH_INTERVAL = DYNAMIC_DATA_CACHE_TIME;

export const MARKET_TOKENS_STALE_TIME = DYNAMIC_DATA_CACHE_TIME;

export const MARKET_TOKENS_GC_TIME = 5 * 60 * 1000;

export const HLV_REFRESH_INTERVAL = DYNAMIC_DATA_CACHE_TIME;

export const HLV_STALE_TIME = DYNAMIC_DATA_CACHE_TIME;

export const HLV_GC_TIME = 5 * 60 * 1000;

// ============================================================================
// Query Keys
// ============================================================================

export const marketTokensKeys = {
  all: ['marketTokens'] as const,

  chain: (chainId?: number) => [...marketTokensKeys.all, chainId] as const,

  data: (
    chainId: number | undefined,
    account: string | undefined,
    marketAddresses: readonly string[],
    isDeposit: boolean,
  ) =>
    [
      ...marketTokensKeys.chain(chainId),
      'data',
      account ?? 'anonymous',
      serializeAddressSet(marketAddresses),
      isDeposit ? 'deposit' : 'withdrawal',
    ] as const,

  price: (chainId: number, marketAddress: string) =>
    [...marketTokensKeys.chain(chainId), 'price', marketAddress] as const,

  balance: (chainId: number, account: string, marketAddress: string) =>
    [
      ...marketTokensKeys.chain(chainId),
      'balance',
      account,
      marketAddress,
    ] as const,
} as const;

export const hlvTokensKeys = {
  all: ['hlvTokens'] as const,

  chain: (chainId: number | undefined) =>
    [...hlvTokensKeys.all, chainId] as const,

  list: (chainId: number | undefined) =>
    [...hlvTokensKeys.chain(chainId), 'list'] as const,

  info: (
    chainId: number | undefined,
    account: string | undefined,
    hlvAddresses: readonly string[],
    marketsSignature = 'all-markets',
  ) =>
    [
      ...hlvTokensKeys.chain(chainId),
      'info',
      account ?? 'anonymous',
      serializeAddressSet(hlvAddresses),
      marketsSignature,
    ] as const,

  price: (chainId: number, hlvAddress: string) =>
    [...hlvTokensKeys.chain(chainId), 'price', hlvAddress] as const,

  balance: (chainId: number, account: string, hlvAddress: string) =>
    [...hlvTokensKeys.chain(chainId), 'balance', account, hlvAddress] as const,
} as const;
