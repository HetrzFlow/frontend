import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeFunctionData, erc20Abi, zeroAddress, type Address } from "viem";
import { ApiError } from "@masterpeach/aggregator-sdk";

import { SOURCE_BSC_MAINNET, SOURCE_BSC_TESTNET } from "configs/chains";
import { ExternalSwap, PEACH_BSC_ROUTER } from "modules/externalSwap";
import { ExternalSwapError, type ExternalSwapQuote } from "types/externalSwap";

const mocks = vi.hoisted(() => ({
  findRoutes: vi.fn(),
  buildQuoteFromRouteData: vi.fn(),
  encodeSwapCalldata: vi.fn(),
  getStatus: vi.fn(),
}));

vi.mock("@masterpeach/aggregator-sdk", () => ({
  ApiError: class extends Error {
    constructor(
      message: string,
      public readonly code: number
    ) {
      super(message);
    }
  },
  ApiClient: class {
    getStatus = mocks.getStatus;
    findRoutes = mocks.findRoutes;
  },
  PeachClient: class {
    buildQuoteFromRouteData = mocks.buildQuoteFromRouteData;
    encodeSwapCalldata = mocks.encodeSwapCalldata;
  },
  BSC_MAINNET_CONFIG: {
    chainId: 56,
    rpcUrl: "",
    weth: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    adapters: [],
  },
  NATIVE_TOKEN_ADDRESS: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
}));

const TOKEN_IN = "0x55d398326f99059fF775485246999027B3197955" as Address;
const TOKEN_OUT = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as Address;
const OWNER = "0x1111111111111111111111111111111111111111" as Address;
const POOL = "0x2222222222222222222222222222222222222222" as Address;
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as Address;

const createSdk = ({
  chainId = SOURCE_BSC_MAINNET,
  allowance = 0n,
}: {
  chainId?: typeof SOURCE_BSC_MAINNET | typeof SOURCE_BSC_TESTNET;
  allowance?: bigint;
} = {}) =>
  ({
    chainId,
    config: {},
    publicClient: {
      readContract: vi.fn().mockResolvedValue(allowance),
      call: vi.fn().mockResolvedValue({ data: "0x01" }),
    },
    callContract: vi.fn().mockResolvedValue(`0x${"2".repeat(64)}`),
    sendTransaction: vi.fn().mockResolvedValue(`0x${"3".repeat(64)}`),
  }) as any;

const createQuote = (overrides: Partial<ExternalSwapQuote> = {}): ExternalSwapQuote => ({
  source: "peach",
  quoteId: `0x${"1".repeat(64)}`,
  receivedAt: Date.now(),
  deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
  tokenIn: TOKEN_IN,
  tokenOut: TOKEN_OUT,
  amountIn: 1_000n,
  amountOut: 2_000n,
  minAmountOut: 1_980n,
  priceImpact: 0.001,
  routes: [],
  routeStreams: [],
  gasEstimate: 500_000n,
  routerAddress: PEACH_BSC_ROUTER,
  isNativeIn: false,
  isNativeOut: false,
  transaction: {
    to: PEACH_BSC_ROUTER,
    data: "0x1234",
    value: 0n,
  },
  ...overrides,
});

describe("ExternalSwap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.encodeSwapCalldata.mockReturnValue({
      to: PEACH_BSC_ROUTER,
      data: "0x1234",
      value: 0n,
    });
  });

  it("maps one API response into calldata and display streams", async () => {
    const routeData = {
      request_id: "request-1",
      amount_in: "1000",
      amount_out: "20000",
      deviation_ratio: "0.001",
      paths: [
        {
          pool: POOL,
          provider: "PANCAKEV3",
          adapter: "0x3333333333333333333333333333333333333333",
          token_in: TOKEN_IN,
          token_out: TOKEN_OUT,
          direction: true,
          fee_rate: "0.0005",
          amount_in: "1000",
          amount_out: "20000",
        },
      ],
      contracts: { router: PEACH_BSC_ROUTER, adapters: {} },
      gas: 500_000,
    };
    const peachQuote = {
      srcToken: TOKEN_IN,
      dstToken: TOKEN_OUT,
      amountIn: 1_000n,
      amountOut: 20_000n,
      priceImpact: 0.001,
      route: {
        routes: [
          {
            steps: [
              {
                pool: {
                  address: POOL,
                  protocol: "PancakeV3",
                  fee: 500,
                },
                tokenIn: TOKEN_IN,
                tokenOut: TOKEN_OUT,
                amountIn: 1_000n,
                amountOut: 2_000n,
              },
            ],
            amountIn: 1_000n,
            amountOut: 20_000n,
            gasEstimate: 500_000n,
          },
        ],
        percentages: [10_000],
      },
      params: {
        quoteId: `0x${"1".repeat(64)}`,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
      },
      gasEstimate: 500_000n,
      routerAddress: PEACH_BSC_ROUTER,
    };
    mocks.findRoutes.mockResolvedValue(routeData);
    mocks.buildQuoteFromRouteData.mockReturnValue(peachQuote);

    const externalSwap = new ExternalSwap(createSdk({ chainId: SOURCE_BSC_MAINNET }));
    const quote = await externalSwap.getQuote({
      tokenIn: TOKEN_IN,
      tokenOut: TOKEN_OUT,
      amountIn: 1_000n,
      slippageBps: 100,
    });

    expect(mocks.findRoutes).toHaveBeenCalledTimes(1);
    expect(mocks.findRoutes).toHaveBeenCalledWith({
      from: TOKEN_IN,
      target: TOKEN_OUT,
      amount: 1_000n,
      byAmountIn: true,
      providers: undefined,
    });
    expect(mocks.buildQuoteFromRouteData).toHaveBeenCalledWith(routeData, TOKEN_IN, TOKEN_OUT, undefined, {
      srcNative: false,
      dstNative: false,
    });
    expect(mocks.encodeSwapCalldata).toHaveBeenCalledWith(
      expect.objectContaining({
        amountOut: 19_998n,
        params: expect.objectContaining({
          amountOutMin: 19_998n,
          expectAmountOut: 19_998n,
          feeReceiver: "0xA03c246AE10f4aC87677fC24DDf68029cBD2234a",
          feeBps: 1,
        }),
      }),
      100
    );
    expect(quote).toMatchObject({
      source: "peach",
      amountOut: 19_998n,
      minAmountOut: 19_798n,
      routerAddress: PEACH_BSC_ROUTER,
      transaction: {
        to: PEACH_BSC_ROUTER,
        data: "0x1234",
        value: 0n,
      },
    });
    expect(quote.routes[0]?.hops[0]).toMatchObject({
      dex: "PancakeV3",
      feeRate: 0.0005,
    });
    expect(quote.routeStreams).toEqual([
      {
        percentageBps: 10_000,
        hops: [
          expect.objectContaining({
            providerCode: "PANCAKEV3",
            feeRate: "0.0005",
          }),
        ],
      },
    ]);
  });

  it("rejects quotes on unsupported chains", async () => {
    const externalSwap = new ExternalSwap(createSdk({ chainId: SOURCE_BSC_TESTNET }));

    await expect(
      externalSwap.getQuote({
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: 1_000n,
        slippageBps: 100,
      })
    ).rejects.toMatchObject({ code: "UNSUPPORTED_CHAIN" });
    expect(mocks.findRoutes).not.toHaveBeenCalled();
  });

  it("rejects a quote that targets an untrusted router", async () => {
    const untrustedRouter = "0x3333333333333333333333333333333333333333" as Address;
    mocks.findRoutes.mockResolvedValue({
      request_id: "request-1",
      amount_in: "1",
      amount_out: "1",
      deviation_ratio: "0",
      paths: [
        {
          pool: POOL,
          provider: "PANCAKEV2",
          adapter: POOL,
          token_in: TOKEN_IN,
          token_out: TOKEN_OUT,
          direction: true,
          fee_rate: "0.0025",
          amount_in: "1",
          amount_out: "1",
        },
      ],
      contracts: { router: untrustedRouter, adapters: {} },
      gas: 1,
    });
    mocks.buildQuoteFromRouteData.mockReturnValue({
      amountIn: 1n,
      amountOut: 1n,
      priceImpact: 0,
      route: { routes: [], percentages: [] },
      params: {
        quoteId: `0x${"1".repeat(64)}`,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
      },
      gasEstimate: 1n,
    });
    mocks.encodeSwapCalldata.mockReturnValue({
      to: untrustedRouter,
      data: "0x1234",
      value: 0n,
    });

    await expect(
      new ExternalSwap(createSdk()).getQuote({
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: 1n,
        slippageBps: 50,
      })
    ).rejects.toMatchObject({ code: "UNTRUSTED_ROUTER" });
  });

  it("uses WBNB for native BNB routing and preserves native calldata options", async () => {
    const routeData = {
      request_id: "native-request",
      amount_in: "1",
      amount_out: "2",
      deviation_ratio: "0",
      paths: [
        {
          pool: POOL,
          provider: "PANCAKEV2",
          adapter: POOL,
          token_in: WBNB,
          token_out: TOKEN_IN,
          direction: true,
          fee_rate: "0.0025",
          amount_in: "1",
          amount_out: "2",
        },
      ],
      contracts: { router: PEACH_BSC_ROUTER, adapters: {} },
      gas: 1,
    };
    mocks.findRoutes.mockResolvedValue(routeData);
    mocks.buildQuoteFromRouteData.mockReturnValue({
      amountIn: 1n,
      amountOut: 2n,
      priceImpact: 0,
      route: { routes: [], percentages: [] },
      params: {
        quoteId: `0x${"1".repeat(64)}`,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
      },
      gasEstimate: 1n,
      srcNative: true,
    });

    const quote = await new ExternalSwap(createSdk()).getQuote({
      tokenIn: zeroAddress,
      tokenOut: TOKEN_IN,
      amountIn: 1n,
      slippageBps: 50,
    });

    expect(mocks.findRoutes).toHaveBeenCalledWith(expect.objectContaining({ from: WBNB, target: TOKEN_IN }));
    expect(mocks.buildQuoteFromRouteData).toHaveBeenCalledWith(routeData, WBNB, TOKEN_IN, undefined, {
      srcNative: true,
      dstNative: false,
    });
    expect(quote.isNativeIn).toBe(true);
  });

  it("quotes native BNB as an ERC20 WBNB input for order ExternalHandler", async () => {
    mocks.findRoutes.mockResolvedValue({
      request_id: "order-native-request",
      amount_in: "1",
      amount_out: "2",
      deviation_ratio: "0",
      paths: [
        {
          pool: POOL,
          provider: "PANCAKEV2",
          adapter: POOL,
          token_in: WBNB,
          token_out: TOKEN_IN,
          direction: true,
          fee_rate: "0.0025",
          amount_in: "1",
          amount_out: "2",
        },
      ],
      contracts: { router: PEACH_BSC_ROUTER, adapters: {} },
      gas: 1,
    });
    mocks.buildQuoteFromRouteData.mockReturnValue({
      amountIn: 1n,
      amountOut: 2n,
      priceImpact: 0,
      route: { routes: [], percentages: [] },
      params: {
        quoteId: `0x${"1".repeat(64)}`,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
      },
      gasEstimate: 1n,
      srcNative: false,
    });

    const quote = await new ExternalSwap(createSdk()).getOrderQuote({
      tokenIn: zeroAddress,
      tokenOut: TOKEN_IN,
      amountIn: 1n,
      slippageBps: 50,
    });

    expect(quote.tokenIn).toBe(WBNB);
    expect(quote.isNativeIn).toBe(false);
    expect(quote.transaction.value).toBe(0n);
    expect(mocks.buildQuoteFromRouteData).toHaveBeenCalledWith(expect.anything(), WBNB, TOKEN_IN, undefined, {
      srcNative: false,
      dstNative: false,
    });
  });

  it.each([5010, 404, 4001])("maps Peach no-route error %s", async (code) => {
    mocks.findRoutes.mockRejectedValue(new ApiError("No route", code));

    await expect(
      new ExternalSwap(createSdk()).getQuote({
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: 1n,
        slippageBps: 50,
      })
    ).rejects.toMatchObject({ code: "NO_ROUTE" });
  });

  it("maps a successful empty route response to NO_ROUTE", async () => {
    mocks.findRoutes.mockResolvedValue({
      request_id: "empty-route",
      amount_in: "1",
      amount_out: "0",
      deviation_ratio: "0",
      paths: [],
      contracts: { router: PEACH_BSC_ROUTER, adapters: {} },
      gas: 0,
    });

    await expect(
      new ExternalSwap(createSdk()).getQuote({
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: 1n,
        slippageBps: 50,
      })
    ).rejects.toMatchObject({ code: "NO_ROUTE" });
    expect(mocks.buildQuoteFromRouteData).not.toHaveBeenCalled();
  });

  it.each([0, 408, 500])("keeps Peach transport error %s as API_ERROR", async (code) => {
    mocks.findRoutes.mockRejectedValue(new ApiError("API failed", code));

    await expect(
      new ExternalSwap(createSdk()).getQuote({
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: 1n,
        slippageBps: 50,
      })
    ).rejects.toMatchObject({ code: "API_ERROR" });
  });

  it("rejects a malformed zero-amount hop as API_ERROR", async () => {
    mocks.findRoutes.mockResolvedValue({
      request_id: "zero-hop",
      amount_in: "0",
      amount_out: "0",
      deviation_ratio: "0",
      paths: [
        {
          pool: POOL,
          provider: "PANCAKEV2",
          adapter: POOL,
          token_in: TOKEN_IN,
          token_out: TOKEN_OUT,
          direction: true,
          fee_rate: "0.0025",
          amount_in: "0",
          amount_out: "0",
        },
      ],
      contracts: { router: PEACH_BSC_ROUTER, adapters: {} },
      gas: 1,
    });
    mocks.buildQuoteFromRouteData.mockReturnValue({
      amountIn: 0n,
      amountOut: 0n,
      priceImpact: 0,
      route: { routes: [], percentages: [] },
      params: {
        quoteId: `0x${"1".repeat(64)}`,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
      },
      gasEstimate: 1n,
    });

    await expect(
      new ExternalSwap(createSdk()).getQuote({
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: 1n,
        slippageBps: 50,
      })
    ).rejects.toMatchObject({ code: "API_ERROR" });
  });

  it("builds a standard ERC20 approval only when allowance is insufficient", async () => {
    const externalSwap = new ExternalSwap(createSdk({ allowance: 999n }));
    const plan = await externalSwap.buildSwapPlan({
      quote: createQuote({ amountIn: 1_000n }),
      owner: OWNER,
    });

    expect(plan.currentAllowance).toBe(999n);
    expect(plan.approval?.to).toBe(TOKEN_IN);
    expect(decodeFunctionData({ abi: erc20Abi, data: plan.approval!.data })).toEqual({
      functionName: "approve",
      args: [PEACH_BSC_ROUTER, 1_000n],
    });

    const approvedPlan = await new ExternalSwap(createSdk({ allowance: 1_000n })).buildSwapPlan({
      quote: createQuote(),
      owner: OWNER,
    });
    expect(approvedPlan.approval).toBeUndefined();
  });

  it("does not request approval for native BNB and rejects unsupported chain execution", async () => {
    const externalSwap = new ExternalSwap(createSdk());
    const plan = await externalSwap.buildSwapPlan({
      quote: createQuote({
        tokenIn: zeroAddress,
        isNativeIn: true,
        transaction: {
          to: PEACH_BSC_ROUTER,
          data: "0x1234",
          value: 1_000n,
        },
      }),
      owner: OWNER,
    });
    expect(plan.approval).toBeUndefined();

    await expect(
      new ExternalSwap(createSdk({ chainId: SOURCE_BSC_TESTNET })).buildSwapPlan({
        quote: createQuote(),
        owner: OWNER,
      })
    ).rejects.toEqual(
      expect.objectContaining<Partial<ExternalSwapError>>({
        code: "UNSUPPORTED_CHAIN",
      })
    );
  });

  it("submits approvals and swaps through the SDK transaction methods", async () => {
    const sdk = createSdk();
    const externalSwap = new ExternalSwap(sdk);
    const quote = createQuote();

    await externalSwap.approveSwap({ quote });
    expect(sdk.callContract).toHaveBeenCalledWith(TOKEN_IN, erc20Abi, "approve", [PEACH_BSC_ROUTER, 1_000n]);

    await externalSwap.executeSwap({ quote });
    expect(sdk.sendTransaction).toHaveBeenCalledWith(quote.transaction);
  });

  it("rejects a swap transaction whose target differs from the quoted trusted router", async () => {
    const externalSwap = new ExternalSwap(createSdk());

    await expect(
      externalSwap.executeSwap({
        quote: createQuote({
          transaction: {
            to: TOKEN_OUT,
            data: "0x1234",
            value: 0n,
          },
        }),
      })
    ).rejects.toMatchObject({ code: "UNTRUSTED_ROUTER" });
  });
});
