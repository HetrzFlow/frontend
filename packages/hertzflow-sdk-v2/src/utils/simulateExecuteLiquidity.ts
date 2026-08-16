import {
  type Abi,
  type Address,
  decodeAbiParameters,
  decodeErrorResult,
  encodeFunctionData,
  withRetry,
} from "viem";

import { abis } from "abis/index";
import { getContract } from "configs/contracts";
import type { SwapPricingType } from "types/orders";
import type { TokenPrices, TokensData } from "types/tokens";
import type { HertzFlowSDK } from "..";

import { convertToContractPrice, getTokenData } from "./tokens";

export type SimulateExecuteLiquidityMethod =
  | "simulateExecuteLatestDeposit"
  | "simulateExecuteLatestWithdrawal"
  | "simulateExecuteLatestHlvDeposit"
  | "simulateExecuteLatestHlvWithdrawal";

export type LiquidityPriceOverride = {
  tokenAddress: string;
  contractPrices?: TokenPrices;
  prices?: TokenPrices;
};

const INSUFFICIENT_WNT_EXECUTION_FEE_SELECTOR = "0x3a78cd7e";

export function parseRequiredExecutionFeeFromError(error: unknown): bigint | undefined {
  const hexPattern = new RegExp(`${INSUFFICIENT_WNT_EXECUTION_FEE_SELECTOR}[0-9a-fA-F]{128}`);
  const queue: unknown[] = [error];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item || visited.has(item)) continue;
    visited.add(item);

    if (typeof item === "string") {
      const matched = item.match(hexPattern)?.[0];
      if (!matched) continue;
      try {
        const [, requiredExecutionFee] = decodeAbiParameters(
          [{ type: "uint256" }, { type: "uint256" }],
          `0x${matched.slice(10)}` as `0x${string}`
        );
        return requiredExecutionFee;
      } catch {
        return undefined;
      }
    }

    if (typeof item === "object") {
      const record = item as Record<string, unknown>;
      queue.push(record.message, record.shortMessage, record.details, record.data, record.cause);
    }
  }

  return undefined;
}

export type LiquiditySimulationPrices = {
  primaryTokens: Address[];
  primaryPrices: { min: bigint; max: bigint }[];
};

export function getLiquiditySimulationPrices(
  prices: Record<Address, TokenPrices>,
  tokensData: TokensData,
  overrides: LiquidityPriceOverride[] = []
): LiquiditySimulationPrices {
  const primaryTokens: Address[] = [];
  const primaryPrices: { min: bigint; max: bigint }[] = [];

  for (const address of Object.keys(tokensData)) {
    const token = getTokenData(tokensData, address);
    const convertedToken = getTokenData(tokensData, address, "wrapped");
    const tokenPrice = prices?.[address as Address];
    const convertedAddress = (convertedToken?.address ?? address) as Address;

    if (!token || !tokenPrice || primaryTokens.includes(convertedAddress)) {
      continue;
    }

    primaryTokens.push(convertedAddress);

    const currentPrice = {
      min: convertToContractPrice(tokenPrice.minPrice, token.decimals),
      max: convertToContractPrice(tokenPrice.maxPrice, token.decimals),
    };

    const override = overrides.find((o) => o.tokenAddress === address);
    const overridePrice = override?.contractPrices ?? override?.prices;

    if (overridePrice) {
      primaryPrices.push({
        min: overridePrice.minPrice,
        max: overridePrice.maxPrice,
      });
    } else {
      primaryPrices.push(currentPrice);
    }
  }

  return { primaryTokens, primaryPrices };
}

const END_OF_ORACLE_SIMULATION_SELECTOR = "0x4e48dcda";

function extractDataFromError(errorMessage: unknown): `0x${string}` | null {
  if (typeof errorMessage !== "string") return null;

  const dataMatch = errorMessage.match(/data="(0x[^"]+)"/);
  if (dataMatch?.[1]) return dataMatch[1] as `0x${string}`;

  const signatureMatch = errorMessage.match(/Unable to decode signature "(0x[^"]+)"/);
  if (signatureMatch?.[1]) return signatureMatch[1] as `0x${string}`;

  return null;
}

function isEndOfOracleSimulation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes(END_OF_ORACLE_SIMULATION_SELECTOR)) {
    return true;
  }

  const errorData = extractDataFromError(message);
  if (!errorData) return false;

  if (errorData === END_OF_ORACLE_SIMULATION_SELECTOR) {
    return true;
  }

  try {
    const decoded = decodeErrorResult({
      abi: abis.CustomErrors,
      data: errorData,
    });
    return decoded.errorName === "EndOfOracleSimulation";
  } catch {
    return false;
  }
}

function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMsg = message.toLowerCase();
  return (
    lowerMsg.includes("unsupported block number") ||
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("load failed")
  );
}

function isNotEnoughFundsError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMsg = message.toLowerCase();
  return lowerMsg.includes("insufficient funds for gas") || lowerMsg.includes("not enough funds for gas");
}

export async function simulateExecuteLiquidityTxn(
  sdk: HertzFlowSDK,
  params: {
    createMulticallPayload: `0x${string}`[];
    prices: LiquiditySimulationPrices;
    value: bigint;
    method: SimulateExecuteLiquidityMethod;
    swapPricingType?: SwapPricingType;
  }
): Promise<void> {
  const { createMulticallPayload, prices, value, method, swapPricingType } = params;
  const account = sdk.account;

  if (!account) {
    throw new Error("SDK account is not defined");
  }

  const blockTimestamp = (await sdk.publicClient.readContract({
    address: getContract(sdk.chainId, "Multicall"),
    abi: abis.Multicall as Abi,
    functionName: "getCurrentBlockTimestamp",
    args: [],
  })) as bigint;

  const blockNumber = await sdk.publicClient.getBlockNumber();
  const priceTimestamp = blockTimestamp + 120n;

  const simulationPriceParams = {
    primaryTokens: prices.primaryTokens,
    primaryPrices: prices.primaryPrices,
    minTimestamp: priceTimestamp,
    maxTimestamp: priceTimestamp,
  };

  const simulationPayload: `0x${string}`[] = [...createMulticallPayload];
  const isHlv =
    method === "simulateExecuteLatestHlvDeposit" || method === "simulateExecuteLatestHlvWithdrawal";

  if (method === "simulateExecuteLatestWithdrawal") {
    if (swapPricingType === undefined) {
      throw new Error("swapPricingType is required for simulateExecuteLatestWithdrawal");
    }

    simulationPayload.push(
      encodeFunctionData({
        abi: abis.ExchangeRouter as Abi,
        functionName: "simulateExecuteLatestWithdrawal",
        args: [simulationPriceParams, swapPricingType],
      })
    );
  } else if (method === "simulateExecuteLatestHlvDeposit") {
    simulationPayload.push(
      encodeFunctionData({
        abi: abis.HlvRouter as Abi,
        functionName: "simulateExecuteLatestHlvDeposit",
        args: [simulationPriceParams],
      })
    );
  } else if (method === "simulateExecuteLatestHlvWithdrawal") {
    simulationPayload.push(
      encodeFunctionData({
        abi: abis.HlvRouter as Abi,
        functionName: "simulateExecuteLatestHlvWithdrawal",
        args: [simulationPriceParams],
      })
    );
  } else {
    simulationPayload.push(
      encodeFunctionData({
        abi: abis.ExchangeRouter as Abi,
        functionName: "simulateExecuteLatestDeposit",
        args: [simulationPriceParams],
      })
    );
  }

  const routerAddress = getContract(sdk.chainId, isHlv ? "HlvRouter" : "ExchangeRouter");
  const routerAbi = (isHlv ? abis.HlvRouter : abis.ExchangeRouter) as Abi;
  const simulationAbi = [...routerAbi, ...abis.CustomErrors] as Abi;

  try {
    await withRetry(
      async () => {
        return sdk.publicClient.simulateContract({
          address: routerAddress,
          abi: simulationAbi,
          functionName: "multicall",
          args: [simulationPayload],
          value,
          account,
          blockNumber,
        });
      },
      {
        retryCount: 2,
        delay: 200,
        shouldRetry: ({ error }) => isTransientError(error),
      }
    );
  } catch (txnError) {
    if (isEndOfOracleSimulation(txnError)) {
      return;
    }

    if (isNotEnoughFundsError(txnError)) {
      console.warn("Simulation warning: insufficient funds for gas");
      return;
    }

    const error = txnError instanceof Error ? txnError : new Error(String(txnError));
    error.message = `[Simulation] ${error.message}`;
    throw error;
  }
}
