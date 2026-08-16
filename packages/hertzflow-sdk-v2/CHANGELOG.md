# Changelog

All notable changes to `@hertzflow/sdk-v2` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- BNB Smart Chain Mainnet configuration.
- Pending liquidity-order queries and cancellation.
- Static or async `tokens` configuration for new listings.
- External-swap support and transaction helpers.

### Changed

- Internal USD uses underlying-token prices and payments; user outputs
  auto-redeem to the underlying token.
- Added multi-market liquidity transactions.
- Updated token and market loading with caching and request deduplication.
- Supported chains are limited to BSC mainnet and BSC testnet.
- Restricted package subpath exports and renamed liquidity calculation paths.

### Fixed

- Corrected market-token withdrawal fee estimation.

## [0.2.1] - 2026-08-05

### Added

- Liquidity operations for HzLP and HzV deposits and withdrawals.
- Credit balance and distribution support.
- External swap routing through the Peach aggregator.
- Internal USD token configuration and price-alias handling.

### Changed

- Updated contract addresses, ABIs, market configuration, and prebuilt data keys
  for the latest deployed HertzFlow contracts.
- Updated order creation, fee estimation, claims, referrals, events, and trade
  history handling for the current protocol version.
- Expanded transaction error parsing for the current contract errors.

### Fixed

- Made package entry points load correctly from native Node.js ESM.

## [0.1.0] - 2026-05-21

Initial public release.

### Added

- `HertzFlowSDK` client with modules:
  - `markets` — market list, configs, values, daily volumes, and trading instruments
  - `tokens` — metadata, balances, total supplies, and recent oracle prices
  - `positions` — open positions and enriched position info (PnL, leverage, liquidation)
  - `orders` — increase, decrease, update, cancel; position collateral deposit/withdrawal
  - `trades` — public market trades and user trade history
  - `events` — account-scoped subscriptions (positions, orders, deposits, withdrawals, HLV, shifts, multichain transfers) over WebSocket or HTTP polling
  - `claim` — funding fee and price impact rebate reads and claims
  - `referral` — referral code management, tier reads, and affiliate reward claims
  - `allowance` — ERC20 allowance reads and Synthetics Router approvals
  - `oracle` — oracle helper module
  - `utils` — gas limits, gas price, execution fees, and UI fee factors
- Subpath exports for direct access to `configs/*`, `abis/*`, `modules/*`, `prebuilt/*`, `utils/*`, and `types/*`.
- ESM and CommonJS builds with TypeScript declarations.
- Support for BNB Smart Chain Testnet (chainId `97`).

### Notes

- Requires Node.js 22+.
