export type WithRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type PickOptional<T, K extends keyof T> = Pick<T, K>;

export enum Environment {
  TESTNET = 'testnet',
  MAINNET = 'mainnet',
}

export type SuiAddress = string;
export type SuiTypeIdentifier = `${SuiAddress}::${string}::${string}`;

export type SafeNumber = string;
