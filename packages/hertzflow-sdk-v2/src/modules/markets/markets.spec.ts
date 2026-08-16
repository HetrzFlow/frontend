import { describe, expect, it } from "vitest";

import { bscTestnetSdk, bscTestnetSdkConfig, getTestMarketsInfoData, hasBscTestnetConfig } from "utils/testUtil";

import { HertzFlowSDK } from "../../index";

describe.skipIf(!hasBscTestnetConfig)("Markets", () => {
  describe("getMarkets", () => {
    it("should be able to get markets data", async () => {
      const markets = await bscTestnetSdk.markets.getMarkets();
      expect(markets).toBeDefined();
    });

    it("should respect config filters", async () => {
      const sdk = new HertzFlowSDK({
        ...bscTestnetSdkConfig,
        markets: {
          "0x47c031236e19d024b42f8AE6780E44A573170703": {
            isListed: false,
          },
        },
      });
      const baseSdkResponse = await bscTestnetSdk.markets.getMarkets();
      const sdkResponse = await sdk.markets.getMarkets();
      expect(
        baseSdkResponse.find((v) => v.marketTokenAddress === "0x47c031236e19d024b42f8AE6780E44A573170703")
      ).toBeDefined();
      expect(
        sdkResponse.find((v) => v.marketTokenAddress === "0x47c031236e19d024b42f8AE6780E44A573170703")
      ).not.toBeDefined();
    });
  });

  describe("mergeMarketsInfo", () => {
    it("should be able to build markets info", async () => {
      const response = await getTestMarketsInfoData(bscTestnetSdk);
      expect(response.marketsInfoData).toBeDefined();
    });
  });

});
