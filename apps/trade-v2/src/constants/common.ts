export const DEFAULT_INST_ID = 'BTC-USD';

export const BSC_DATA_QUERY_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_BSC;
export const BSC_DATA_ORACLE_API_BASE_URL =
  process.env.NEXT_PUBLIC_ORACLE_API_URL_BSC;

// Force use specific chain ID for SDK and data fetching
export const FORCE_CHAIN_ID = process.env.NEXT_PUBLIC_FORCE_CHAIN_ID
  ? Number(process.env.NEXT_PUBLIC_FORCE_CHAIN_ID)
  : undefined;

export const ENABLE_SWAP = process.env.NEXT_PUBLIC_ENABLE_SWAP === 'true';
export const ENABLE_MERITS = process.env.NEXT_PUBLIC_ENABLE_MERITS === 'true';
export const SHOW_LP_PENDING_ORDERS =
  process.env.NEXT_PUBLIC_SHOW_LP_PENDING_ORDERS !== 'false';
export const ENABLE_GENESIS_REFERRAL_CODE =
  process.env.NEXT_PUBLIC_ENABLE_GENESIS_REFERRAL_CODE === 'true';
