import { createTestClient, http, publicActions, walletActions, type Address } from "viem";

import { SOURCE_BSC_TESTNET, getViemChain } from "configs/chains";
import type { HertzFlowSdkConfig } from "types/sdk";

import type { TokenPricesData } from "types/tokens";
import { HertzFlowSDK } from "../index";

const client = createTestClient({
  chain: getViemChain(SOURCE_BSC_TESTNET),
  mode: "hardhat",
  transport: http(),
})
  .extend(publicActions)
  .extend(walletActions);

export const bscTestnetSdkConfig: HertzFlowSdkConfig = {
  chainId: SOURCE_BSC_TESTNET,
  account: process.env.SDK_TEST_ACCOUNT as Address | undefined,
  oracleUrl: process.env.SDK_TEST_ORACLE_URL ?? "",
  rpcUrl: process.env.SDK_TEST_RPC_URL ?? "",
  walletClient: client,
};

export const hasBscTestnetConfig = Boolean(bscTestnetSdkConfig.rpcUrl && process.env.SDK_TEST_ORACLE_URL);

export const bscTestnetSdk = new HertzFlowSDK(bscTestnetSdkConfig);

export async function getTestMarketsInfoData(
  sdk: HertzFlowSDK,
  pricesData?: TokenPricesData
) {
  const markets = await sdk.markets.getMarkets();
  const { tokensData } = await sdk.tokens.getTokensData();
  if (!tokensData) {
    return {
      marketsInfoData: {},
      tokensData,
    };
  }
  let resolvedPricesData = pricesData;
  if (!resolvedPricesData || Object.keys(resolvedPricesData).length === 0) {
    const pricesResult = await sdk.tokens.getTokenRecentPrices();
    resolvedPricesData = pricesResult.pricesData ?? {};
  }
  const [marketsValues, marketsConfigs] = await Promise.all([
    sdk.markets.getMarketsValues({
      prices: resolvedPricesData,
      markets,
      tokensData,
    }),
    sdk.markets.getMarketsConfigs(markets),
  ]);
  return sdk.markets.mergeMarketsInfo({
    markets,
    tokensData,
    marketsConfigs,
    marketsValues,
  });
}
