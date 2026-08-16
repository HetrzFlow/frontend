import { decodeAbiParameters } from "viem";

export enum TxErrorType {
  NotEnoughFunds = "NOT_ENOUGH_FUNDS",
  UserDenied = "USER_DENIED",
  Slippage = "SLIPPAGE",
  RpcError = "RPC_ERROR",
  NetworkChanged = "NETWORK_CHANGED",
  Expired = "EXPIRED",
}

export type ErrorPattern = { msg?: string; code?: number | string };

const TX_ERROR_PATTERNS: { [key in TxErrorType]: ErrorPattern[] } = {
  [TxErrorType.NotEnoughFunds]: [
    { msg: "insufficient funds for gas" },
    { msg: "not enough funds for gas" },
    { msg: "failed to execute call with revert code InsufficientGasFunds" },
    { msg: "EVM error: OutOfFunds" },
    { msg: "exceeds the balance of the account" },
  ],
  [TxErrorType.UserDenied]: [
    { code: 4001 },
    { code: "ACTION_REJECTED" },
    { msg: "User denied transaction signature" },
    { msg: "User rejected" },
    { msg: "User cancelled" },
    { msg: "Cancelled" },
    { msg: "Cancelled by user" },
    { msg: "user rejected action" },
    { msg: "ethers-user-denied" },
    { msg: "Action cancelled by user" },
    { msg: "Signing aborted by user" },
  ],
  [TxErrorType.Slippage]: [
    { msg: "Router: mark price lower than limit" },
    { msg: "Router: mark price higher than limit" },
  ],
  [TxErrorType.NetworkChanged]: [
    { msg: "network changed" },
    { msg: "Invalid network" },
    { msg: "chainId should be same" },
  ],
  [TxErrorType.Expired]: [{ msg: "Request expired" }],
  [TxErrorType.RpcError]: [
    // @see https://eips.ethereum.org/EIPS/eip-1474#error-codes
    { code: -32700 }, // Parse error: Invalid JSON
    { code: -32600 }, // Invalid request: JSON is not a valid request object
    { code: -32601 }, // Method not found: Method does not exist
    { code: -32602 }, // Invalid params: Invalid method parameters
    { code: -32603 }, // Internal error: Internal JSON-RPC error
    { code: -32000 }, // Invalid input: Missing or invalid parameters	non-standard
    { code: -32001 }, // Resource not found: Requested resource not found
    { code: -32002 }, // Resource unavailable: Requested resource not available
    { code: -32003 }, // Transaction rejected: Transaction creation failed
    { code: -32004 }, // Method not supported: Method is not implemented
    { code: -32005 }, // Limit exceeded: Request exceeds defined limit
    { code: -32006 }, // JSON-RPC version not supported: Version of JSON-RPC protocol is not supported
    { msg: "Non-200 status code" },
    { msg: "Request limit exceeded" },
    { msg: "Internal JSON-RPC error" },
    { msg: "Response has no error or result" },
    { msg: "we can't execute this request" },
    { msg: "couldn't connect to the network" },
  ],
};

export enum CustomErrorName {
  EndOfOracleSimulation = "EndOfOracleSimulation",
  InsufficientExecutionFee = "InsufficientExecutionFee",
  OrderNotFulfillableAtAcceptablePrice = "OrderNotFulfillableAtAcceptablePrice",
  InsufficientSwapOutputAmount = "InsufficientSwapOutputAmount",
}

export function getIsUserRejectedError(errorType: TxErrorType) {
  return errorType === TxErrorType.UserDenied;
}

export function getIsUserError(errorType: TxErrorType) {
  return [TxErrorType.UserDenied, TxErrorType.NetworkChanged, TxErrorType.Expired, TxErrorType.NotEnoughFunds].includes(
    errorType
  );
}

export type TxError = {
  message?: string;
  shortMessage?: string;
  details?: unknown;
  name?: string;
  code?: number | string;
  body?: string;
  data?: any;
  error?: TxError;
  cause?: unknown;
  info?: {
    error?: TxError;
  };
};

export type TransactionErrorDetails = {
  message?: string;
  shortMessage?: string;
  rpcMessage?: string;
  revertReason?: string;
  code?: number | string;
  data?: unknown;
  type?: TxErrorType;
  isUserError: boolean;
  isUserRejectedError: boolean;
};

const MAX_ERROR_CHAIN_DEPTH = 10;
const VERBOSE_MESSAGE_PATTERN = /(?:^|\n)(?:URL|Request body|Details|Version):/;
const SOLIDITY_ERROR_STRING_PATTERN = /0x08c379a0[0-9a-fA-F]+/;

function isErrorRecord(error: unknown): error is TxError {
  return !!error && typeof error === "object";
}

function getErrorChain(error: unknown) {
  const chain: TxError[] = [];
  const queue = isErrorRecord(error) ? [error] : [];
  const visited = new Set<unknown>();

  while (queue.length && chain.length < MAX_ERROR_CHAIN_DEPTH) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;

    visited.add(current);
    chain.push(current);

    let bodyError: unknown;
    if (current.body) {
      try {
        bodyError = JSON.parse(current.body)?.error;
      } catch {
        // Ignore malformed legacy RPC response bodies.
      }
    }

    const nestedErrors = [current.info?.error, current.error, current.cause, bodyError];
    for (const nestedError of nestedErrors) {
      if (isErrorRecord(nestedError)) queue.push(nestedError);
    }
  }

  return chain;
}

function getMessages(error: TxError) {
  return [error.details, error.error?.message, error.data?.message, error.message, error.shortMessage].filter(
    (message): message is string => typeof message === "string" && !!message
  );
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function decodeSolidityErrorString(value: unknown) {
  if (typeof value !== "string") return undefined;

  const revertData = value.match(SOLIDITY_ERROR_STRING_PATTERN)?.[0];
  if (!revertData) return undefined;

  try {
    const [reason] = decodeAbiParameters([{ type: "string" }], `0x${revertData.slice(10)}`);
    return reason;
  } catch {
    return undefined;
  }
}

function findErrorTypeByMessage(chain: TxError[]) {
  for (const error of [...chain].reverse()) {
    for (const message of getMessages(error)) {
      const normalizedMessage = message.toLowerCase();

      for (const [type, patterns] of Object.entries(TX_ERROR_PATTERNS)) {
        if (patterns.some((pattern) => pattern.msg && normalizedMessage.includes(pattern.msg.toLowerCase()))) {
          return type as TxErrorType;
        }
      }
    }
  }
}

function findErrorTypeByCode(chain: TxError[]) {
  for (const error of [...chain].reverse()) {
    const code = error.error?.code ?? error.code;

    for (const [type, patterns] of Object.entries(TX_ERROR_PATTERNS)) {
      if (patterns.some((pattern) => pattern.code !== undefined && code === pattern.code)) {
        return type as TxErrorType;
      }
    }
  }
}

export function getTransactionErrorDetails(error: unknown): TransactionErrorDetails {
  const chain = getErrorChain(error);
  const prioritizedChain = [...chain].reverse();
  const type = findErrorTypeByMessage(chain) ?? findErrorTypeByCode(chain);
  const fallbackMessage = chain.flatMap(getMessages).find(Boolean);
  const revertReason = prioritizedChain
    .flatMap((item) => [item.data, ...getMessages(item)])
    .map(decodeSolidityErrorString)
    .find(Boolean);
  const shortMessage =
    revertReason ??
    chain
      .map((item) => getTrimmedString(item.shortMessage))
      .find(
        (message) => message && !VERBOSE_MESSAGE_PATTERN.test(message) && !SOLIDITY_ERROR_STRING_PATTERN.test(message)
      ) ??
    getTrimmedString(chain[0]?.message)?.split("\n")[0]?.trim() ??
    getTrimmedString(fallbackMessage)?.split("\n")[0]?.trim();
  const infoError = chain.map((item) => item.info?.error).find(isErrorRecord);
  const rpcError =
    chain.find((item) => item.name === "RpcRequestError") ??
    infoError ??
    prioritizedChain.find(
      (item) => item.code !== undefined && (getTrimmedString(item.details) || getTrimmedString(item.message))
    );
  const rpcMessage = getTrimmedString(rpcError?.details) ?? getTrimmedString(rpcError?.message);
  const message = rpcMessage ?? fallbackMessage;
  const errorWithData = prioritizedChain.find((item) => item.data !== undefined);
  const errorWithCode = prioritizedChain.find((item) => item.code !== undefined || item.error?.code !== undefined);

  return {
    message,
    shortMessage,
    revertReason,
    rpcMessage:
      rpcMessage &&
      rpcMessage !== shortMessage &&
      !shortMessage?.includes(rpcMessage) &&
      (!shortMessage || !rpcMessage.includes(shortMessage))
        ? rpcMessage
        : undefined,
    code: errorWithCode?.error?.code ?? errorWithCode?.code,
    data: errorWithData?.data,
    type,
    isUserError: type ? getIsUserError(type) : false,
    isUserRejectedError: type ? getIsUserRejectedError(type) : false,
  };
}

/**
 * @deprecated Use `parseError` instead.
 */
export function extractTxnError(ex: TxError): [string, TxErrorType | null, any] | [] {
  if (!ex) {
    return [];
  }

  const details = getTransactionErrorDetails(ex);
  if (!details.message && details.code === undefined) {
    return [];
  }

  return [details.message ?? String(details.code), details.type ?? null, details.data];
}

/**
 * @deprecated Use `parseError` instead.
 */
export function extractDataFromError(errorMessage: unknown) {
  if (typeof errorMessage !== "string") return null;

  const pattern = /data="([^"]+)"/;
  const match = errorMessage.match(pattern);

  if (match && match[1]) {
    return match[1];
  }
  return null;
}
