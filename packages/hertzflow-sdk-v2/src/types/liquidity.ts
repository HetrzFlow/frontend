import type { Address } from "viem";

export type HlvDepositAllocation = {
  marketAddress: Address;
  longTokenAmount: bigint;
  shortTokenAmount: bigint;
  minHlvTokens: bigint;
};

export type HlvWithdrawalAllocation = {
  marketAddress: Address;
  hlvTokenAmount: bigint;
  minLongTokenAmount: bigint;
  minShortTokenAmount: bigint;
};
