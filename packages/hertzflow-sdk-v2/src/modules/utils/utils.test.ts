import { describe, expect, it, vi } from "vitest";

import { SOURCE_BSC_TESTNET } from "configs/chains";
import type { GasLimitsConfig } from "types/fees";
import { DecreasePositionSwapType } from "types/orders";

import { Utils } from "./utils";

const gasLimits = {
  increaseOrder: 2_000_000n,
  decreaseOrder: 1_500_000n,
  singleSwap: 100_000n,
} as GasLimitsConfig;

const utils = new Utils({} as any);

describe("Utils.getGasLimits", () => {
  it("reports the failed gas-limit key instead of converting undefined to bigint", async () => {
    const rpcError = {
      message: "RPC request failed",
      shortMessage: "HTTP request failed.",
    };
    const failedCall = {
      returnValues: [],
      success: false,
      error: rpcError,
    };
    const sdk = {
      chainId: SOURCE_BSC_TESTNET,
      executeMulticall: vi.fn().mockResolvedValue({
        success: false,
        errors: {
          dataStore: {
            depositToken: rpcError,
          },
        },
        data: {
          dataStore: {
            depositToken: failedCall,
          },
        },
      }),
    };

    await expect(new Utils(sdk as any).getGasLimits()).rejects.toThrow(
      'Failed to fetch gas limit "depositToken": HTTP request failed.'
    );
  });
});

describe("Utils.getEstimatedGasFee", () => {
  it("includes callback gas for increase orders", async () => {
    const estimatedGas = await utils.getEstimatedGasFee(
      "increase",
      {
        increaseAmounts: { swapsCount: 2 },
        callbackGasLimit: 1_000_000n,
      },
      gasLimits
    );

    expect(estimatedGas).toBe(3_200_000n);
  });

  it("includes callback gas for decrease orders", async () => {
    const estimatedGas = await utils.getEstimatedGasFee(
      "decrease",
      {
        decreaseAmounts: { decreaseSwapType: DecreasePositionSwapType.SwapPnlTokenToCollateralToken },
        callbackGasLimit: 1_000_000n,
      },
      gasLimits
    );

    expect(estimatedGas).toBe(2_600_000n);
  });

  it("supports an explicit zero callback gas", async () => {
    const estimatedGas = await utils.getEstimatedGasFee(
      "increase",
      { increaseAmounts: { swapsCount: 0 }, callbackGasLimit: 0n },
      gasLimits
    );

    expect(estimatedGas).toBe(2_000_000n);
  });
});
