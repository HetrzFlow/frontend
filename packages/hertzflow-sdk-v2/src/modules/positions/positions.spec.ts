import { describe, expect, it } from "vitest";

import { bscTestnetSdk, getTestMarketsInfoData, hasBscTestnetConfig } from "utils/testUtil";

describe.skipIf(!hasBscTestnetConfig)("Positions", () => {
  describe("getPositions", () => {
    it("should be able to get positions data", async () => {
      const { marketsInfoData, tokensData } = (await getTestMarketsInfoData(bscTestnetSdk)) ?? {};

      if (!tokensData || !marketsInfoData) {
        throw new Error("Tokens data or markets info is not available");
      }

      const positions = await bscTestnetSdk.positions.getPositions({
        tokensData,
        marketsData: marketsInfoData,
        prices: {},
      });

      expect(positions).toBeDefined();
    });
  });
});
