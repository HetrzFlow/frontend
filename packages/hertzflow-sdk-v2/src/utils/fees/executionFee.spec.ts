import { describe, expect, it } from "vitest";

import { SOURCE_BSC_TESTNET } from "configs/chains";
import { NATIVE_TOKEN_ADDRESS } from "configs/tokens";
import type { GasLimitsConfig } from "types/fees";
import type { TokenPrices, TokensData } from "types/tokens";
import { expandDecimals } from "utils/numbers";

import {
  estimateExecuteHlvDepositGasLimit,
  estimateExecuteHlvWithdrawalGasLimit,
  getExecutionFee,
} from "./executionFee";

describe("HLV execution gas estimates", () => {
  const gasLimits = {
    hlvPerMarketGasLimit: 10n,
    hlvDepositGasLimit: 100n,
    hlvWithdrawalGasLimit: 200n,
    depositToken: 1_000n,
    withdrawalMultiToken: 2_000n,
    singleSwap: 5n,
  } as GasLimitsConfig;

  it("includes callback gas in HLV deposit estimates", () => {
    expect(
      estimateExecuteHlvDepositGasLimit(gasLimits, {
        marketsCount: 2n,
        isMarketTokenDeposit: false,
        swapsCount: 3n,
        callbackGasLimit: 1_000n,
      })
    ).toBe(2_135n);

    expect(
      estimateExecuteHlvDepositGasLimit(gasLimits, {
        marketsCount: 2n,
        isMarketTokenDeposit: true,
        swapsCount: 3n,
        callbackGasLimit: 1_000n,
      })
    ).toBe(1_120n);
  });

  it("includes callback gas in HLV withdrawal estimates", () => {
    expect(
      estimateExecuteHlvWithdrawalGasLimit(gasLimits, {
        marketsCount: 2n,
        swapsCount: 3n,
        callbackGasLimit: 1_000n,
      })
    ).toBe(3_235n);
  });
});

describe("getExecutionFee", () => {
  const chainId = SOURCE_BSC_TESTNET;
  const gasLimits = {
    estimatedGasFeeBaseAmount: 600000n,
    estimatedGasFeePerOraclePrice: 250000n,
    estimatedFeeMultiplierFactor: 1000000000000000000000000000000n,
  } as GasLimitsConfig;

  const nativeTokenPrices = {
    minPrice: expandDecimals(2, 18),
  } as TokenPrices;
  const tokensData = {
    "0xAddress": {
      decimals: 18,
      prices: {
        minPrice: expandDecimals(5, 18),
      },
    },
    [NATIVE_TOKEN_ADDRESS]: {
      decimals: 18,
      prices: {
        minPrice: expandDecimals(2, 18),
      },
    },
  } as unknown as TokensData;

  it("should return undefined if native token is not found", () => {
    const result = getExecutionFee(chainId, gasLimits, nativeTokenPrices, {}, 0n, 0n, 0n);
    expect(result).toBeUndefined();
  });

  it("should return feeUsd for native token 1-2 price", () => {
    const result = getExecutionFee(chainId, gasLimits, nativeTokenPrices, tokensData, 5000000n, 2750000001n, 4n);
    expect(result).toEqual({
      feeUsd: 36300000013200000n,
      feeTokenAmount: 18150000006600000n,
      gasLimit: 6600000n,
      feeToken: tokensData[NATIVE_TOKEN_ADDRESS],
      isFeeHigh: false,
      isFeeVeryHigh: false,
    });
  });

  it("should return isFeeHigh", () => {
    const result = getExecutionFee(
      chainId,
      gasLimits,
      nativeTokenPrices,
      tokensData,
      5000000n,
      expandDecimals(5, 23),
      4n
    );
    expect(result).toEqual({
      feeUsd: 6600000000000000000000000000000n,
      gasLimit: 6600000n,
      feeTokenAmount: 3300000000000000000000000000000n,
      feeToken: tokensData[NATIVE_TOKEN_ADDRESS],
      isFeeHigh: true,
      isFeeVeryHigh: false,
    });
  });

  it("should return isFeeHigh", () => {
    const result = getExecutionFee(
      chainId,
      gasLimits,
      nativeTokenPrices,
      tokensData,
      5000000n,
      expandDecimals(1, 25),
      4n
    );
    expect(result).toEqual({
      feeUsd: 132000000000000000000000000000000n,
      feeTokenAmount: 66000000000000000000000000000000n,
      gasLimit: 6600000n,
      feeToken: tokensData[NATIVE_TOKEN_ADDRESS],
      isFeeHigh: true,
      isFeeVeryHigh: true,
    });
  });

  it("should correctly calculate fee for 1 part", () => {
    const result = getExecutionFee(chainId, gasLimits, nativeTokenPrices, tokensData, 5000000n, 10000000n, 4n, 1);
    expect(result).toEqual({
      feeUsd: 132000000000000n,
      feeTokenAmount: 66000000000000n,
      gasLimit: 6600000n,
      feeToken: tokensData[NATIVE_TOKEN_ADDRESS],
      isFeeHigh: false,
      isFeeVeryHigh: false,
    });
  });

  it("should correctly calculate fee for 5 parts", () => {
    const result = getExecutionFee(chainId, gasLimits, nativeTokenPrices, tokensData, 5000000n, 10000000n, 4n, 5);
    expect(result).toEqual({
      feeUsd: 660000000000000n,
      feeTokenAmount: 330000000000000n,
      gasLimit: 6600000n,
      feeToken: tokensData[NATIVE_TOKEN_ADDRESS],
      isFeeHigh: false,
      isFeeVeryHigh: false,
    });
  });

  it("should correctly calculate fee for 12 parts", () => {
    const result = getExecutionFee(chainId, gasLimits, nativeTokenPrices, tokensData, 5000000n, 10000000n, 4n, 12);
    expect(result).toEqual({
      feeUsd: 1584000000000000n,
      feeTokenAmount: 792000000000000n,
      gasLimit: 6600000n,
      feeToken: tokensData[NATIVE_TOKEN_ADDRESS],
      isFeeHigh: false,
      isFeeVeryHigh: false,
    });
  });
});
