# Stock Token Index

[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](cli/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)](api/)
[![Chains](https://img.shields.io/badge/Chains-RH%20%7C%20BSC%20%7C%20EVM-lightgrey)](chains/)
[![Data](https://img.shields.io/badge/Data-JSON%20%2B%20Parquet-orange)](data/)

**Every tokenized equity, one index.** A community-maintained registry of
stock tokens across Robinhood Chain, BSC and EVM — ticker, issuer, CUSIP,
wrapper address, decimals, transfer restrictions, settlement provenance
and liquidity venues.

## Why an index?

Tokenized equities are fragmented across chains. BSC hosts TSLAB/NVDAB/MSFTo/GOOGL;
Robinhood Chain is building a stock-token-native L2; generic EVM networks host
one-off wrappers. There is no single source of truth for which ticker maps to
which wrapper, whether a wrapper is issuer-backed, what restrictions apply, and
where liquidity actually lives. This repo is that source of truth, machine-readable
and CI-verified.

## Quick start

```bash
python -m cli.search --chain bsc --ticker TSLAB
python -m cli.verify 0x6Bfa119a191946Ba1E15B1D5e3A1E9B2C9A7fF53 --chain bsc
python -m cli.add --chain robinhood --ticker SKHYB --address 0x...
```

TypeScript:

```ts
import { StockTokenIndex } from "@cervemone/stock-token-index";
const index = new StockTokenIndex({ chain: "robinhood" });
const token = await index.resolve("SKHYB");
```

## Record shape

```json
{
  "ticker": "TSLA", "issuer": "Tesla, Inc.", "cusip": "88160R101",
  "wrapper": "0x...", "chain": "bsc", "chainId": 56, "decimals": 18,
  "transferRestricted": true, "issuerBacked": true,
  "liquidityVenues": ["pancake", "uniswap"], "settlement": "binance"
}
```

## Curation policy

1. Every wrapper resolves on-chain (name/symbol/equityMetadata).
2. Issuer-backed wrappers flagged; community wrappers always labeled.
3. Restriction status verified from contract, never assumed.
4. Nightly snapshot job re-verifies the full registry and files drift issues.

## Layout

```
registry/       canonical records (per chain)
schemas/        JSON Schema + Zod
chains/         chain metadata (RPC, explorer, settlement)
resolvers/      on-chain metadata resolvers
api/            TypeScript client
cli/            Python CLI (search/verify/add)
scripts/        sync + verify jobs
tests/          schema + resolver tests
docs/           curation policy
examples/       usage examples
data/           snapshots + audit logs
configs/        chain configs
.github/        CI workflows
```

## Roadmap

- [x] BSC + EVM registries
- [x] CLI + TS client
- [x] CI nightly verification
- [ ] RH chain registry bootstrap
- [ ] Cross-chain ticker alias map
- [ ] Liquidity snapshots

## License

MIT
