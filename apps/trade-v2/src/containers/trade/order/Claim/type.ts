import { Address } from 'viem';

export type ClaimType = 'funding_fees' | 'collateral';

export type ClaimDetailType = {
  marketAddress?: Address;
  amount: string;
  usd?: string;
  tokenAddress: Address;
};

export type ClaimPendingTableDataType = {
  kind: 'pending';
  id: string;
  claim_type: ClaimType;
  marketAddress?: Address;
  amount: string;
  usd?: string;
  tokenAddress: Address;
  timeKey?: number;
};

export type ClaimHistoryDetailDataType = {
  claim_type: ClaimType;
  market: Address;
  market_symbol: string;
  token: Address;
  amount: string;
  amount_usd: string;
  is_long: boolean;
};

export type ClaimHistoryItemDataType = {
  tx_hash: string;
  total_claim_count: number;
  total_amount_usd: string;
  market_symbols: string[];
  claim_time_ms: number;
  details: ClaimHistoryDetailDataType[];
};

export type ClaimHistoryPageDataType = {
  items: ClaimHistoryItemDataType[];
  has_more: boolean;
  next_cursor: string;
};

export type ClaimHistoryTableDataType = {
  kind: 'history';
  id: string;
  tx_hash: string;
  claim_time_ms: number;
  total_claim_count: number;
  total_amount_usd: string;
  market_symbols: string[];
  details: ClaimHistoryDetailDataType[];
  detailsByMarket: Record<string, ClaimHistoryDetailDataType[]>;
  symbolLabel: string;
  typeLabel: string;
  valueUsd: string;
  primaryMarketAddress?: Address;
  isBatch: boolean;
  extraMarketCount: number;
  claim_type?: ClaimType;
};

export type ClaimTableDataType =
  | ClaimPendingTableDataType
  | ClaimHistoryTableDataType;
