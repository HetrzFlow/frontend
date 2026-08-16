/**
 * Json files in this directory are prebuild by scripts from the `scripts/prebuild` directory.
 * No need to edit them manually, use `yarn run prebuild` command instead.
 */
import {
  KinkModelMarketRateMulticallRequestConfig,
  MarketConfigMulticallRequestConfig,
  MarketValuesMulticallRequestConfig,
} from "modules/markets/types";

type HashedMarketValuesKeys = Partial<
  Omit<
    Record<keyof MarketValuesMulticallRequestConfig[`${string}-dataStore`]["calls"], string>,
    "claimableFundingAmountLong" | "claimableFundingAmountShort"
  >
>;

type HashedMarketValuesKeysMap = {
  [chainId: number]: {
    [marketToken: string]: HashedMarketValuesKeys;
  };
};

type HashedMarketConfigKeys = Partial<
  Record<keyof MarketConfigMulticallRequestConfig[`${string}-dataStore`]["calls"], string>
>;

type HashedMarketConfigKeysMap = {
  [chainId: number]: {
    [marketToken: string]: HashedMarketConfigKeys;
  };
};

type HashedKinkModelMarketRatesConfigKeys = Record<
  keyof KinkModelMarketRateMulticallRequestConfig[`${string}-dataStore`]["calls"],
  string
>;

type HashedKinkModelMarketRatesKeysMap = {
  [chainId: number]: {
    [marketToken: string]: HashedKinkModelMarketRatesConfigKeys;
  };
};

let hashedMarketValuesKeysPromise: Promise<HashedMarketValuesKeysMap> | undefined;
let hashedMarketConfigKeysPromise: Promise<HashedMarketConfigKeysMap> | undefined;
let hashedKinkModelMarketRatesKeysPromise: Promise<HashedKinkModelMarketRatesKeysMap> | undefined;

export function getHashedMarketValuesKeys() {
  hashedMarketValuesKeysPromise ??= import("./hashedMarketValuesKeys.json").then(
    (mod) => mod.default as HashedMarketValuesKeysMap
  );

  return hashedMarketValuesKeysPromise;
}

export function getHashedMarketConfigKeys() {
  hashedMarketConfigKeysPromise ??= import("./hashedMarketConfigKeys.json").then(
    (mod) => mod.default as HashedMarketConfigKeysMap
  );

  return hashedMarketConfigKeysPromise;
}

export function getHashedKinkModelMarketRatesKeys() {
  hashedKinkModelMarketRatesKeysPromise ??= import("./hashedKinkModelMarketRatesKeys.json").then(
    (mod) => mod.default as HashedKinkModelMarketRatesKeysMap
  );

  return hashedKinkModelMarketRatesKeysPromise;
}
