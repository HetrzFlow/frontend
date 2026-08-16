import { describe, expect, it } from "vitest";

import { SOURCE_BSC_TESTNET } from "configs/chains";
import { getInternalUsdConfig } from "configs/internalUsd";
import type { TokenPricesData } from "types/tokens";

import { setInternalUsdPriceAliases } from "./tokens";

describe("setInternalUsdPriceAliases", () => {
  it("aliases the underlying USDT price to HFUSD", () => {
    const config = getInternalUsdConfig(SOURCE_BSC_TESTNET)!;
    const underlyingPrice = {
      minPrice: 999n,
      maxPrice: 1001n,
    };
    const pricesData: TokenPricesData = {
      [config.underlyingTokenAddress]: underlyingPrice,
    };

    setInternalUsdPriceAliases(SOURCE_BSC_TESTNET, pricesData);

    expect(pricesData[config.wrappedTokenAddress]).toBe(underlyingPrice);
  });

  it("does not add the alias on another chain", () => {
    const config = getInternalUsdConfig(SOURCE_BSC_TESTNET)!;
    const pricesData: TokenPricesData = {
      [config.underlyingTokenAddress]: {
        minPrice: 999n,
        maxPrice: 1001n,
      },
    };

    setInternalUsdPriceAliases(1, pricesData);

    expect(pricesData[config.wrappedTokenAddress]).toBeUndefined();
  });
});
