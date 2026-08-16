import cryptoJs from "crypto-js";
import { Abi, decodeErrorResult } from "viem";

import { abis } from "abis";

import { CustomErrorName, TxErrorType, extractDataFromError, getTransactionErrorDetails } from "./transactionsErrors";

export type OrderErrorContext =
  | "simulation"
  | "gasLimit"
  | "gasPrice"
  | "bestNonce"
  | "sending"
  | "pending"
  | "relayer"
  | "minting"
  | "execution"
  | "unknown";

export type ErrorLike = {
  message?: string;
  shortMessage?: string;
  details?: unknown;
  stack?: string;
  name?: string;
  code?: number | string;
  data?: any;
  error?: ErrorLike;
  cause?: unknown;
  errorSource?: string;
  errorContext?: OrderErrorContext;
  parentError?: ErrorLike;
  tags?: string;
  isAdditionalValidationPassed?: boolean;
  additionalValidationType?: string;
  info?: {
    error?: ErrorLike;
  };
};

export type ErrorData = {
  errorContext?: OrderErrorContext;
  errorMessage?: string;
  shortMessage?: string;
  rpcMessage?: string;
  errorGroup?: string;
  errorStack?: string;
  errorStackHash?: string;
  errorStackGroup?: string;
  errorName?: string;
  contractError?: string;
  contractErrorArgs?: any;
  isUserError?: boolean;
  isUserRejectedError?: boolean;
  reason?: string;
  data?: any;
  txErrorType?: TxErrorType;
  txErrorData?: unknown;
  errorSource?: string;
  isAdditionalValidationPassed?: boolean;
  additionalValidationType?: string;
  parentError?: ErrorData;
  errorDepth?: number;
};

const URL_REGEXP =
  /((?:http[s]?:\/\/.)?(?:www\.)?[-a-zA-Z0-9@%._\\+~#=]{2,256}\.[a-z]{2,6}\b(?::\d+)?)(?:[-a-zA-Z0-9@:%_\\+.~#?&\\/\\/=]*)/gi;

const MAX_ERRORS_DEPTH = 1;

export function extendError(
  error: ErrorLike,
  params: {
    errorContext?: OrderErrorContext;
    errorSource?: string;
    isAdditionalValidationPassed?: boolean;
    additionalValidationType?: string;
    data?: any;
  }
): ErrorLike {
  error.errorContext = params.errorContext;
  error.errorSource = params.errorSource;
  error.isAdditionalValidationPassed = params.isAdditionalValidationPassed;
  error.additionalValidationType = params.additionalValidationType;
  error.data = params.data;

  return error;
}

export function parseError(error: ErrorLike | string | undefined, errorDepth = 0): ErrorData | undefined {
  if (errorDepth > MAX_ERRORS_DEPTH) {
    return undefined;
  }

  // all human readable details are in info field
  const errorInfo = typeof error === "string" ? undefined : error?.info?.error;
  const errorSource = typeof error === "string" ? undefined : error?.errorSource;
  const errorContext: OrderErrorContext | undefined = typeof error === "string" ? undefined : error?.errorContext;
  const isAdditionalValidationPassed = typeof error === "string" ? undefined : error?.isAdditionalValidationPassed;
  const additionalValidationType = typeof error === "string" ? undefined : error?.additionalValidationType;
  const data = typeof error === "string" ? undefined : error?.data;
  const transactionError = getTransactionErrorDetails(error);
  const errorInfoDetails = getTransactionErrorDetails(errorInfo);

  let errorMessage = "Unknown error";
  let errorStack: string | undefined = undefined;
  let errorStackHash: string | undefined = undefined;
  let errorName: string | undefined = undefined;
  let contractError: string | undefined = undefined;
  let contractErrorArgs: any = undefined;
  let txErrorType: TxErrorType | undefined = undefined;
  let errorGroup: string | undefined = "Unknown group";
  let errorStackGroup = "Unknown stack group";
  let txErrorData: any = undefined;
  let isUserError: boolean | undefined = undefined;
  let isUserRejectedError: boolean | undefined = undefined;
  let parentError: ErrorData | undefined = undefined;

  try {
    errorMessage =
      errorInfoDetails.message ??
      transactionError.message ??
      (hasMessage(errorInfo)
        ? (errorInfo.message ?? (hasMessage(error) ? error.message : String(error)))
        : String(error));

    errorStack = hasStack(error) ? error.stack : undefined;

    if (hasName(errorInfo)) {
      errorName = errorInfo.name;
    } else if (hasName(error)) {
      errorName = error.name;
    }

    txErrorType = transactionError.type;
    txErrorData = transactionError.data;
    isUserError = transactionError.isUserError;
    isUserRejectedError = transactionError.isUserRejectedError;

    if (errorMessage) {
      const errorData = extractDataFromError(errorMessage) ?? extractDataFromError((error as any)?.message);
      if (errorData) {
        const parsedError = decodeErrorResult({
          abi: abis.CustomErrors as Abi,
          data: errorData as `0x${string}`,
        });

        if (parsedError) {
          contractError = parsedError.errorName;
          contractErrorArgs = parsedError.args;
        }
      }
    }

    if (typeof error !== "string" && error?.parentError) {
      parentError = parseError(error.parentError, errorDepth + 1);
    }
  } catch (e) {
    //
  }

  if (errorStack) {
    errorStackHash = cryptoJs.SHA256(errorStack).toString(cryptoJs.enc.Hex);
    errorStackGroup = errorStack.slice(0, 300);
    errorStackGroup = errorStackGroup.replace(URL_REGEXP, "$1");
    errorStackGroup = errorStackGroup.replace(/\d+/g, "XXX");
  }

  if (txErrorType) {
    errorGroup = `Txn Error: ${txErrorType}`;
  } else if (errorMessage) {
    errorGroup = errorMessage.slice(0, 300);
    errorGroup = errorGroup.replace(URL_REGEXP, "$1");
    errorGroup = errorGroup.replace(/\d+/g, "XXX");
    errorGroup = errorGroup.slice(0, 50);
  } else if (errorName) {
    errorGroup = errorName;
  }

  return {
    errorMessage,
    shortMessage: transactionError.shortMessage,
    rpcMessage: transactionError.rpcMessage,
    reason: transactionError.revertReason,
    errorGroup,
    errorStackGroup,
    errorStack,
    errorStackHash,
    errorName,
    contractError,
    contractErrorArgs,
    errorContext,
    isUserError,
    data,
    isUserRejectedError,
    txErrorType,
    txErrorData,
    errorSource,
    parentError,
    isAdditionalValidationPassed,
    additionalValidationType,
    errorDepth,
  };
}

export function isContractError(error: ErrorData, errorType: CustomErrorName) {
  return error.contractError === errorType;
}

function hasMessage(error: unknown): error is { message: string } {
  return !!error && typeof error === "object" && typeof (error as { message: string }).message === "string";
}

function hasStack(error: unknown): error is { stack: string } {
  return !!error && typeof error === "object" && typeof (error as { stack: string }).stack === "string";
}

function hasName(error: unknown): error is { name: string } {
  return !!error && typeof error === "object" && typeof (error as { name: string }).name === "string";
}

export class CustomError extends Error {
  isHfCustomError = true;
  args: any;

  constructor({ name, message, args }: { name: string; message: string; args: any }) {
    super(message);
    this.name = name;
    this.args = args;
  }
}

export function isCustomError(error: Error | undefined): error is CustomError {
  return (error as CustomError)?.isHfCustomError === true;
}

export function getCustomError(error: Error): CustomError | Error {
  const data = (error as any)?.info?.error?.data ?? (error as any)?.data;

  let prettyErrorName = error.name;
  let prettyErrorMessage = error.message;
  let prettyErrorArgs: any = undefined;

  try {
    const parsedError = decodeErrorResult({
      abi: abis.CustomErrors,
      data: data,
    });

    prettyErrorArgs = parsedError.args;

    prettyErrorName = parsedError.errorName;
    prettyErrorMessage = JSON.stringify(parsedError, null, 2);
  } catch (decodeError) {
    return error;
  }

  const prettyError = new CustomError({ name: prettyErrorName, message: prettyErrorMessage, args: prettyErrorArgs });

  return prettyError;
}
