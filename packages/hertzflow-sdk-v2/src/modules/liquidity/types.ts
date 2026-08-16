import type { Address } from "viem";

export type CreateDepositParamsAddresses = {
  receiver: Address;
  callbackContract: Address;
  uiFeeReceiver: Address;
  market: Address;
  initialLongToken: Address;
  initialShortToken: Address;
  longTokenSwapPath: Address[];
  shortTokenSwapPath: Address[];
};

export type CreateDepositParams = {
  addresses: CreateDepositParamsAddresses;
  minMarketTokens: bigint;
  shouldUnwrapNativeToken: boolean;
  executionFee: bigint;
  callbackGasLimit: bigint;
  dataList: `0x${string}`[];
};

export type CreateWithdrawalAddresses = {
  receiver: Address;
  callbackContract: Address;
  uiFeeReceiver: Address;
  market: Address;
  longTokenSwapPath: Address[];
  shortTokenSwapPath: Address[];
};

export type CreateWithdrawalParams = {
  addresses: CreateWithdrawalAddresses;
  minLongTokenAmount: bigint;
  minShortTokenAmount: bigint;
  shouldUnwrapNativeToken: boolean;
  executionFee: bigint;
  callbackGasLimit: bigint;
  dataList: `0x${string}`[];
};
