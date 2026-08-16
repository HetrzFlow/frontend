# HertzFlow Trade V2

Trade V2 is the current HertzFlow trading application. It is deployed on BNB Smart Chain (BSC) and uses `@hertzflow/sdk-v2` to read HertzFlow contracts and submit protocol transactions.

## BNB Chain networks

| Network                 | Chain ID | Role                    | Block explorer                         |
| ----------------------- | -------- | ----------------------- | -------------------------------------- |
| BNB Smart Chain mainnet | `56`     | Production              | [BscScan](https://bscscan.com/)        |
| BNB Smart Chain testnet | `97`     | Development and testing | [BscScan](https://testnet.bscscan.com) |

The application supports only these BNB Chain networks. Wallet connections are restricted to BSC mainnet and testnet, and the SDK resolves contract addresses, tokens, markets, and gas settings by the selected BNB Chain ID.

Network IDs and metadata are defined in [`../../packages/hertzflow-sdk-v2/src/configs/chains.ts`](../../packages/hertzflow-sdk-v2/src/configs/chains.ts). RPC transports include the BNB Chain mainnet endpoint `https://bsc-dataseed.bnbchain.org` and BSC testnet fallbacks configured in [`src/common/chainClient/HzSdkProvider.tsx`](src/common/chainClient/HzSdkProvider.tsx).

## Requirements

- Node.js `>=22.19.0`
- pnpm `10.9.0`

## Local development

Install dependencies from the repository root:

```bash
pnpm install
```

Copy the example environment file and provide the required HertzFlow API, oracle, and wallet authentication values:

```bash
cp apps/trade-v2/.env.example apps/trade-v2/.env
```

`NEXT_PUBLIC_FORCE_CHAIN_ID` selects the BNB Chain deployment:

- `56` for BNB Smart Chain mainnet
- `97` for BNB Smart Chain testnet (the example default)

Start the application:

```bash
cd apps/trade-v2
pnpm dev
```

Open [http://localhost:3002/trade](http://localhost:3002/trade).

## Validation

Run checks from the repository root:

```bash
pnpm lint
pnpm check-types
pnpm build
```
