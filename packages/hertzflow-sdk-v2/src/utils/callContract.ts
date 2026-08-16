import { Abi, Address, encodeFunctionData, Hash, Hex, PublicClient, TransactionReceipt, withRetry } from "viem";

import {
  GAS_PRICE_BUFFER_MAP,
  GAS_PRICE_PREMIUM_MAP,
  getViemChain,
  MAX_FEE_PER_GAS_MAP,
  MAX_PRIORITY_FEE_PER_GAS_MAP,
} from "configs/chains";
import { BASIS_POINTS_DIVISOR_BIGINT } from "configs/factors";

import type { HertzFlowSDK } from "../index";
import { bigMath } from "./bigmath";
import { type ErrorLike, parseError } from "./errors";

function humanizeReason(reason: string) {
  const normalized = reason
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return normalized;
  }

  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

export function getReadableErrorMessage(error: unknown) {
  const parsedError = parseError(error as ErrorLike | string | undefined);

  if (!parsedError) {
    return { parsedError, readableMessage: undefined };
  }

  if (parsedError.contractError) {
    return {
      parsedError,
      readableMessage: humanizeReason(parsedError.contractError),
    };
  }

  switch (parsedError.txErrorType) {
    case "USER_DENIED":
      return { parsedError, readableMessage: "User rejected the request." };
    case "NOT_ENOUGH_FUNDS":
      return { parsedError, readableMessage: "Insufficient funds for gas." };
    case "NETWORK_CHANGED":
      return { parsedError, readableMessage: "Wallet network changed." };
    case "RPC_ERROR":
      return { parsedError, readableMessage: "Network request failed." };
    case "EXPIRED":
      return { parsedError, readableMessage: "Request expired." };
    default:
      return {
        parsedError,
        readableMessage: parsedError.errorMessage,
      };
  }
}

const DEFAULT_REVERTED_MESSAGE = "Execution reverted";

type RevertedTransactionError = {
  errorType: "reverted";
  message: string;
  txHash: string;
};

export async function getRevertedTransactionMessage({
  sdk,
  receipt,
  txHash,
}: {
  sdk?: HertzFlowSDK | null;
  receipt?: TransactionReceipt;
  txHash: string;
}) {
  if (!sdk?.publicClient) {
    return DEFAULT_REVERTED_MESSAGE;
  }

  try {
    const transaction = await sdk.publicClient.getTransaction({
      hash: txHash as Hash,
    });

    if (!transaction.to || !transaction.input) {
      return DEFAULT_REVERTED_MESSAGE;
    }

    await sdk.publicClient.call({
      account: transaction.from,
      blockNumber: receipt?.blockNumber ?? transaction.blockNumber ?? undefined,
      data: transaction.input,
      gas: transaction.gas,
      to: transaction.to,
      value: transaction.value,
    });

    return DEFAULT_REVERTED_MESSAGE;
  } catch (error) {
    return getReadableErrorMessage(error).readableMessage || DEFAULT_REVERTED_MESSAGE;
  }
}

export async function createRevertedTransactionError({
  sdk,
  receipt,
  txHash,
}: {
  sdk?: HertzFlowSDK | null;
  receipt?: TransactionReceipt;
  txHash: string;
}): Promise<RevertedTransactionError> {
  return {
    errorType: "reverted",
    message: await getRevertedTransactionMessage({ sdk, receipt, txHash }),
    txHash,
  };
}

function enhanceContractError<T>(error: T): T {
  if (!error || (typeof error !== "object" && typeof error !== "function")) {
    return error;
  }

  const { parsedError, readableMessage } = getReadableErrorMessage(error);
  const enrichedError = error as T & {
    parsedError?: ReturnType<typeof parseError>;
    readableMessage?: string;
    rpcMessage?: string;
    contractError?: string;
    contractErrorArgs?: any;
    txErrorType?: string;
  };

  if (parsedError) {
    enrichedError.parsedError = parsedError;
    enrichedError.contractError = parsedError.contractError;
    enrichedError.contractErrorArgs = parsedError.contractErrorArgs;
    enrichedError.txErrorType = parsedError.txErrorType;
    enrichedError.rpcMessage = parsedError.rpcMessage;
  }

  if (readableMessage) {
    enrichedError.readableMessage = readableMessage;
  }

  return enrichedError;
}

export async function getGasPrice(client: PublicClient, chainId: number) {
  let maxFeePerGas = MAX_FEE_PER_GAS_MAP[chainId];
  const premium: bigint = GAS_PRICE_PREMIUM_MAP[chainId] || 0n;

  const feeData = await withRetry(
    () =>
      client.estimateFeesPerGas({
        type: "legacy",
        chain: getViemChain(chainId),
      }),
    {
      delay: 200,
      retryCount: 2,
      shouldRetry: ({ error }) => {
        const isInvalidBlockError = error?.message?.includes("invalid value for value.hash");

        return isInvalidBlockError;
      },
    }
  );

  const gasPrice = feeData.gasPrice;

  if (maxFeePerGas) {
    if (gasPrice !== undefined && gasPrice !== null) {
      maxFeePerGas = bigMath.max(gasPrice, maxFeePerGas);
    }

    // Fetch the latest block to get baseFeePerGas for EIP-1559 fee data
    const block = await client.getBlock({ blockTag: "pending" });
    if (block.baseFeePerGas !== undefined && block.baseFeePerGas !== null) {
      const baseFeePerGas = block.baseFeePerGas;

      const maxPriorityFeePerGas = bigMath.max(MAX_PRIORITY_FEE_PER_GAS_MAP[chainId] ?? 0n, premium);

      // Calculate maxFeePerGas
      const calculatedMaxFeePerGas = baseFeePerGas + maxPriorityFeePerGas + premium;

      return {
        maxFeePerGas: bigMath.max(maxFeePerGas, calculatedMaxFeePerGas),
        maxPriorityFeePerGas: maxPriorityFeePerGas + premium,
      };
    }
  }

  if (gasPrice === null || gasPrice === undefined) {
    throw new Error("Can't fetch gas price");
  }

  const bufferBps: bigint = GAS_PRICE_BUFFER_MAP[chainId] || 0n;
  const buffer = bigMath.mulDiv(gasPrice, bufferBps, BASIS_POINTS_DIVISOR_BIGINT);

  return {
    gasPrice: gasPrice + buffer + premium,
  };
}

export async function getGasLimit(
  client: PublicClient,
  account: Address,
  contractAddress: Address,
  abi: Abi,
  method: string,
  params: any[] = [],
  value?: bigint | number,
  gasPrice?: bigint | number
) {
  const data = encodeFunctionData({
    abi,
    functionName: method,
    args: params,
  });

  return getTransactionGasLimit(client, account, contractAddress, data, value, gasPrice);
}

async function getTransactionGasLimit(
  client: PublicClient,
  account: Address,
  to: Address,
  data: Hex,
  value: bigint | number = 0n,
  gasPrice?: bigint | number
) {
  let gasLimit = 0n;

  try {
    const estimateGasParams = {
      to,
      data,
      value: BigInt(value),
      account,
      ...(gasPrice !== undefined ? { gasPrice: BigInt(gasPrice) } : {}),
    };
    gasLimit = await client.estimateGas(estimateGasParams);
  } catch (error) {
    // This call should throw another error instead of the `error`
    const callParams: any = {
      to,
      data,
      value: BigInt(value),
      account,
      ...(gasPrice !== undefined ? { gasPrice: BigInt(gasPrice) } : {}),
    };

    await client.call(callParams);

    // If not, we throw the original estimateGas error
    throw error;
  }

  if (gasLimit < 22000n) {
    gasLimit = 22000n;
  }

  // Add a 10% buffer to the gas limit
  return (gasLimit * 11n) / 10n;
}

export interface CallContractOpts {
  value?: bigint | number;
  gasLimit?: bigint | number;
  /** Reuse a gas price that was already used to calculate the execution fee. */
  gasPrice?: bigint | number;
}

export type SendTransactionOpts = Pick<CallContractOpts, "gasLimit" | "gasPrice">;

export async function sendTransaction(
  sdk: HertzFlowSDK,
  transaction: { to: Address; data: Hex; value?: bigint },
  opts: SendTransactionOpts = {}
) {
  if (!sdk.account) {
    throw new Error("Account is not defined");
  }

  const txnOpts: Record<string, bigint> = {};
  if (transaction.value !== undefined) {
    txnOpts.value = transaction.value;
  }
  if (opts.gasPrice !== undefined) {
    txnOpts.gasPrice = BigInt(opts.gasPrice);
  }

  const gasLimitPromise = (
    opts.gasLimit !== undefined
      ? Promise.resolve(BigInt(opts.gasLimit))
      : getTransactionGasLimit(
          sdk.publicClient,
          sdk.account,
          transaction.to,
          transaction.data,
          transaction.value,
          opts.gasPrice
        )
  ).then((gasLimit) => {
    txnOpts.gas = gasLimit;
  });

  const gasPricePromise =
    opts.gasPrice !== undefined
      ? Promise.resolve()
      : getGasPrice(sdk.publicClient, sdk.chainId).then((gasPriceData) => {
          if (gasPriceData.gasPrice !== undefined) {
            txnOpts.gasPrice = gasPriceData.gasPrice;
          } else {
            txnOpts.maxFeePerGas = gasPriceData.maxFeePerGas;
            txnOpts.maxPriorityFeePerGas = gasPriceData.maxPriorityFeePerGas;
          }
        });

  try {
    await Promise.all([gasLimitPromise, gasPricePromise]);
    return await sdk.walletClient.sendTransaction({
      account: sdk.account,
      chain: getViemChain(sdk.chainId),
      to: transaction.to,
      data: transaction.data,
      ...txnOpts,
    });
  } catch (error) {
    throw enhanceContractError(error);
  }
}

export async function callContract(
  sdk: HertzFlowSDK,
  contractAddress: Address,
  abi: Abi,
  method: string,
  params: any[],
  opts: CallContractOpts = {}
) {
  const data = encodeFunctionData({
    abi,
    functionName: method,
    args: params,
  });
  return sendTransaction(
    sdk,
    {
      to: contractAddress,
      data,
      ...(opts.value !== undefined ? { value: BigInt(opts.value) } : {}),
    },
    opts
  );
}
