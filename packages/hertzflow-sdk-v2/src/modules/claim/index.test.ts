import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeFunctionData } from "viem";

import { abis } from "../../abis";
import { SOURCE_BSC_TESTNET } from "../../configs/chains";
import { getContract } from "../../configs/contracts";

import { Claim } from "./index";

describe("Claim", () => {
  const account = "0x1111111111111111111111111111111111111111";
  const market = "0x2222222222222222222222222222222222222222";
  const token = "0x3333333333333333333333333333333333333333";
  const fundingHash = `0x${"1".repeat(64)}`;
  const collateralHash = `0x${"2".repeat(64)}`;

  let callContract: ReturnType<typeof vi.fn>;
  let claim: Claim;

  beforeEach(() => {
    callContract = vi.fn();
    claim = new Claim({
      chainId: SOURCE_BSC_TESTNET,
      account,
      callContract,
    } as never);
  });

  it("claims funding fees through the native exchange router", async () => {
    callContract.mockResolvedValueOnce(fundingHash);

    await expect(claim.claimFundingFees([[market, token]])).resolves.toBe(fundingHash);

    expect(callContract).toHaveBeenCalledWith(
      getContract(SOURCE_BSC_TESTNET, "ExchangeRouter"),
      expect.any(Array),
      "claimFundingFees",
      [[market], [token], account]
    );
  });

  it("claims collateral through the native exchange router", async () => {
    callContract.mockResolvedValueOnce(collateralHash);

    await expect(claim.claimPriceImpactRebates([[market, token, 42n]])).resolves.toBe(collateralHash);

    expect(callContract).toHaveBeenCalledWith(
      getContract(SOURCE_BSC_TESTNET, "ExchangeRouter"),
      expect.any(Array),
      "claimCollateral",
      [[market], [token], [42n], account]
    );
  });

  it("skips markets with failed claimable funding calls", async () => {
    const rpcError = new Error("HTTP request failed");
    const executeMulticall = vi.fn().mockResolvedValue({
      success: false,
      errors: {
        [market]: {
          claimableFundingAmountLong: rpcError,
        },
      },
      data: {
        [market]: {
          claimableFundingAmountLong: {
            returnValues: [],
            success: false,
            error: rpcError,
          },
          claimableFundingAmountShort: {
            returnValues: [20n],
            success: true,
          },
        },
      },
    });
    const claimWithFailedRpc = new Claim({
      chainId: SOURCE_BSC_TESTNET,
      account,
      executeMulticall,
    } as never);

    await expect(
      claimWithFailedRpc.getClaimableFundingData([
        {
          marketTokenAddress: market,
          longTokenAddress: token,
          shortTokenAddress: token,
        } as never,
      ])
    ).resolves.toEqual({});
  });

  it("normalizes and divides successful claimable funding amounts", async () => {
    const executeMulticall = vi.fn().mockResolvedValue({
      success: true,
      errors: {},
      data: {
        [market]: {
          claimableFundingAmountLong: {
            returnValues: ["20"],
            success: true,
          },
          claimableFundingAmountShort: {
            returnValues: [10n],
            success: true,
          },
        },
      },
    });
    const claimWithFundingData = new Claim({
      chainId: SOURCE_BSC_TESTNET,
      account,
      executeMulticall,
    } as never);

    await expect(
      claimWithFundingData.getClaimableFundingData([
        {
          marketTokenAddress: market,
          longTokenAddress: token,
          shortTokenAddress: token,
        } as never,
      ])
    ).resolves.toEqual({
      [market]: {
        longTokenAddress: token,
        shortTokenAddress: token,
        claimableFundingAmountLong: 10n,
        claimableFundingAmountShort: 5n,
      },
    });
  });

  it("claims funding and collateral atomically through multicall", async () => {
    callContract.mockResolvedValueOnce(collateralHash);

    await expect(
      claim.claimAllRebates({
        fundingFeeParams: [[market, token]],
        priceImpactRebateParams: [[market, token, 42n]],
      })
    ).resolves.toBe(collateralHash);

    expect(callContract).toHaveBeenCalledTimes(1);
    expect(callContract).toHaveBeenCalledWith(
      getContract(SOURCE_BSC_TESTNET, "ExchangeRouter"),
      expect.any(Array),
      "multicall",
      [expect.any(Array)]
    );

    const calls = callContract.mock.calls[0]?.[3]?.[0] as `0x${string}`[];
    expect(calls).toHaveLength(2);
    expect(decodeFunctionData({ abi: abis.ExchangeRouter, data: calls[0]! })).toEqual({
      functionName: "claimFundingFees",
      args: [[market], [token], account],
    });
    expect(decodeFunctionData({ abi: abis.ExchangeRouter, data: calls[1]! })).toEqual({
      functionName: "claimCollateral",
      args: [[market], [token], [42n], account],
    });
  });
});
