import { describe, expect, it } from "vitest";

import { SOURCE_BSC_MAINNET, SOURCE_BSC_TESTNET } from "configs/chains";
import { MARKETS } from "configs/markets";
import { getTokenBySymbol, getTokensMap } from "configs/tokens";
import { getByKey } from "utils/objects";

describe.each([SOURCE_BSC_MAINNET, SOURCE_BSC_TESTNET])("market token config for chain %s", (chainId) => {
  it("contains every configured market token", () => {
    const tokens = getTokensMap(chainId);

    for (const market of Object.values(MARKETS[chainId])) {
      expect(getByKey(tokens, market.indexTokenAddress), market.indexTokenAddress).toBeDefined();
      expect(getByKey(tokens, market.longTokenAddress), market.longTokenAddress).toBeDefined();
      expect(getByKey(tokens, market.shortTokenAddress), market.shortTokenAddress).toBeDefined();
    }
  });
});

describe("synthetic token symbols", () => {
  it("uses the asset symbol expected by oracle prices and coin configs", () => {
    expect(getTokenBySymbol(SOURCE_BSC_MAINNET, "BTC").isSynthetic).toBe(true);
    expect(getTokenBySymbol(SOURCE_BSC_TESTNET, "BTC").isSynthetic).toBe(true);
    expect(getTokenBySymbol(SOURCE_BSC_TESTNET, "USD/JPY").isSynthetic).toBe(true);
  });

  it("does not replace the native token when a synthetic market has the same symbol", () => {
    expect(getTokenBySymbol(SOURCE_BSC_MAINNET, "BNB").isNative).toBe(true);
    expect(getTokenBySymbol(SOURCE_BSC_MAINNET, "BNB", { isSynthetic: true }).isSynthetic).toBe(true);
  });
});
