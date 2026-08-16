import { Abi, Address, erc20Abi, maxUint256 } from "viem";

import { getContract } from "configs/contracts";
import { NATIVE_TOKEN_ADDRESS } from "configs/tokens";

import type { HertzFlowSDK } from "../index";

export type ApprovalStatus = {
  token: Address;
  owner: Address;
  spender: Address;
  allowance: bigint;
  isApproved: boolean;
};


export type HlvDepositApprovalResult = {
  tokenApprovals: ApprovalStatus[];
  allApproved: boolean;
};

/**
 * Check ERC20 token allowance for a spender
 */
export async function checkTokenAllowance(
  sdk: HertzFlowSDK,
  tokenAddress: Address,
  spenderAddress: Address,
  requiredAmount: bigint,
  account?: Address
): Promise<ApprovalStatus> {
  const userAccount = account ?? sdk.config.account;

  if (!userAccount) {
    throw new Error("Account is not defined");
  }

  // Native token doesn't need approval
  if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
    return {
      token: tokenAddress,
      owner: userAccount,
      spender: spenderAddress,
      allowance: maxUint256,
      isApproved: true,
    };
  }

  const allowance = await sdk.publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [userAccount, spenderAddress],
  });

  return {
    token: tokenAddress,
    owner: userAccount,
    spender: spenderAddress,
    allowance: allowance as bigint,
    isApproved: (allowance as bigint) >= requiredAmount,
  };
}

/**
 * Approve ERC20 token for a spender
 * Returns transaction hash
 */
export async function approveToken(
  sdk: HertzFlowSDK,
  tokenAddress: Address,
  spenderAddress: Address,
  amount: bigint = maxUint256
): Promise<Address> {
  if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
    throw new Error("Native token does not require approval");
  }

  return sdk.callContract(tokenAddress, erc20Abi as unknown as Abi, "approve", [spenderAddress, amount]);
}

export type HlvDepositApprovalParams = {
  initialLongTokenAddress?: Address;
  initialShortTokenAddress?: Address;
  marketTokenAddress?: Address;
  longTokenAmount?: bigint;
  shortTokenAmount?: bigint;
  marketTokenAmount?: bigint;
  isMarketTokenDeposit?: boolean;
};


export async function checkHlvDepositApprovals(
  sdk: HertzFlowSDK,
  params: HlvDepositApprovalParams
): Promise<HlvDepositApprovalResult> {
  const chainId = sdk.chainId;
  const syntheticsRouterAddress = getContract(chainId, "SyntheticsRouter");

  const tokenApprovals: ApprovalStatus[] = [];

  if (params.isMarketTokenDeposit && params.marketTokenAddress && params.marketTokenAmount) {
    const approval = await checkTokenAllowance(
      sdk,
      params.marketTokenAddress,
      syntheticsRouterAddress,
      params.marketTokenAmount
    );
    tokenApprovals.push(approval);
  } else {
    if (
      params.initialLongTokenAddress &&
      params.initialLongTokenAddress !== NATIVE_TOKEN_ADDRESS &&
      params.longTokenAmount &&
      params.longTokenAmount > 0n
    ) {
      const approval = await checkTokenAllowance(
        sdk,
        params.initialLongTokenAddress,
        syntheticsRouterAddress,
        params.longTokenAmount
      );
      tokenApprovals.push(approval);
    }

    if (
      params.initialShortTokenAddress &&
      params.initialShortTokenAddress !== NATIVE_TOKEN_ADDRESS &&
      params.shortTokenAmount &&
      params.shortTokenAmount > 0n
    ) {
      const approval = await checkTokenAllowance(
        sdk,
        params.initialShortTokenAddress,
        syntheticsRouterAddress,
        params.shortTokenAmount
      );
      tokenApprovals.push(approval);
    }
  }

  const allApproved = tokenApprovals.every((a) => a.isApproved);

  return {
    tokenApprovals,
    allApproved,
  };
}


export async function ensureHlvDepositApprovals(
  sdk: HertzFlowSDK,
  params: HlvDepositApprovalParams
): Promise<{ txHashes: Address[]; approvalResult: HlvDepositApprovalResult }> {
  const chainId = sdk.chainId;
  const syntheticsRouterAddress = getContract(chainId, "SyntheticsRouter");

  const txHashes: Address[] = [];

  let approvalResult = await checkHlvDepositApprovals(sdk, params);

  for (const tokenApproval of approvalResult.tokenApprovals) {
    if (!tokenApproval.isApproved) {
      const txHash = await approveToken(sdk, tokenApproval.token, syntheticsRouterAddress);
      txHashes.push(txHash);
    }
  }

  if (txHashes.length > 0) {
    approvalResult = await checkHlvDepositApprovals(sdk, params);
  }

  return { txHashes, approvalResult };
}
