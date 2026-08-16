import { bsc, bscTestnet, Chain } from "viem/chains";

import type { GasLimitsConfig } from "types/fees";
import { ContractsChainConfig } from "types/chains";

import { SOURCE_BSC_MAINNET, SOURCE_BSC_TESTNET } from "./chainIds";

export { SOURCE_BSC_MAINNET, SOURCE_BSC_TESTNET };

export type ContractsChainId = typeof SOURCE_BSC_MAINNET | typeof SOURCE_BSC_TESTNET;
export type ContractsChainIdProduction = typeof SOURCE_BSC_MAINNET;
export type SourceChainId = ContractsChainId;
export type AnyChainId = ContractsChainId;

export type ChainName = "BNB" | "BNB Testnet";

export const CONTRACTS_CHAIN_IDS: ContractsChainId[] = [SOURCE_BSC_MAINNET];
export const CONTRACTS_CHAIN_IDS_DEV: ContractsChainId[] = [...CONTRACTS_CHAIN_IDS, SOURCE_BSC_TESTNET];

export const CHAIN_NAMES_MAP: Record<AnyChainId, ChainName> = {
  [SOURCE_BSC_MAINNET]: "BNB",
  [SOURCE_BSC_TESTNET]: "BNB Testnet",
};

export const HIGH_EXECUTION_FEES_MAP: Record<ContractsChainId, number> = {
  [SOURCE_BSC_MAINNET]: 5,
  [SOURCE_BSC_TESTNET]: 5,
};

// Added to maxPriorityFeePerGas. Applied to EIP-1559 transactions only.
export const MAX_FEE_PER_GAS_MAP: Record<number, bigint> = {};

// Added to maxPriorityFeePerGas and execution fee calculation.
export const GAS_PRICE_PREMIUM_MAP: Partial<Record<ContractsChainId, bigint>> = {
  [SOURCE_BSC_TESTNET]: 1000000000n,
};

export const MAX_PRIORITY_FEE_PER_GAS_MAP: Record<ContractsChainId, bigint | undefined> = {
  [SOURCE_BSC_MAINNET]: 1500000000n,
  [SOURCE_BSC_TESTNET]: 1500000000n,
};

export const EXCESSIVE_EXECUTION_FEES_MAP: Partial<Record<ContractsChainId, number>> = {};

const MIN_EXECUTION_FEE_USD: Partial<Record<ContractsChainId, bigint | undefined>> = {};

export function getMinExecutionFeeUsd(chainId: ContractsChainId): bigint | undefined {
  return MIN_EXECUTION_FEE_USD[chainId];
}

export const GAS_PRICE_BUFFER_MAP: Partial<Record<ContractsChainId, bigint>> = {
  [SOURCE_BSC_MAINNET]: 2000n,
};

const VIEM_CHAIN_BY_CHAIN_ID: Record<ContractsChainId, Chain> = {
  [SOURCE_BSC_MAINNET]: bsc,
  [SOURCE_BSC_TESTNET]: bscTestnet,
};

export function getChainName(chainId: number): ChainName {
  return CHAIN_NAMES_MAP[chainId as ContractsChainId];
}

export const getViemChain = (chainId: number): Chain => {
  return VIEM_CHAIN_BY_CHAIN_ID[chainId as ContractsChainId] || bscTestnet;
};

export function getHighExecutionFee(chainId: number) {
  return HIGH_EXECUTION_FEES_MAP[chainId as ContractsChainId] ?? 5;
}

export function getExcessiveExecutionFee(chainId: number) {
  return EXCESSIVE_EXECUTION_FEES_MAP[chainId as ContractsChainId] ?? 10;
}

export const EXECUTION_FEE_CONFIG_V2: Record<
  ContractsChainId,
  {
    shouldUseMaxPriorityFeePerGas: boolean;
    defaultBufferBps?: number;
    gasPrice?: bigint;
  }
> = {
  [SOURCE_BSC_MAINNET]: {
    shouldUseMaxPriorityFeePerGas: false,
    defaultBufferBps: 3000,
  },
  [SOURCE_BSC_TESTNET]: {
    shouldUseMaxPriorityFeePerGas: false,
    defaultBufferBps: 1000,
  },
};

type StaticGasLimitsConfig = Pick<
  GasLimitsConfig,
  | "createOrderGasLimit"
  | "updateOrderGasLimit"
  | "cancelOrderGasLimit"
  | "tokenPermitGasLimit"
  | "hzAccountCollateralGasLimit"
>;

export const GAS_LIMITS_STATIC_CONFIG: Record<ContractsChainId, StaticGasLimitsConfig> = {
  [SOURCE_BSC_MAINNET]: {
    createOrderGasLimit: 1_000_000n,
    updateOrderGasLimit: 800_000n,
    cancelOrderGasLimit: 700_000n,
    tokenPermitGasLimit: 90_000n,
    hzAccountCollateralGasLimit: 0n,
  },
  [SOURCE_BSC_TESTNET]: {
    createOrderGasLimit: 1_000_000n,
    updateOrderGasLimit: 800_000n,
    cancelOrderGasLimit: 1_500_000n,
    tokenPermitGasLimit: 90_000n,
    hzAccountCollateralGasLimit: 400_000n,
  },
};

const CONTRACTS_CHAIN_CONFIGS = {
  [SOURCE_BSC_MAINNET]: {
    chainId: SOURCE_BSC_MAINNET,
    name: "BNB",
    slug: "bnb",
    explorerUrl: "https://bscscan.com/",
    nativeTokenSymbol: "BNB",
    wrappedTokenSymbol: "WBNB",
    highExecutionFee: 5,
    shouldUseMaxPriorityFeePerGas: false,
    defaultExecutionFeeBufferBps: 3000,
    maxFeePerGas: undefined,
    gasPricePremium: 0n,
    maxPriorityFeePerGas: 1500000000n,
    excessiveExecutionFee: 10,
    minExecutionFee: undefined,
    gasPriceBuffer: 2000n,
    isDisabled: false,
  },
  [SOURCE_BSC_TESTNET]: {
    chainId: SOURCE_BSC_TESTNET,
    name: "BNB Testnet",
    slug: "bnb-testnet",
    explorerUrl: "https://testnet.bscscan.com/",
    nativeTokenSymbol: "BNB",
    wrappedTokenSymbol: "WBNB",
    highExecutionFee: 5,
    shouldUseMaxPriorityFeePerGas: false,
    defaultExecutionFeeBufferBps: 1000,
    maxFeePerGas: undefined,
    gasPricePremium: undefined,
    maxPriorityFeePerGas: 1500000000n,
    excessiveExecutionFee: 10,
    minExecutionFee: undefined,
    gasPriceBuffer: undefined,
    isDisabled: false,
  },
} as const satisfies Record<ContractsChainId, ContractsChainConfig>;

export function getMaxPriorityFeePerGas(chainId: ContractsChainId) {
  return CONTRACTS_CHAIN_CONFIGS[chainId]?.maxPriorityFeePerGas;
}

export function getExecutionFeeConfig(
  chainId: ContractsChainId
): { shouldUseMaxPriorityFeePerGas: boolean; defaultBufferBps: number | undefined } | undefined {
  const config = CONTRACTS_CHAIN_CONFIGS[chainId];

  if (!config) {
    return undefined;
  }

  return {
    shouldUseMaxPriorityFeePerGas: config.shouldUseMaxPriorityFeePerGas,
    defaultBufferBps: config.defaultExecutionFeeBufferBps,
  };
}
