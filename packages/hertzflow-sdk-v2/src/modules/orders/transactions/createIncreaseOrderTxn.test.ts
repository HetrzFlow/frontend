import { describe, expect, it, vi } from "vitest";
import { decodeFunctionData } from "viem";

import { abis } from "abis";
import { SOURCE_BSC_MAINNET } from "configs/chains";
import { PEACH_BSC_ROUTER } from "modules/externalSwap";
import type { ExternalSwapQuote } from "types/externalSwap";
import { OrderPositionType, OrderType } from "types/orders";
import { NATIVE_TOKEN_ADDRESS } from "configs/tokens";

import { createIncreaseOrderTxn } from "./createIncreaseOrderTxn";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as const;
const MARKET = "0x2222222222222222222222222222222222222222" as const;
const INDEX = "0x3333333333333333333333333333333333333333" as const;
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as const;
const USDT = "0x55d398326f99059fF775485246999027B3197955" as const;
const HFUSD = "0x3Cc4C9cbDa158909D385e8B4EbDD80867067623E" as const;
const BANK = "0x4444444444444444444444444444444444444444" as const;

const quote: ExternalSwapQuote = {
  source: "peach",
  quoteId: `0x${"1".repeat(64)}`,
  receivedAt: Date.now(),
  deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
  tokenIn: WBNB,
  tokenOut: USDT,
  amountIn: 100n,
  amountOut: 200n,
  minAmountOut: 198n,
  priceImpact: 0,
  routes: [],
  routeStreams: [],
  gasEstimate: 100_000n,
  routerAddress: PEACH_BSC_ROUTER,
  isNativeIn: false,
  isNativeOut: false,
  transaction: { to: PEACH_BSC_ROUTER, data: "0x1234", value: 0n },
};

const createSdk = () => {
  const callContract = vi.fn().mockResolvedValue("0xresult");
  return {
    sdk: {
      chainId: SOURCE_BSC_MAINNET,
      config: { settings: {} },
      callContract,
    } as any,
    callContract,
  };
};

describe("createIncreaseOrderTxn Peach integration", () => {
  it("keeps Peach swap, mint, and createOrder in order", async () => {
    const { sdk, callContract } = createSdk();

    await createIncreaseOrderTxn({
      sdk,
      createIncreaseOrderParams: {
        account: ACCOUNT,
        marketAddress: MARKET,
        initialCollateralAddress: WBNB,
        targetCollateralAddress: HFUSD,
        initialCollateralAmount: 100n,
        swapPath: [],
        sizeDeltaUsd: 20n,
        acceptablePrice: 1n,
        triggerPrice: undefined,
        isLong: true,
        orderType: OrderType.MarketIncrease,
        orderPositionType: OrderPositionType.Normal,
        executionFee: 1n,
        allowedSlippage: 100,
        referralCode: undefined,
        indexToken: { address: INDEX, decimals: 8 } as any,
        tokensData: {} as any,
        skipSimulation: true,
        internalUsd: {
          bankAddress: BANK,
          wrappedTokenAddress: HFUSD,
          underlyingTokenAddress: USDT,
        },
        externalSwapQuote: quote,
      },
    });

    const payload = callContract.mock.calls[0]![3][0] as `0x${string}`[];
    const decoded = payload.map((data) => decodeFunctionData({ abi: abis.ExchangeRouter, data }));
    expect(decoded.map((item) => item.functionName)).toEqual([
      "sendWnt",
      "sendTokens",
      "makeExternalCalls",
      "makeExternalCalls",
      "createOrder",
    ]);

    const peachCalls = decoded[2]!.args as readonly unknown[];
    expect(peachCalls[0]).toEqual([WBNB, PEACH_BSC_ROUTER]);
    expect(peachCalls[2]).toEqual([WBNB, USDT]);
    expect(peachCalls[3]).toEqual([ACCOUNT, BANK]);

    const mintCalls = decoded[3]!.args as readonly unknown[];
    expect(mintCalls[0]).toEqual([BANK]);
    expect((decoded[4]!.args as readonly any[])[0].addresses.initialCollateralToken).toBe(HFUSD);
  });

  it("uses a second sendWnt for native Peach input", async () => {
    const { sdk, callContract } = createSdk();

    await createIncreaseOrderTxn({
      sdk,
      createIncreaseOrderParams: {
        account: ACCOUNT,
        marketAddress: MARKET,
        initialCollateralAddress: NATIVE_TOKEN_ADDRESS,
        targetCollateralAddress: HFUSD,
        initialCollateralAmount: 100n,
        swapPath: [],
        sizeDeltaUsd: 20n,
        acceptablePrice: 1n,
        triggerPrice: undefined,
        isLong: true,
        orderType: OrderType.MarketIncrease,
        orderPositionType: OrderPositionType.Normal,
        executionFee: 1n,
        allowedSlippage: 100,
        referralCode: undefined,
        indexToken: { address: INDEX, decimals: 8 } as any,
        tokensData: {} as any,
        skipSimulation: true,
        internalUsd: { bankAddress: BANK, wrappedTokenAddress: HFUSD, underlyingTokenAddress: USDT },
        externalSwapQuote: { ...quote, isNativeIn: false },
      },
    });

    const payload = callContract.mock.calls[0]![3][0] as `0x${string}`[];
    const decoded = payload.map((data) => decodeFunctionData({ abi: abis.ExchangeRouter, data }));
    expect(decoded.map((item) => item.functionName)).toEqual([
      "sendWnt",
      "sendWnt",
      "makeExternalCalls",
      "makeExternalCalls",
      "createOrder",
    ]);
  });

  it("rejects native Peach calldata instead of treating swapETH as an ERC20 swap", async () => {
    const { sdk } = createSdk();

    await expect(
      createIncreaseOrderTxn({
        sdk,
        createIncreaseOrderParams: {
          account: ACCOUNT,
          marketAddress: MARKET,
          initialCollateralAddress: NATIVE_TOKEN_ADDRESS,
          targetCollateralAddress: HFUSD,
          initialCollateralAmount: 100n,
          swapPath: [],
          sizeDeltaUsd: 20n,
          acceptablePrice: 1n,
          triggerPrice: undefined,
          isLong: true,
          orderType: OrderType.MarketIncrease,
          orderPositionType: OrderPositionType.Normal,
          executionFee: 1n,
          allowedSlippage: 100,
          referralCode: undefined,
          indexToken: { address: INDEX, decimals: 8 } as any,
          tokensData: {} as any,
          skipSimulation: true,
          internalUsd: { bankAddress: BANK, wrappedTokenAddress: HFUSD, underlyingTokenAddress: USDT },
          externalSwapQuote: { ...quote, tokenIn: NATIVE_TOKEN_ADDRESS, isNativeIn: true, transaction: { ...quote.transaction, value: 100n } },
        },
      }),
    ).rejects.toThrow("requires ERC20 swap calldata with zero value");
  });
});
