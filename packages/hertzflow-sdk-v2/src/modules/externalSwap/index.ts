import {
  ApiClient,
  ApiError,
  BSC_MAINNET_CONFIG,
  NATIVE_TOKEN_ADDRESS as AGGREGATOR_NATIVE_TOKEN_ADDRESS,
  PeachClient,
  type Provider,
} from "@masterpeach/aggregator-sdk";
import {
  encodeFunctionData,
  erc20Abi,
  getAddress,
  isAddress,
  isHex,
  zeroAddress,
  type Abi,
  type Address,
  type Hex,
} from "viem";

import { SOURCE_BSC_MAINNET } from "configs/chains";
import { HERTZFLOW_CUSTOM_FEE_RECEIVER } from "configs/externalSwap";
import type {
  ExternalSwapQuote,
  ExternalSwapQuoteRequest,
  ExternalSwapStatus,
  ExternalSwapTransactionPlan,
} from "types/externalSwap";
import { ExternalSwapError } from "types/externalSwap";

import { Module } from "../base";
import { buildRouteStreams } from "./routeStreams";

export const PEACH_BSC_ROUTER = "0xF2B877A2F415efB0Ad5f15d82652564528C1fd2a" as Address;
export const PEACH_NATIVE_TOKEN_ADDRESS = AGGREGATOR_NATIVE_TOKEN_ADDRESS as Address;
const PEACH_CUSTOM_FEE_BPS = 1;

const isNativeToken = (token: Address) =>
  token.toLowerCase() === zeroAddress || token.toLowerCase() === PEACH_NATIVE_TOKEN_ADDRESS.toLowerCase();

const normalizeTokenForPeachApi = (token: Address) =>
  isNativeToken(token) ? getAddress(BSC_MAINNET_CONFIG.weth) : getAddress(token);

const getPoolId = (pool: string): Hex => {
  if (!isHex(pool)) throw new Error(`Invalid Peach pool id: ${pool}`);
  return pool;
};

export class ExternalSwap extends Module {
  private readonly apiClient = new ApiClient({
    baseUrl: this.sdk.config.externalSwap?.apiBaseUrl,
    timeout: this.sdk.config.externalSwap?.requestTimeoutMs,
  });

  private readonly peachClient = new PeachClient(BSC_MAINNET_CONFIG, undefined, {
    api: {
      baseUrl: this.sdk.config.externalSwap?.apiBaseUrl,
      timeout: this.sdk.config.externalSwap?.requestTimeoutMs,
    },
  });

  private get trustedRouters() {
    return (this.sdk.config.externalSwap?.trustedRouterAddresses ?? [PEACH_BSC_ROUTER]).map((address) =>
      address.toLowerCase()
    );
  }

  private assertSupportedChain() {
    if (this.chainId !== SOURCE_BSC_MAINNET) {
      throw new ExternalSwapError("UNSUPPORTED_CHAIN", "Peach Swap is only supported on BSC Mainnet");
    }
  }

  private isTrustedRouter(router: string) {
    return isAddress(router) && this.trustedRouters.includes(router.toLowerCase());
  }

  private getTrustedRouter(router: string) {
    if (!this.isTrustedRouter(router)) {
      throw new ExternalSwapError("UNTRUSTED_ROUTER", `Peach returned an untrusted router: ${router}`);
    }
    return getAddress(router);
  }

  private assertQuoteUsable(quote: ExternalSwapQuote) {
    const routerAddress = this.getTrustedRouter(quote.routerAddress);
    if (quote.transaction.to.toLowerCase() !== routerAddress.toLowerCase()) {
      throw new ExternalSwapError("UNTRUSTED_ROUTER", "Peach transaction target does not match the trusted router");
    }
    if (quote.deadline <= BigInt(Math.floor(Date.now() / 1000))) {
      throw new ExternalSwapError("QUOTE_EXPIRED", "Peach quote has expired");
    }
  }

  async getStatus(): Promise<ExternalSwapStatus> {
    try {
      const status = await this.apiClient.getStatus();
      const routerAddress = isAddress(status.peach_router.router_address)
        ? getAddress(status.peach_router.router_address)
        : zeroAddress;

      return {
        providers: status.providers,
        chainflows: status.chainflows.map((chainflow) => ({
          provider: chainflow.provider,
          latestBlockNumber: chainflow.version.latest_block_number,
          updatedAt: chainflow.update_at,
        })),
        routerAddress,
        routerTrusted: this.isTrustedRouter(routerAddress),
      };
    } catch (error) {
      if (error instanceof ExternalSwapError) throw error;
      throw new ExternalSwapError("API_ERROR", error instanceof Error ? error.message : "Failed to load Peach status", {
        cause: error,
      });
    }
  }

  async getQuote(request: ExternalSwapQuoteRequest): Promise<ExternalSwapQuote> {
    this.assertSupportedChain();
    if (
      !isAddress(request.tokenIn) ||
      !isAddress(request.tokenOut) ||
      request.amountIn <= 0n ||
      request.tokenIn.toLowerCase() === request.tokenOut.toLowerCase() ||
      !Number.isInteger(request.slippageBps) ||
      request.slippageBps < 0 ||
      request.slippageBps > 10_000
    ) {
      throw new ExternalSwapError("INVALID_REQUEST", "Invalid Peach exact-in quote request");
    }

    try {
      const srcNative = isNativeToken(request.tokenIn);
      const dstNative = isNativeToken(request.tokenOut);
      const srcToken = normalizeTokenForPeachApi(request.tokenIn);
      const dstToken = normalizeTokenForPeachApi(request.tokenOut);
      const routeData = await this.apiClient.findRoutes({
        from: srcToken,
        target: dstToken,
        amount: request.amountIn,
        byAmountIn: true,
        providers: request.dexProviders as Provider[] | undefined,
      });
      if (routeData.paths.length === 0) {
        throw new ExternalSwapError("NO_ROUTE", "Peach returned no routes");
      }
      const quoteWithoutFee = this.peachClient.buildQuoteFromRouteData(routeData, srcToken, dstToken, undefined, {
        srcNative,
        dstNative,
      });
      const customFeeAmount = (quoteWithoutFee.amountOut * BigInt(PEACH_CUSTOM_FEE_BPS)) / 10_000n;
      const amountOut = quoteWithoutFee.amountOut - customFeeAmount;
      const quote = {
        ...quoteWithoutFee,
        amountOut,
        params: {
          ...quoteWithoutFee.params,
          amountOutMin: amountOut,
          expectAmountOut: amountOut,
          feeReceiver: HERTZFLOW_CUSTOM_FEE_RECEIVER,
          feeBps: PEACH_CUSTOM_FEE_BPS,
        },
      };
      const encoded = this.peachClient.encodeSwapCalldata(quote, request.slippageBps);
      const routerAddress = this.getTrustedRouter(encoded.to);
      const minAmountOut = (quote.amountOut * BigInt(10_000 - request.slippageBps)) / 10_000n;

      return {
        source: "peach",
        quoteId: quote.params.quoteId as Hex,
        receivedAt: Date.now(),
        deadline: quote.params.deadline,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountIn: quote.amountIn,
        amountOut: quote.amountOut,
        minAmountOut,
        priceImpact: quote.priceImpact,
        routes: quote.route.routes.map((route, index) => ({
          percentageBps: quote.route.percentages[index] ?? 0,
          amountIn: route.amountIn,
          amountOut: route.amountOut,
          gasEstimate: route.gasEstimate,
          hops: route.steps.map((step) => ({
            dex: step.pool.protocol,
            pool: getPoolId(step.pool.address),
            tokenIn: getAddress(step.tokenIn),
            tokenOut: getAddress(step.tokenOut),
            amountIn: step.amountIn,
            amountOut: step.amountOut,
            feeRate: step.pool.fee === undefined ? undefined : step.pool.fee / 1_000_000,
          })),
        })),
        routeStreams: buildRouteStreams(routeData, srcToken, dstToken),
        gasEstimate: quote.gasEstimate,
        routerAddress,
        isNativeIn: quote.srcNative === true,
        isNativeOut: quote.dstNative === true,
        transaction: {
          to: routerAddress,
          data: encoded.data as Hex,
          value: encoded.value,
        },
      };
    } catch (error) {
      if (error instanceof ExternalSwapError) throw error;
      if (error instanceof ApiError && (error.code === 5010 || error.code === 404 || error.code === 4001)) {
        throw new ExternalSwapError("NO_ROUTE", error.message, { cause: error });
      }
      throw new ExternalSwapError("API_ERROR", error instanceof Error ? error.message : "Failed to load Peach quote", {
        cause: error,
      });
    }
  }

  /**
   * Returns an ERC20-input quote suitable for the order ExternalHandler.
   *
   * ExternalHandler executes calldata with `target.call(data)` and cannot
   * forward msg.value. Native BNB therefore has to be quoted as WBNB so the
   * order flow can send WBNB to ExternalHandler and execute the ERC20 swap.
   */
  async getOrderQuote(request: ExternalSwapQuoteRequest): Promise<ExternalSwapQuote> {
    const tokenIn = isNativeToken(request.tokenIn) ? normalizeTokenForPeachApi(request.tokenIn) : request.tokenIn;

    return this.getQuote({ ...request, tokenIn });
  }

  async buildSwapPlan({
    quote,
    owner,
  }: {
    quote: ExternalSwapQuote;
    owner: Address;
  }): Promise<ExternalSwapTransactionPlan> {
    this.assertSupportedChain();
    this.assertQuoteUsable(quote);

    if (quote.isNativeIn) {
      return { swap: quote.transaction };
    }

    const currentAllowance = await this.publicClient.readContract({
      address: quote.tokenIn,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, quote.routerAddress],
    });

    return {
      swap: quote.transaction,
      currentAllowance,
      approval:
        currentAllowance < quote.amountIn
          ? {
              to: quote.tokenIn,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "approve",
                args: [quote.routerAddress, quote.amountIn],
              }),
              value: 0n,
            }
          : undefined,
    };
  }

  async simulateSwap({ quote, owner }: { quote: ExternalSwapQuote; owner: Address }) {
    this.assertSupportedChain();
    this.assertQuoteUsable(quote);

    try {
      return await this.publicClient.call({
        account: owner,
        ...quote.transaction,
      });
    } catch (error) {
      throw new ExternalSwapError(
        "SIMULATION_FAILED",
        error instanceof Error ? error.message : "Peach swap simulation failed",
        { cause: error }
      );
    }
  }

  async approveSwap({ quote }: { quote: ExternalSwapQuote }) {
    this.assertSupportedChain();
    this.assertQuoteUsable(quote);
    if (quote.isNativeIn) {
      throw new ExternalSwapError("INVALID_REQUEST", "Native-token swaps do not require approval");
    }

    return this.sdk.callContract(quote.tokenIn, erc20Abi as Abi, "approve", [quote.routerAddress, quote.amountIn]);
  }

  async executeSwap({ quote }: { quote: ExternalSwapQuote }) {
    this.assertSupportedChain();
    this.assertQuoteUsable(quote);
    return this.sdk.sendTransaction(quote.transaction);
  }
}
