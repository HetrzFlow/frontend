# web-hub

Web Hub is a Turborepo monorepo for HertzFlow frontend applications and shared packages. The current HertzFlow EVM application (`trade-v2`) is deployed on BNB Smart Chain (BSC), with production on BSC mainnet and development support on BSC testnet.

## BNB Chain deployment

HertzFlow's current trading application and EVM SDK are built specifically for BNB Smart Chain. The repository configures both supported BNB Chain networks directly:

| Network                 | Chain ID | Usage                   | Configured RPC fallback                  |
| ----------------------- | -------- | ----------------------- | ---------------------------------------- |
| BNB Smart Chain mainnet | `56`     | Production deployments  | `https://bsc-dataseed.bnbchain.org`      |
| BNB Smart Chain testnet | `97`     | Development and testing | `https://bsc-testnet-rpc.publicnode.com` |

The source of truth for network IDs and chain metadata is [`packages/hertzflow-sdk-v2/src/configs/chains.ts`](packages/hertzflow-sdk-v2/src/configs/chains.ts). The `trade-v2` RPC transport and BNB Chain fallbacks are configured in [`apps/trade-v2/src/common/chainClient/HzSdkProvider.tsx`](apps/trade-v2/src/common/chainClient/HzSdkProvider.tsx).

## Tech stack

- [Turborepo](https://turbo.build/repo) for monorepo task orchestration
- [Next.js](https://nextjs.org/) App Router for frontend applications
- [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/), Radix UI, Lingui, Zustand, and TanStack Query
- pnpm workspaces

## Apps

| App           | Description             | Dev port | Command                           |
| ------------- | ----------------------- | -------- | --------------------------------- |
| `home`        | Landing page            | `3001`   | `cd apps/home && pnpm dev`        |
| `trade-v1`    | Legacy Sui trading app  | `3002`   | `cd apps/trade-v1 && pnpm dev`    |
| `trade-v2`    | Current EVM trading app | `3002`   | `cd apps/trade-v2 && pnpm dev`    |
| `maintenance` | Maintenance page        | `3003`   | `cd apps/maintenance && pnpm dev` |
| `goo`         | Static Goo site         | `3004`   | `cd apps/goo && pnpm dev`         |

`trade-v1` and `trade-v2` share port `3002`, so run only one of them at a time.

## Packages

| Package             | Description                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| `@repo/ui`          | Shared React UI components                                                |
| `@repo/configs`     | Shared ESLint, Stylelint, PostCSS, Prettier, and TypeScript configuration |
| `@repo/i18n`        | Shared Lingui i18n setup                                                  |
| `@repo/common`      | Shared components, hooks, constants, and cross-app utilities              |
| `@repo/lib`         | Formatting, math, REST, WebSocket, and utility libraries                  |
| `@hertzflow/sdk`    | SDK v1 for Sui Move integrations                                          |
| `@hertzflow/sdk-v2` | SDK v2 for EVM and viem integrations                                      |

## Requirements

- Node.js `>=22.19.0`
- pnpm `10.9.0`

## Getting started

Install dependencies from the repository root:

```bash
pnpm install
```

Copy the example environment file for the app you want to run, then fill in the required values:

```bash
cp apps/trade-v2/.env.example apps/trade-v2/.env
```

Common public environment variables include:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

Start all applications and packages:

```bash
pnpm dev
```

Start a single app from its app directory:

```bash
cd apps/trade-v2
pnpm dev
```

Most app `dev` scripts run `lingui extract --clean` before starting.

## Common commands

Run these commands from the repository root unless noted otherwise.

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm dev`         | Start development servers through Turborepo  |
| `pnpm build`       | Build all apps and packages                  |
| `pnpm lint`        | Run lint checks                              |
| `pnpm check-types` | Run TypeScript checks                        |
| `pnpm format`      | Format TypeScript, React, and Markdown files |

## Project layout

```text
web-hub/
├── apps/
│   ├── home/
│   ├── trade-v1/
│   ├── trade-v2/
│   ├── maintenance/
│   └── goo/
└── packages/
    ├── common/
    ├── configs/
    ├── hertzflow-sdk/
    ├── hertzflow-sdk-v2/
    ├── i18n/
    ├── lib/
    └── ui/
```

## Internationalization

The apps use Lingui `.po` files for translations. Locale files live under each app's `locales/` directory and may contain copy in their target language.

## Remote caching

Turborepo can use remote caching to share build artifacts across machines and CI jobs. By default, Turborepo caches locally.

To enable Vercel Remote Cache:

```bash
npx turbo login
npx turbo link
```

## Useful links

- [Turborepo tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Turborepo caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Turborepo remote caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Turborepo filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Turborepo configuration](https://turbo.build/repo/docs/reference/configuration)
- [Turborepo CLI](https://turbo.build/repo/docs/reference/command-line-reference)
