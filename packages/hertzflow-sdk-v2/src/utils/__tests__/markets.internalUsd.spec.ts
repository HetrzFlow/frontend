import type { Address } from "viem";
import { describe, expect, it } from "vitest";

import { SOURCE_BSC_TESTNET } from "configs/chains";
import { getInternalUsdConfig } from "configs/internalUsd";
import type { Market } from "types/markets";
import type { TokenPrices, TokensData } from "types/tokens";

import { getContractMarketPrices } from "../markets";

describe("getContractMarketPrices with internal USD", () => {
  it("uses the underlying USDT price for HFUSD collateral", () => {
    const indexTokenAddress = "0x0000000000000000000000000000000000000001";
    const config = getInternalUsdConfig(SOURCE_BSC_TESTNET)!;
    const wrappedTokenAddress = config.wrappedTokenAddress;
    const underlyingTokenAddress = config.underlyingTokenAddress;
    const tokensData = {
      [indexTokenAddress]: { decimals: 8 },
      [wrappedTokenAddress]: { decimals: 18 },
    } as TokensData;
    const prices = {
      [indexTokenAddress]: { minPrice: 1000n, maxPrice: 2000n },
      [underlyingTokenAddress]: { minPrice: 1n, maxPrice: 2n },
    } as Record<Address, TokenPrices>;
    const market = {
      indexTokenAddress,
      longTokenAddress: wrappedTokenAddress,
      shortTokenAddress: wrappedTokenAddress,
    } as Market;

    const result = getContractMarketPrices(tokensData, market, prices, SOURCE_BSC_TESTNET);

    expect(result?.longTokenPrice).toBeDefined();
    expect(result?.shortTokenPrice).toEqual(result?.longTokenPrice);
  });
});
