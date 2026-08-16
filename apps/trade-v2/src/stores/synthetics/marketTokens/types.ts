import type { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';
import type { Address } from 'viem';

// ============================================================================
// Token Config Constants
// ============================================================================

export const HZLP_TOKEN_CONFIG = {
  name: 'HertzFlow Market Tokens',
  symbol: 'HzLP',
  decimals: 18,
  imageUrl: '/coins/hzlp.png',
  isPlatformToken: true,
} as const;

export const HLV_TOKEN_CONFIG = {
  name: 'HertzFlow Vault Tokens',
  symbol: 'HzV',
  decimals: 18,
  imageUrl: '/coins/hzv.png',
  isPlatformToken: true,
} as const;

// ============================================================================
// Market Token Types
// ============================================================================

export interface MarketTokenData {
  // Token base info
  name: string;
  symbol: string;
  decimals: number;
  imageUrl: string;
  isPlatformToken: boolean;
  address: Address;

  // Dynamic data (from chain)
  prices: TokenPrices;
  totalSupply: bigint;
  walletBalance?: bigint;

  // Static config from inst (won't change once fetched)
  id: string;
  category: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  longTokenAddress: Address;
  shortTokenAddress: Address;
  indexTokenAddress: Address;
  isSameCollaterals: boolean;
  pxDispDecimal: number;

  // Fee data (from backend API)
  feeApy?: string;
  feeAprHistory?: Array<{ fee_apr: string; timestamp: number }>;
}

export type MarketTokensData = Record<Address, MarketTokenData>;

// ============================================================================
// HLV Types (Vault Token Types)
// ============================================================================

/**
 * HLV market configuration within a vault
 */
export interface HlvMarket {
  address: Address;
  isDisabled: boolean;
  hlvMaxMarketTokenBalanceUsd?: bigint;
  hlvMaxMarketTokenBalanceAmount: bigint;
  hzlpBalance: bigint;
}

/**
 * HLV token data (prices separated from base token info)
 */
export interface HlvTokenData {
  name: string;
  symbol: string;
  decimals: number;
  imageUrl: string;
  isPlatformToken: boolean;
  address: Address;
  prices: TokenPrices;
  totalSupply: bigint;
  balance?: bigint;
  contractSymbol: string;
}

/**
 * Token info for long/short tokens in HLV
 */
export interface HlvCollateralToken {
  name: string;
  symbol: string;
  decimals: number;
  address: Address;
  icon?: string;
  prices: TokenPrices;
}

/**
 * Complete HLV info structure
 */
export interface HlvInfo {
  hlvToken: HlvTokenData;
  hlvTokenAddress: Address;
  longTokenAddress: Address;
  shortTokenAddress: Address;
  isSameCollaterals: boolean;
  isSpotOnly: boolean;
  name: string;
  longToken: HlvCollateralToken;
  shortToken: HlvCollateralToken;
  markets: HlvMarket[];
  shiftLastExecutedAt: bigint;
  shiftMinInterval: bigint;
  isDisabled: boolean;
  poolValueMax: bigint;
  poolValueMin: bigint;
  data: string;
  isHlv: true;
  // Top-level fields for consistency with MarketTokenData
  totalSupply: bigint;
  walletBalance?: bigint;
  curator?: string;
  feeApy?: string;
  netApy?: string;
}

/**
 * Map of HLV address to HLV info
 */
export type HlvInfoData = Record<Address, HlvInfo>;

/**
 * HLV list item from contract
 */
export interface HlvListItem {
  hlv: {
    hlvToken: Address;
    longToken: Address;
    shortToken: Address;
  };
  markets: Address[];
}

export type HlvList = HlvListItem[];

// ============================================================================
// Token-view Types (market token + HLV unified output)
// ============================================================================

export type TokenKind = 'hzlp' | 'hlv';

/**
 * Token-view projection for UI consumption.
 * This intentionally avoids market-specific fields (e.g. long/short/index tokens).
 */
export interface TokenView {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  prices?: TokenPrices;
  totalSupply?: bigint;
  balance?: bigint;
  tokenKind: TokenKind;
}

export type TokensViewData = Record<Address, TokenView>;
