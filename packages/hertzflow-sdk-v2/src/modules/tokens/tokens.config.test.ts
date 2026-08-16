import { describe, expect, it, vi } from "vitest";

import { SOURCE_BSC_TESTNET } from "configs/chains";
import { getWrappedToken } from "configs/tokens";
import type { TokensData } from "types/tokens";

import { HertzFlowSDK } from "../..";

describe("Tokens config", () => {
  it("applies static overrides to SDK-configured tokens", async () => {
    const wrappedToken = getWrappedToken(SOURCE_BSC_TESTNET);
    const sdk = new HertzFlowSDK({
      chainId: SOURCE_BSC_TESTNET,
      rpcUrl: "",
      oracleUrl: "",
      tokens: {
        [wrappedToken.address]: {
          symbol: "CUSTOM-WBNB",
          visualMultiplier: 100,
        },
      },
    });

    const { tokensData } = await sdk.tokens.getTokensData();

    expect(tokensData?.[wrappedToken.address]).toMatchObject({
      address: wrappedToken.address,
      name: wrappedToken.name,
      symbol: "CUSTOM-WBNB",
      decimals: wrappedToken.decimals,
      visualMultiplier: 100,
    });
  });

  it("ignores async metadata for SDK-configured addresses", async () => {
    const wrappedToken = getWrappedToken(SOURCE_BSC_TESTNET);
    const tokensLoader = vi.fn<() => Promise<TokensData>>().mockResolvedValue({
      [wrappedToken.address.toLowerCase()]: {
        address: wrappedToken.address.toLowerCase(),
        name: "API Wrapped BNB",
        symbol: "API-WBNB",
        decimals: 8,
        visualPrefix: "API",
      },
    });
    const sdk = new HertzFlowSDK({
      chainId: SOURCE_BSC_TESTNET,
      rpcUrl: "",
      oracleUrl: "",
      tokens: tokensLoader,
    });

    const { tokensData } = await sdk.tokens.getTokensData();
    const token = tokensData?.[wrappedToken.address];

    expect(tokensLoader).toHaveBeenCalledOnce();
    expect(token).toMatchObject({
      address: wrappedToken.address,
      name: "Wrapped BNB",
      symbol: wrappedToken.symbol,
      decimals: 18,
      isWrapped: true,
    });
    expect(token).not.toHaveProperty("visualPrefix");
  });

  it("keeps dynamically listed tokens that are not in the SDK config", async () => {
    const dynamicTokenAddress = "0x1111111111111111111111111111111111111111";
    const sdk = new HertzFlowSDK({
      chainId: SOURCE_BSC_TESTNET,
      rpcUrl: "",
      oracleUrl: "",
      tokens: async () => ({
        [dynamicTokenAddress]: {
          address: dynamicTokenAddress,
          name: "New Market Token",
          symbol: "NEW",
          decimals: 18,
        },
      }),
    });

    const { tokensData } = await sdk.tokens.getTokensData();

    expect(tokensData?.[dynamicTokenAddress]).toEqual({
      address: dynamicTokenAddress,
      name: "New Market Token",
      symbol: "NEW",
      decimals: 18,
    });
  });

  it("refreshes async metadata after the cache expires", async () => {
    vi.useFakeTimers();
    const dynamicTokenAddress = "0x1111111111111111111111111111111111111111";
    const tokensLoader = vi.fn<() => Promise<TokensData>>().mockResolvedValue({
      [dynamicTokenAddress]: {
        address: dynamicTokenAddress,
        name: "New Market Token",
        symbol: "NEW",
        decimals: 18,
      },
    });
    const sdk = new HertzFlowSDK({
      chainId: SOURCE_BSC_TESTNET,
      rpcUrl: "",
      oracleUrl: "",
      tokens: tokensLoader,
    });

    try {
      await sdk.tokens.getTokensData();
      await sdk.tokens.getTokensData();
      expect(tokensLoader).toHaveBeenCalledOnce();

      vi.advanceTimersByTime(6 * 60 * 60 * 1000 + 1);
      await sdk.tokens.getTokensData();
      expect(tokensLoader).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("falls back to static token configuration when the loader fails", async () => {
    const sdk = new HertzFlowSDK({
      chainId: SOURCE_BSC_TESTNET,
      rpcUrl: "",
      oracleUrl: "",
      tokens: vi.fn().mockRejectedValue(new Error("network unavailable")),
      settings: { debugMode: false },
    });

    const { tokensData } = await sdk.tokens.getTokensData();

    expect(tokensData?.[getWrappedToken(SOURCE_BSC_TESTNET).address]).toBeDefined();
  });

  it("retries a failed metadata refresh sooner than the normal cache interval", async () => {
    vi.useFakeTimers();
    const dynamicTokenAddress = "0x1111111111111111111111111111111111111111";
    const tokensLoader = vi
      .fn<() => Promise<TokensData>>()
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValue({
        [dynamicTokenAddress]: {
          address: dynamicTokenAddress,
          name: "New Market Token",
          symbol: "NEW",
          decimals: 18,
        },
      });
    const sdk = new HertzFlowSDK({
      chainId: SOURCE_BSC_TESTNET,
      rpcUrl: "",
      oracleUrl: "",
      tokens: tokensLoader,
      settings: { debugMode: false },
    });

    try {
      await sdk.tokens.getTokensData();
      await sdk.tokens.getTokensData();
      expect(tokensLoader).toHaveBeenCalledOnce();

      vi.advanceTimersByTime(60 * 1000 + 1);
      const { tokensData } = await sdk.tokens.getTokensData();

      expect(tokensLoader).toHaveBeenCalledTimes(2);
      expect(tokensData?.[dynamicTokenAddress]).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects an incomplete override for an unknown token", async () => {
    const unknownTokenAddress = "0x2222222222222222222222222222222222222222";
    const sdk = new HertzFlowSDK({
      chainId: SOURCE_BSC_TESTNET,
      rpcUrl: "",
      oracleUrl: "",
      tokens: {
        [unknownTokenAddress]: {
          symbol: "UNKNOWN",
        },
      },
    });

    await expect(sdk.tokens.getTokensData()).rejects.toThrow(
      `Incomplete token configuration for ${unknownTokenAddress}`
    );
  });
});
