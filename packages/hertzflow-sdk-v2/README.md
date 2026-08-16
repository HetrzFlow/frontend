# @hertzflow/sdk-v2

TypeScript SDK for reading HertzFlow contracts and submitting protocol
transactions from `viem`-based applications.

Supported chains:

- BNB Smart Chain mainnet (`56`)
- BNB Smart Chain testnet (`97`)

## Installation

```bash
npm install @hertzflow/sdk-v2 viem
# or
pnpm add @hertzflow/sdk-v2 viem
# or
yarn add @hertzflow/sdk-v2 viem
```

Install `viem` directly when the application creates and passes custom public
or wallet clients.

## Configuration

```typescript
import { HertzFlowSDK } from "@hertzflow/sdk-v2";
import { SOURCE_BSC_MAINNET } from "@hertzflow/sdk-v2/configs/chains";

const sdk = new HertzFlowSDK({
  chainId: SOURCE_BSC_MAINNET,
  rpcUrl: "<RPC_URL>",
  oracleUrl: "<ORACLE_URL>",
  account: "0xYourAccount",
  walletClient,
});
```

`rpcUrl` is not used when a custom `publicClient` is supplied. A
`walletClient` is required for writes and can also be installed later with
`sdk.setWalletClient(walletClient)`.

## Markets, tokens, and positions

`getMarkets()` returns contract market data as an array. APIs such as
`getPositions()` require a map keyed by market-token address.

```typescript
const markets = await sdk.markets.getMarkets();
const marketsData = Object.fromEntries(
  markets.map((market) => [market.marketTokenAddress, market]),
);

const { tokensData } = await sdk.tokens.getTokensData();
const { pricesData } = await sdk.tokens.getTokenRecentPrices();

if (!tokensData || !pricesData) {
  throw new Error("Market dependencies are unavailable");
}

const { positionsData } = await sdk.positions.getPositions({
  marketsData,
  tokensData,
  prices: pricesData,
});
```

Market display names, symbols, categories, schedules, visibility, and other
product metadata are not returned by `getMarkets()`. Fetch that metadata in the
application and join it to contract markets by `marketTokenAddress`; do not use
`symbol` as a unique market identifier.

## Token metadata

The SDK contains baseline token configuration for BSC mainnet and testnet. To
discover tokens for newly listed markets without publishing a new SDK version,
provide an application-owned metadata provider:

```typescript
import type { TokensData } from "@hertzflow/sdk-v2/types/tokens";

const sdk = new HertzFlowSDK({
  chainId: 56,
  rpcUrl: "<RPC_URL>",
  oracleUrl: "<ORACLE_URL>",
  tokens: async (): Promise<TokensData> => {
    const response = await fetch("<APPLICATION_TOKEN_METADATA_URL>");
    return response.json();
  },
});
```

Pass `tokens` as an object for static overrides, or as an async function to add
addresses that are absent from the SDK configuration.

## Prices

Configure the required `oracleUrl` to use `sdk.oracle.getLatestPrices()` for
the raw Oracle response or `sdk.tokens.getTokenRecentPrices()` for
`TokenPricesData` keyed by token address. The mapped result can be passed
directly to SDK calculations such as `getPositions()`, `getMarketsValues()`,
and liquidity simulations.

## External swaps

Peach external swaps are currently supported on BSC mainnet only. Quotes are
validated against trusted router addresses before they are planned, simulated,
approved, or sent.

```typescript
const quote = await sdk.externalSwap.getQuote({
  tokenIn,
  tokenOut,
  amountIn,
  slippageBps: 50,
});

const plan = await sdk.externalSwap.buildSwapPlan({
  quote,
  owner: sdk.account!,
});

if (plan.approval) {
  await sdk.sendTransaction(plan.approval);
}
await sdk.sendTransaction(plan.swap);
```

Alternatively, use `approveSwap()` and `executeSwap()` for the same transaction
flow.

## Documentation

Full API reference and integration guides:

**https://hertzflow.gitbook.io/hertzflow-docs/tech-docs/hertzflow-sdk**

## License

MIT
