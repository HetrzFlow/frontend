import { describe, expect, it } from "vitest";
import { zeroAddress } from "viem";

import { SOURCE_BSC_TESTNET } from "configs/chains";
import { getContract } from "configs/contracts";
import { getWrappedToken, NATIVE_TOKEN_ADDRESS } from "configs/tokens";
import type { HertzFlowSDK } from "index";
import {
  createDecreaseEncodedPayload,
  type DecreaseOrderParams,
} from "modules/orders/transactions/createDecreaseOrderTxn";
import { DecreasePositionSwapType, OrderPositionType, OrderType } from "types/orders";
import {
  buildCreateOrderMulticall,
  buildDecreaseOrderPayload,
  buildIncreaseOrderPayload,
} from "utils/orderTransactions";
import { parseValue, USD_DECIMALS } from "utils/numbers";
import { requireInternalUsd, type InternalUsdParams } from "utils/internalUsd";
import { ExternalSwapAggregator } from "types/trade";

const CHAIN_ID = SOURCE_BSC_TESTNET;
const ACCOUNT = "0x1234567890123456789012345678901234567890";
const UI_FEE_RECEIVER = "0x0987654321098765432109876543210987654321";
const MARKET = "0x1111111111111111111111111111111111111111";
const USDT = "0x6335881872FEcab922d1d83c6Bae6E27C5a9209c";
const HFUSD = "0x22527Bb489A0c7d91F63E63226b14f979f5FF090";
const HFBANK = "0x720E7ACff273A3A7df6ba0B432Dc21a46EfFdbEe";
const PAY_TOKEN = "0x2222222222222222222222222222222222222222";
const SWAP_ROUTER = "0x3333333333333333333333333333333333333333";
const EXECUTION_FEE = 10n ** 15n;
const CALLBACK_GAS_LIMIT = 1_000_000n;
const PAY_AMOUNT = 100n * 10n ** 18n;
const WBNB = getWrappedToken(CHAIN_ID);

const internalUsd = {
  bankAddress: HFBANK,
  wrappedTokenAddress: HFUSD,
  underlyingTokenAddress: USDT,
} satisfies InternalUsdParams;

const commonOrderParams = {
  chainId: CHAIN_ID,
  receiver: ACCOUNT,
  uiFeeReceiver: UI_FEE_RECEIVER,
  executionFeeAmount: EXECUTION_FEE,
  executionGasLimit: CALLBACK_GAS_LIMIT,
  referralCode: undefined,
  validFromTime: 0n,
  autoCancel: false,
  marketAddress: MARKET,
  indexTokenAddress: WBNB.address,
  isLong: true,
  sizeDeltaUsd: parseValue("1000", USD_DECIMALS)!,
  sizeDeltaInTokens: 0n,
  collateralTokenAddress: HFUSD,
  collateralDeltaAmount: PAY_AMOUNT,
  swapPath: [],
  allowedSlippage: 0,
  acceptablePrice: 0n,
  triggerPrice: 0n,
  orderPositionType: OrderPositionType.Normal,
  externalSwapQuote: undefined,
  internalUsd,
};

describe("internal USD order payloads", () => {
  it("requires explicit configuration when an HFUSD-only caller requests it", () => {
    expect(() => requireInternalUsd(undefined)).toThrow("HFUSD orders require internal USD configuration");
  });

  it("builds an increase order that mints HFUSD directly into OrderVault", () => {
    const payload = buildIncreaseOrderPayload({
      ...commonOrderParams,
      payTokenAddress: USDT,
      payTokenAmount: PAY_AMOUNT,
      orderType: OrderType.MarketIncrease,
    });

    expect(payload.orderPayload.addresses.receiver).toBe(ACCOUNT);
    expect(payload.orderPayload.addresses.cancellationReceiver).toBe(ACCOUNT);
    expect(payload.orderPayload.addresses.callbackContract).toBe(zeroAddress);
    expect(payload.orderPayload.addresses.initialCollateralToken).toBe(HFUSD);
    expect(payload.orderPayload.numbers.callbackGasLimit).toBe(0n);
    expect(payload.orderPayload.shouldUnwrapNativeToken).toBe(false);

    expect(payload.tokenTransfersParams?.tokenTransfers).toEqual([
      {
        tokenAddress: NATIVE_TOKEN_ADDRESS,
        destination: getContract(CHAIN_ID, "OrderVault"),
        amount: EXECUTION_FEE,
      },
      {
        tokenAddress: USDT,
        destination: HFBANK,
        amount: PAY_AMOUNT,
      },
    ]);
    expect(payload.tokenTransfersParams?.externalCalls?.sendTokens).toEqual([]);
    expect(payload.tokenTransfersParams?.externalCalls?.sendAmounts).toEqual([]);
    expect(payload.tokenTransfersParams?.externalCalls?.externalCallTargets).toEqual([HFBANK]);

    const { multicall, value } = buildCreateOrderMulticall(payload);
    expect(value).toBe(EXECUTION_FEE);
    expect(multicall.map((call) => call.method)).toEqual(["sendWnt", "sendTokens", "makeExternalCalls", "createOrder"]);
  });

  it("builds an add-collateral order as zero-size increase with USDT wrap into HFUSD", () => {
    const payload = buildIncreaseOrderPayload({
      ...commonOrderParams,
      payTokenAddress: USDT,
      payTokenAmount: PAY_AMOUNT,
      sizeDeltaUsd: 0n,
      sizeDeltaInTokens: 0n,
      orderType: OrderType.MarketIncrease,
    });

    expect(payload.orderPayload.numbers.sizeDeltaUsd).toBe(0n);
    expect(payload.orderPayload.addresses.initialCollateralToken).toBe(HFUSD);
    expect(payload.orderPayload.addresses.callbackContract).toBe(zeroAddress);
    expect(payload.tokenTransfersParams?.payTokenAddress).toBe(USDT);
    expect(payload.tokenTransfersParams?.initialCollateralTokenAddress).toBe(HFUSD);
    expect(payload.tokenTransfersParams?.externalCalls?.externalCallTargets).toEqual([HFBANK]);
  });

  it("swaps externally into USDT, then mints all received HFUSD into OrderVault", () => {
    const externalHandler = getContract(CHAIN_ID, "ExternalHandler");
    const payload = buildIncreaseOrderPayload({
      ...commonOrderParams,
      payTokenAddress: PAY_TOKEN,
      payTokenAmount: PAY_AMOUNT,
      externalSwapQuote: {
        aggregator: ExternalSwapAggregator.OpenOcean,
        inTokenAddress: PAY_TOKEN,
        outTokenAddress: USDT,
        receiver: externalHandler,
        amountIn: PAY_AMOUNT,
        amountOut: PAY_AMOUNT - 1n,
        usdIn: PAY_AMOUNT,
        usdOut: PAY_AMOUNT - 1n,
        priceIn: 1n,
        priceOut: 1n,
        feesUsd: 1n,
        txnData: {
          to: SWAP_ROUTER,
          data: "0x1234",
          value: 0n,
          estimatedGas: 100_000n,
          estimatedExecutionFee: 0n,
        },
      },
      orderType: OrderType.MarketIncrease,
    });

    expect(payload.orderPayload.addresses.initialCollateralToken).toBe(HFUSD);
    expect(payload.orderPayload.numbers.initialCollateralDeltaAmount).toBe(0n);
    expect(payload.tokenTransfersParams?.tokenTransfers).toContainEqual({
      tokenAddress: PAY_TOKEN,
      destination: externalHandler,
      amount: PAY_AMOUNT,
    });

    const { multicall } = buildCreateOrderMulticall(payload);
    expect(multicall.map((call) => call.method)).toEqual([
      "sendWnt",
      "sendTokens",
      "makeExternalCalls",
      "makeExternalCalls",
      "createOrder",
    ]);

    const swapExternalCall = multicall[2]!.params;
    expect(swapExternalCall[2]).toEqual([PAY_TOKEN, USDT, WBNB.address]);
    expect(swapExternalCall[3]).toEqual([ACCOUNT, HFBANK, ACCOUNT]);

    const mintExternalCall = multicall[3]!.params;
    expect(mintExternalCall[0]).toEqual([HFBANK]);
    expect(mintExternalCall[2]).toEqual([]);
    expect(mintExternalCall[3]).toEqual([]);
  });

  it("rejects external swap output that cannot be minted by the configured HFBank", () => {
    expect(() =>
      buildIncreaseOrderPayload({
        ...commonOrderParams,
        payTokenAddress: PAY_TOKEN,
        payTokenAmount: PAY_AMOUNT,
        externalSwapQuote: {
          aggregator: ExternalSwapAggregator.OpenOcean,
          inTokenAddress: PAY_TOKEN,
          outTokenAddress: WBNB.address,
          receiver: getContract(CHAIN_ID, "ExternalHandler"),
          amountIn: PAY_AMOUNT,
          amountOut: 1n,
          usdIn: PAY_AMOUNT,
          usdOut: PAY_AMOUNT,
          priceIn: 1n,
          priceOut: 1n,
          feesUsd: 0n,
          txnData: {
            to: SWAP_ROUTER,
            data: "0x1234",
            value: 0n,
            estimatedGas: 100_000n,
            estimatedExecutionFee: 0n,
          },
        },
        orderType: OrderType.MarketIncrease,
      })
    ).toThrow("External swap output token must match the internal USD underlying token");
  });

  it("rejects an external quote whose input does not match the funded token", () => {
    expect(() =>
      buildIncreaseOrderPayload({
        ...commonOrderParams,
        payTokenAddress: PAY_TOKEN,
        payTokenAmount: PAY_AMOUNT,
        externalSwapQuote: {
          aggregator: ExternalSwapAggregator.OpenOcean,
          inTokenAddress: USDT,
          outTokenAddress: USDT,
          receiver: getContract(CHAIN_ID, "ExternalHandler"),
          amountIn: PAY_AMOUNT,
          amountOut: PAY_AMOUNT,
          usdIn: PAY_AMOUNT,
          usdOut: PAY_AMOUNT,
          priceIn: 1n,
          priceOut: 1n,
          feesUsd: 0n,
          txnData: {
            to: SWAP_ROUTER,
            data: "0x1234",
            value: 0n,
            estimatedGas: 100_000n,
            estimatedExecutionFee: 0n,
          },
        },
        orderType: OrderType.MarketIncrease,
      })
    ).toThrow("External swap input token must match the payment token");
  });

  it("rejects an external quote whose amount does not match the funded amount", () => {
    expect(() =>
      buildIncreaseOrderPayload({
        ...commonOrderParams,
        payTokenAddress: PAY_TOKEN,
        payTokenAmount: PAY_AMOUNT,
        externalSwapQuote: {
          aggregator: ExternalSwapAggregator.OpenOcean,
          inTokenAddress: PAY_TOKEN,
          outTokenAddress: USDT,
          receiver: getContract(CHAIN_ID, "ExternalHandler"),
          amountIn: PAY_AMOUNT - 1n,
          amountOut: PAY_AMOUNT,
          usdIn: PAY_AMOUNT,
          usdOut: PAY_AMOUNT,
          priceIn: 1n,
          priceOut: 1n,
          feesUsd: 0n,
          txnData: {
            to: SWAP_ROUTER,
            data: "0x1234",
            value: 0n,
            estimatedGas: 100_000n,
            estimatedExecutionFee: 0n,
          },
        },
        orderType: OrderType.MarketIncrease,
      })
    ).toThrow("External swap input amount must match the payment amount");
  });

  it("rejects external calls that require native value forwarding", () => {
    expect(() =>
      buildIncreaseOrderPayload({
        ...commonOrderParams,
        payTokenAddress: PAY_TOKEN,
        payTokenAmount: PAY_AMOUNT,
        externalSwapQuote: {
          aggregator: ExternalSwapAggregator.OpenOcean,
          inTokenAddress: PAY_TOKEN,
          outTokenAddress: USDT,
          receiver: getContract(CHAIN_ID, "ExternalHandler"),
          amountIn: PAY_AMOUNT,
          amountOut: PAY_AMOUNT,
          usdIn: PAY_AMOUNT,
          usdOut: PAY_AMOUNT,
          priceIn: 1n,
          priceOut: 1n,
          feesUsd: 0n,
          txnData: {
            to: SWAP_ROUTER,
            data: "0x1234",
            value: 1n,
            estimatedGas: 100_000n,
            estimatedExecutionFee: 0n,
          },
        },
        orderType: OrderType.MarketIncrease,
      })
    ).toThrow("External swap calls cannot forward native value");
  });

  it("builds a withdraw-collateral order that auto-redeems to the user", () => {
    const payload = buildDecreaseOrderPayload({
      ...commonOrderParams,
      receiveTokenAddress: HFUSD,
      minOutputUsd: 0n,
      decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
      orderType: OrderType.MarketDecrease,
      sizeDeltaUsd: 0n,
      sizeDeltaInTokens: 0n,
    });

    expect(payload.orderPayload.numbers.sizeDeltaUsd).toBe(0n);
    expect(payload.orderPayload.addresses.receiver).toBe(ACCOUNT);
    expect(payload.orderPayload.addresses.cancellationReceiver).toBe(ACCOUNT);
    expect(payload.orderPayload.addresses.callbackContract).toBe(zeroAddress);
    expect(payload.orderPayload.addresses.initialCollateralToken).toBe(HFUSD);
    expect(payload.orderPayload.numbers.callbackGasLimit).toBe(0n);
    expect(payload.orderPayload.shouldUnwrapNativeToken).toBe(false);
    expect(payload.tokenTransfersParams?.externalCalls).toBeUndefined();

    const { multicall, value } = buildCreateOrderMulticall(payload);
    expect(value).toBe(EXECUTION_FEE);
    expect(multicall.map((call) => call.method)).toEqual(["sendWnt", "createOrder"]);
  });

  it("rejects decrease orders that request a non-HFUSD output", () => {
    expect(() =>
      buildDecreaseOrderPayload({
        ...commonOrderParams,
        receiveTokenAddress: USDT,
        minOutputUsd: 0n,
        decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
        orderType: OrderType.MarketDecrease,
      })
    ).toThrow("HFUSD decrease orders must receive the HFUSD wrapped token");
  });

  it("rejects decrease orders with a swap path or decrease swap mode", () => {
    const decreaseParams = {
      ...commonOrderParams,
      receiveTokenAddress: HFUSD,
      minOutputUsd: 0n,
      decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
      orderType: OrderType.MarketDecrease,
    } as const;

    expect(() => buildDecreaseOrderPayload({ ...decreaseParams, swapPath: [MARKET] })).toThrow(
      "HFUSD decrease orders do not support swap paths"
    );
    expect(() =>
      buildDecreaseOrderPayload({
        ...decreaseParams,
        decreasePositionSwapType: DecreasePositionSwapType.SwapPnlTokenToCollateralToken,
      } as unknown as Parameters<typeof buildDecreaseOrderPayload>[0])
    ).toThrow("HFUSD decrease orders require NoSwap");
  });

  it("validates decrease restrictions again when encoding calldata", () => {
    expect(() =>
      createDecreaseEncodedPayload({
        sdk: {} as HertzFlowSDK,
        orderVaultAddress: getContract(CHAIN_ID, "OrderVault"),
        ps: [
          {
            initialCollateralAddress: HFUSD,
            receiveTokenAddress: HFUSD,
            swapPath: [MARKET],
            decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
            internalUsd,
          } as DecreaseOrderParams,
        ],
      })
    ).toThrow("HFUSD decrease orders do not support swap paths");
  });
});
