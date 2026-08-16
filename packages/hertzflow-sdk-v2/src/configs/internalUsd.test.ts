import { zeroAddress } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SOURCE_BSC_MAINNET, SOURCE_BSC_TESTNET } from "./chains";
import { getContract } from "./contracts";
import {
  clearRuntimeInternalUsdConfigs,
  getInternalUsdConfig,
  getInternalUsdCollateralPriceTokenAddress,
  getInternalUsdParamsForInst,
  getOrResolveInternalUsdConfig,
  hydrateInternalUsdConfigs,
  resolveInternalUsdConfig,
  validateInternalUsdConfig,
} from "./internalUsd";

describe("internal USD market config", () => {
  beforeEach(() => {
    clearRuntimeInternalUsdConfigs();
  });

  it("enables internal USD only for wrapped-token markets", () => {
    const config = getInternalUsdConfig(SOURCE_BSC_TESTNET)!;
    const result = getInternalUsdParamsForInst(SOURCE_BSC_TESTNET, {
      longTokenAddress: config.wrappedTokenAddress,
      shortTokenAddress: config.wrappedTokenAddress,
    });

    expect(result).toBeDefined();
  });

  it("does not enable internal USD for ordinary markets", () => {
    expect(
      getInternalUsdParamsForInst(SOURCE_BSC_TESTNET, {
        longTokenAddress: "0x1111111111111111111111111111111111111111",
        shortTokenAddress: "0x2222222222222222222222222222222222222222",
      })
    ).toBeUndefined();
  });

  it("does not enable internal USD on an unconfigured chain", () => {
    expect(
      getInternalUsdParamsForInst(1, {
        marketTokenAddress: "0x1111111111111111111111111111111111111111",
      })
    ).toBeUndefined();
  });

  it("uses the underlying stablecoin for HFUSD collateral prices", () => {
    const config = getInternalUsdConfig(SOURCE_BSC_TESTNET)!;
    expect(
      getInternalUsdCollateralPriceTokenAddress({
        chainId: SOURCE_BSC_TESTNET,
        collateralTokenAddress: config.wrappedTokenAddress,
      })
    ).toBe(config.underlyingTokenAddress);
  });

  it("includes the known Mainnet HFUSD wrappers in the static config", () => {
    const hfUsd = getInternalUsdConfig(SOURCE_BSC_MAINNET, "0x3Cc4C9cbDa158909D385e8B4EbDD80867067623E");
    const hfUsd1 = getInternalUsdConfig(SOURCE_BSC_MAINNET, "0x4928e8dBc3743241eACbC57172a2EC45e5284Cb2");

    expect(hfUsd).toMatchObject({
      underlyingTokenAddress: "0x55d398326f99059fF775485246999027B3197955",
      bankAddress: "0x1b40AE150e956EA1B01e6d6A9dfeE498961D6fFd",
    });
    expect(hfUsd1).toMatchObject({
      underlyingTokenAddress: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
      bankAddress: "0xB5D271f5Ce7553bFFeCD6d840a37C315f7d17080",
    });
  });

  it("resolves a wrapper bank and underlying token from HFBankFactory in one multicall", async () => {
    const config = getInternalUsdConfig(SOURCE_BSC_TESTNET)!;
    const multicall = vi.fn().mockResolvedValue([config.bankAddress, config.underlyingTokenAddress]);

    await expect(
      resolveInternalUsdConfig({
        chainId: SOURCE_BSC_TESTNET,
        wrappedTokenAddress: config.wrappedTokenAddress,
        publicClient: { multicall } as any,
      })
    ).resolves.toEqual(config);

    expect(multicall).toHaveBeenCalledOnce();
    expect(multicall.mock.calls[0]?.[0]).toMatchObject({
      allowFailure: false,
      contracts: [
        {
          address: getContract(SOURCE_BSC_TESTNET, "HFBankFactory"),
          functionName: "getBankByWrappedToken",
          args: [config.wrappedTokenAddress],
        },
        {
          address: getContract(SOURCE_BSC_TESTNET, "HFBankFactory"),
          functionName: "underlyingByWrappedToken",
          args: [config.wrappedTokenAddress],
        },
      ],
    });
  });

  it("prefers static config without making an RPC request", async () => {
    const config = getInternalUsdConfig(SOURCE_BSC_TESTNET)!;
    const multicall = vi.fn();

    await expect(
      getOrResolveInternalUsdConfig({
        chainId: SOURCE_BSC_TESTNET,
        wrappedTokenAddress: config.wrappedTokenAddress,
        publicClient: { multicall } as any,
      })
    ).resolves.toEqual(config);
    expect(multicall).not.toHaveBeenCalled();
  });

  it("hydrates and caches a dynamically registered wrapper", async () => {
    const wrappedTokenAddress = "0x1111111111111111111111111111111111111111";
    const bankAddress = "0x2222222222222222222222222222222222222222";
    const underlyingTokenAddress = "0x3333333333333333333333333333333333333333";
    const multicall = vi.fn().mockResolvedValue([bankAddress, underlyingTokenAddress]);

    await hydrateInternalUsdConfigs({
      chainId: SOURCE_BSC_TESTNET,
      wrappedTokenAddresses: [wrappedTokenAddress, wrappedTokenAddress],
      publicClient: { multicall } as any,
    });
    await getOrResolveInternalUsdConfig({
      chainId: SOURCE_BSC_TESTNET,
      wrappedTokenAddress,
      publicClient: { multicall } as any,
    });

    expect(getInternalUsdConfig(SOURCE_BSC_TESTNET, wrappedTokenAddress)).toEqual({
      bankAddress,
      wrappedTokenAddress,
      underlyingTokenAddress,
    });
    expect(multicall).toHaveBeenCalledOnce();
    expect(multicall.mock.calls[0]?.[0].contracts).toHaveLength(2);
  });

  it("keeps dynamic Mainnet discovery available for future wrappers", async () => {
    const wrappedTokenAddress = "0x4444444444444444444444444444444444444444";
    const bankAddress = "0x5555555555555555555555555555555555555555";
    const underlyingTokenAddress = "0x6666666666666666666666666666666666666666";
    const multicall = vi.fn().mockResolvedValue([bankAddress, underlyingTokenAddress]);

    await expect(
      getOrResolveInternalUsdConfig({
        chainId: SOURCE_BSC_MAINNET,
        wrappedTokenAddress,
        publicClient: { multicall } as any,
      })
    ).resolves.toEqual({
      bankAddress,
      wrappedTokenAddress,
      underlyingTokenAddress,
    });
    expect(multicall).toHaveBeenCalledOnce();
  });

  it("caches tokens that are not registered wrappers", async () => {
    const wrappedTokenAddress = "0x1111111111111111111111111111111111111111";
    const multicall = vi.fn().mockResolvedValue([zeroAddress, zeroAddress]);

    await expect(
      getOrResolveInternalUsdConfig({
        chainId: SOURCE_BSC_TESTNET,
        wrappedTokenAddress,
        publicClient: { multicall } as any,
      })
    ).resolves.toBeUndefined();
    await getOrResolveInternalUsdConfig({
      chainId: SOURCE_BSC_TESTNET,
      wrappedTokenAddress,
      publicClient: { multicall } as any,
    });

    expect(multicall).toHaveBeenCalledOnce();
  });

  it("rejects wrappers that are not registered in HFBankFactory", async () => {
    const config = getInternalUsdConfig(SOURCE_BSC_TESTNET)!;
    const multicall = vi.fn().mockResolvedValue([zeroAddress, zeroAddress]);

    await expect(
      resolveInternalUsdConfig({
        chainId: SOURCE_BSC_TESTNET,
        wrappedTokenAddress: config.wrappedTokenAddress,
        publicClient: { multicall } as any,
      })
    ).rejects.toThrow("No HFBank registered");
  });

  it("detects a stale static bank proxy configuration", async () => {
    const config = getInternalUsdConfig(SOURCE_BSC_TESTNET)!;
    const multicall = vi
      .fn()
      .mockResolvedValue(["0x1111111111111111111111111111111111111111", config.underlyingTokenAddress]);

    await expect(
      validateInternalUsdConfig({
        chainId: SOURCE_BSC_TESTNET,
        config,
        publicClient: { multicall } as any,
      })
    ).rejects.toThrow("does not match HFBankFactory");
  });
});
