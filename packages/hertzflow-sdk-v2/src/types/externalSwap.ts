import type { Address, Hex } from "viem";

export type ExternalSwapErrorCode =
  | "UNSUPPORTED_CHAIN"
  | "INVALID_REQUEST"
  | "NO_ROUTE"
  | "UNTRUSTED_ROUTER"
  | "QUOTE_EXPIRED"
  | "API_ERROR"
  | "SIMULATION_FAILED";

export class ExternalSwapError extends Error {
  constructor(
    public readonly code: ExternalSwapErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ExternalSwapError";
  }
}

export type ExternalSwapStatus = {
  providers: string[];
  chainflows: Array<{
    provider: string;
    latestBlockNumber: number;
    updatedAt: number;
  }>;
  routerAddress: Address;
  routerTrusted: boolean;
};

export type ExternalSwapQuoteRequest = {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  slippageBps: number;
  dexProviders?: string[];
};

export type ExternalSwapTransaction = {
  to: Address;
  data: Hex;
  value: bigint;
};

export type ExternalSwapRouteHop = {
  dex: string;
  pool: Hex;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  feeRate?: number;
};

export type ExternalSwapRoute = {
  percentageBps: number;
  amountIn: bigint;
  amountOut: bigint;
  gasEstimate: bigint;
  hops: ExternalSwapRouteHop[];
};

export type ExternalSwapRouteStreamHop = {
  providerCode: string;
  pool: Hex;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  feeRate: string;
};

export type ExternalSwapRouteStream = {
  percentageBps: number;
  hops: ExternalSwapRouteStreamHop[];
};

export type ExternalSwapQuote = {
  source: "peach";
  quoteId: Hex;
  receivedAt: number;
  deadline: bigint;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  minAmountOut: bigint;
  priceImpact: number;
  routes: ExternalSwapRoute[];
  routeStreams: ExternalSwapRouteStream[];
  gasEstimate: bigint;
  routerAddress: Address;
  isNativeIn: boolean;
  isNativeOut: boolean;
  transaction: ExternalSwapTransaction;
};

export type ExternalSwapTransactionPlan = {
  approval?: ExternalSwapTransaction;
  swap: ExternalSwapTransaction;
  currentAllowance?: bigint;
};
