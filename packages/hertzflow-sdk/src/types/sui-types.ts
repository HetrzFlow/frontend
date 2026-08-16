import { TransactionArgument } from '@mysten/sui/transactions';
import { HertzflowError, TypesErrorCode } from '../errors/errors';

export type SuiAddressType = string;

export type SuiObjectIdType = string;

export const CLOCK_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000006';

export type SuiResource = any;

export type DataPage<T> = {
  data: T[];
  nextCursor?: any;
  hasNextPage: boolean;
};

export type PageQuery = {
  cursor?: any;
  limit?: number | null;
};

export type PaginationArgs = 'all' | PageQuery;

export type SuiStructTag = {
  full_address: string;

  source_address: string;

  address: SuiAddressType;

  module: string;

  name: string;

  type_arguments: SuiAddressType[];
};

export type SuiBasicTypes =
  | 'address'
  | 'bool'
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'u128'
  | 'u256';

export interface CoinAsset {
  coinAddress: string;
  coinObjectId: string;
  balance: bigint;
}

export type Package<T = undefined> = {
  package_id: string;

  published_at: string;

  version?: number;

  config?: T;
};

export type SuiTxArg = TransactionArgument | string | number | bigint | boolean;

export type SuiInputTypes = 'object' | SuiBasicTypes;

export type CoinPairType = {
  coinTypeA: SuiAddressType;

  coinTypeB: SuiAddressType;
};

export const getDefaultSuiInputType = (value: any): SuiInputTypes => {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return 'object';
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return 'u64';
  }
  if (typeof value === 'boolean') {
    return 'bool';
  }
  throw new HertzflowError(
    `Unknown type for value: ${value}`,
    TypesErrorCode.InvalidType,
  );
};
