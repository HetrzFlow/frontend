import { describe, expect, it } from "vitest";

import { bscTestnetSdk, bscTestnetSdkConfig, hasBscTestnetConfig } from "utils/testUtil";

import { HertzFlowSDK } from "../..";

describe.skipIf(!hasBscTestnetConfig)("Tokens", () => {
  it("should respect passed config", async () => {
    const customTokenAddress = "0x1111111111111111111111111111111111111111";
    const sdk = new HertzFlowSDK({
      ...bscTestnetSdkConfig,
      tokens: {
        [customTokenAddress]: {
          address: customTokenAddress,
          name: "Custom Token",
          symbol: "CUSTOM",
          decimals: 18,
        },
      },
    });

    const data = await sdk.tokens.getTokensData();

    expect(sdk.tokens.tokensConfig[customTokenAddress]?.symbol).toBe("CUSTOM");
    expect(data.tokensData?.[customTokenAddress].symbol).toBe("CUSTOM");
  });

  it("should be able to get tokens data", async () => {
    const response = await bscTestnetSdk.tokens.getTokensData();
    expect(response).toBeDefined();
  });
});
