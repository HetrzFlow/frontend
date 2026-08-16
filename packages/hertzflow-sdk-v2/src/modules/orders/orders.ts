import { Abi, Address, zeroAddress } from "viem";

import { DecreasePositionSwapType, OrderPositionType, OrdersData, OrderType } from "types/orders";
import { TokenData, TokenPrices, TokensData } from "types/tokens";
import { isVisibleOrder } from "utils/orders";

import { createDecreaseOrderTxn, DecreaseOrderParams } from "./transactions/createDecreaseOrderTxn";
import { createIncreaseOrderTxn } from "./transactions/createIncreaseOrderTxn";
import { buildGetOrdersMulticall, getExecutionFeeAmountForEntry, parseGetOrdersResponse } from "./utils";
import { Module } from "../base";
import { cancelOrdersTxn } from "./transactions/cancelOrdersTxn";
import { buildUpdateOrderTxn, UpdateOrderParams } from "./transactions/updateOrderTxn";
import { getContract } from "configs/contracts";
import { abis } from "abis/index";
import { GasLimitsConfig } from "types/fees";
import type { InternalUsdParams } from "utils/internalUsd";
import type { ExternalSwapQuote } from "types/externalSwap";

export class Orders extends Module {
  async getOrders({ account: _account, orderTypesFilter = [] }: { account?: string; orderTypesFilter?: OrderType[] }) {
    const account = _account || this.account;

    if (!account) {
      return {
        count: 0,
        ordersData: {},
      };
    }

    const orders = await this.sdk
      .executeMulticall(buildGetOrdersMulticall(this.chainId, account))
      .then(parseGetOrdersResponse);

    const filteredOrders = orders.orders.filter((order) => {
      if (!isVisibleOrder(order.orderType)) {
        return false;
      }

      let matchByOrderType = true;

      if (orderTypesFilter.length > 0) {
        matchByOrderType = orderTypesFilter.includes(order.orderType);
      }

      return matchByOrderType;
    });

    const ordersData = filteredOrders?.reduce((acc, order) => {
      acc[order.key] = order;
      return acc;
    }, {} as OrdersData);

    return {
      count: orders.count,
      ordersData,
    };
  }

  async createIncreaseOrder({
    isLimit,
    marketAddress,
    prices,
    allowedSlippage,
    collateralTokenAddress,
    receiveTokenAddress,
    fromTokenAddress,
    triggerPrice,
    referralCodeForTxn,
    increaseAmounts,
    createSltpEntries,
    cancelSltpEntries,
    updateSltpEntries,
    isLong,
    indexToken,
    tokensData,
    skipSimulation,
    gasLimits,
    gasPrice,
    orderPositionType: orderPositionTypeParam,
    internalUsd,
    externalSwapQuote,
  }: {
    tokensData: TokensData;
    prices: Record<Address, TokenPrices>;
    isLimit: boolean;
    marketAddress: string;
    fromTokenAddress: string;
    allowedSlippage: number;
    referralCodeForTxn?: string;
    triggerPrice?: bigint;
    collateralTokenAddress: string;
    receiveTokenAddress: string;
    isLong: boolean;
    createSltpEntries?: {
      collateralDeltaAmount;
      sizeDeltaUsd;
      acceptablePrice;
      triggerPrice;
      orderType;
      decreaseSwapType: DecreasePositionSwapType.NoSwap;
      autoCancel: boolean;
    }[];
    cancelSltpEntries?: {
      key: string;
      orderType: OrderType;
      sizeDeltaUsd: bigint;
      initialCollateralDeltaAmount?: bigint;
    }[];
    updateSltpEntries?: {
      key: string;
      orderType: OrderType;
      sizeDeltaUsd: bigint;
      initialCollateralDeltaAmount?: bigint;
      acceptablePrice: bigint;
      triggerPrice: bigint;
      autoCancel: boolean;
    }[];
    indexToken: TokenData;
    increaseAmounts: {
      initialCollateralAmount: bigint;
      sizeDeltaUsd: bigint;
      acceptablePrice: bigint;
    };
    skipSimulation?: boolean;
    gasLimits?: GasLimitsConfig;
    gasPrice?: bigint;
    orderPositionType?: OrderPositionType;
    internalUsd?: InternalUsdParams;
    externalSwapQuote?: ExternalSwapQuote;
  }) {
    const account = this.account;
    if (!account) {
      throw new Error("Account is not defined");
    }
    const executionFee = await this.sdk.utils.getExecutionFee(
      "increase",
      tokensData,
      prices[zeroAddress],
      {
        // Peach runs during the user's order-creation transaction. The keeper
        // later executes an order with swapPath=[] so it has no order swap.
        increaseAmounts: { swapsCount: 0 },
        callbackGasLimit: 0n,
      },
      gasLimits,
      gasPrice
    );

    if (!executionFee) {
      throw new Error("Execution fee is not available");
    }

    const commonSecondaryOrderParams = {
      account,
      marketAddress,
      swapPath: [],
      allowedSlippage,
      initialCollateralAddress: collateralTokenAddress,
      receiveTokenAddress,
      isLong,
      orderPositionType: orderPositionTypeParam ?? OrderPositionType.Normal,
      indexToken,
      internalUsd,
    };

    return createIncreaseOrderTxn({
      sdk: this.sdk,
      createIncreaseOrderParams: {
        account,
        marketAddress: marketAddress,
        initialCollateralAddress: fromTokenAddress,
        initialCollateralAmount: increaseAmounts.initialCollateralAmount,
        targetCollateralAddress: collateralTokenAddress,
        swapPath: [],
        sizeDeltaUsd: increaseAmounts.sizeDeltaUsd,
        triggerPrice: isLimit ? triggerPrice : undefined,
        acceptablePrice: increaseAmounts.acceptablePrice,
        isLong,
        orderType: isLimit ? OrderType.LimitIncrease : OrderType.MarketIncrease,
        orderPositionType: orderPositionTypeParam ?? OrderPositionType.Normal,
        executionFee: executionFee.feeTokenAmount,
        allowedSlippage,
        referralCode: referralCodeForTxn,
        indexToken: indexToken,
        tokensData,
        skipSimulation: skipSimulation || isLimit,
        internalUsd,
        externalSwapQuote,
      },
      createDecreaseOrderParams: createSltpEntries?.map((entry) => {
        return {
          ...commonSecondaryOrderParams,
          initialCollateralDeltaAmount: entry.collateralDeltaAmount ?? 0n,
          sizeDeltaUsd: entry.sizeDeltaUsd,
          acceptablePrice: entry.acceptablePrice,
          triggerPrice: entry.triggerPrice,
          minOutputUsd: 0n,
          decreasePositionSwapType: entry.decreaseSwapType,
          orderType: entry.orderType,
          referralCode: referralCodeForTxn,
          executionFee:
            getExecutionFeeAmountForEntry(
              this.sdk,
              {
                txnType: "update",
                executionFee: 0n,
                decreaseSwapType: entry.decreaseSwapType,
                callbackGasLimit: 0n,
              },
              gasLimits,
              tokensData,
              prices[zeroAddress],
              gasPrice
            ) ?? 0n,
          tokensData,
          txnType: "create",
          skipSimulation: isLimit,
          autoCancel: entry.autoCancel,
        };
      }),
      cancelOrderParams: cancelSltpEntries?.map((entry) => ({
        ...commonSecondaryOrderParams,
        orderKey: entry.key,
        orderType: entry.orderType,
        minOutputAmount: 0n,
        sizeDeltaUsd: entry.sizeDeltaUsd,
        txnType: "cancel",
        initialCollateralDeltaAmount: entry.initialCollateralDeltaAmount ?? 0n,
      })),
      updateOrderParams: updateSltpEntries?.map((entry) => ({
        ...commonSecondaryOrderParams,
        orderKey: entry.key,
        orderType: entry.orderType,
        sizeDeltaUsd: entry.sizeDeltaUsd!,
        acceptablePrice: entry.acceptablePrice!,
        triggerPrice: entry.triggerPrice,
        executionFee:
          getExecutionFeeAmountForEntry(
            this.sdk,
            {
              txnType: "update",
              executionFee: 0n,
              decreaseSwapType: DecreasePositionSwapType.NoSwap,
              callbackGasLimit: 0n,
            },
            gasLimits,
            tokensData,
            prices[zeroAddress],
            gasPrice
          ) ?? 0n,
        minOutputAmount: 0n,
        txnType: "update",
        initialCollateralDeltaAmount: entry.initialCollateralDeltaAmount ?? 0n,
        autoCancel: entry.autoCancel,
      })),
    });
  }

  async createDecreaseOrder(
    params: {
      marketAddress: Address;
      prices: Record<Address, TokenPrices>;
      tokensData: TokensData;
      isLong: boolean;
      allowedSlippage: number;
      decreaseAmounts: {
        decreaseSwapType: DecreasePositionSwapType.NoSwap;
        triggerPrice: bigint;
        collateralDeltaAmount: bigint;
        acceptablePrice: bigint;
        sizeDeltaUsd: bigint;
      };
      indexToken: TokenData;
      collateralToken: TokenData;
      referralCode?: string;
      orderType: OrderType.MarketDecrease | OrderType.LimitDecrease | OrderType.StopLossDecrease;
      orderPositionType?: OrderPositionType;
      internalUsd?: InternalUsdParams;
      autoCancel?: boolean;
      gasLimits?: GasLimitsConfig;
      gasPrice?: bigint;
    }[]
  ) {
    const account = this.account;
    if (!account) {
      throw new Error("Account is not defined");
    }

    const decreaseOrderParams: DecreaseOrderParams[] = [];
    for (let i = 0; i < params.length; i++) {
      const {
        tokensData,
        prices,
        marketAddress,
        decreaseAmounts,
        collateralToken,
        allowedSlippage,
        isLong,
        indexToken,
        referralCode,
        orderType,
        orderPositionType,
        internalUsd,
        autoCancel = false,
        gasLimits,
        gasPrice,
      } = params[i];
      const executionFee = await this.sdk.utils.getExecutionFee(
        "decrease",
        tokensData,
        prices[zeroAddress],
        {
          decreaseAmounts,
          callbackGasLimit: 0n,
        },
        gasLimits,
        gasPrice
      );

      if (!executionFee) {
        throw new Error("Execution fee is not available");
      }

      decreaseOrderParams.push({
        account,
        marketAddress: marketAddress,
        swapPath: [],
        initialCollateralDeltaAmount: decreaseAmounts.collateralDeltaAmount,
        initialCollateralAddress: collateralToken.address,
        receiveTokenAddress: collateralToken.address,
        triggerPrice: decreaseAmounts.triggerPrice,
        acceptablePrice: decreaseAmounts.acceptablePrice,
        sizeDeltaUsd: decreaseAmounts.sizeDeltaUsd,
        minOutputUsd: BigInt(0),
        isLong,
        decreasePositionSwapType: decreaseAmounts.decreaseSwapType,
        orderType: orderType,
        executionFee: executionFee.feeTokenAmount,
        allowedSlippage,
        referralCode,
        orderPositionType: orderPositionType ?? OrderPositionType.Normal,
        skipSimulation: true,
        indexToken: indexToken,
        tokensData,
        autoCancel,
        internalUsd,
      });
    }

    return createDecreaseOrderTxn(this.sdk, {
      decreaseOrderParams: decreaseOrderParams,
    });
  }

  async cancelOrders(orderKeys: string[]) {
    return cancelOrdersTxn(this.sdk, {
      orderKeys: orderKeys,
    });
  }

  async updateOrder(p: {
    orderKey: string;
    indexTokenDecimals: number;
    isLong: boolean;
    sizeDeltaUsd: bigint;
    triggerPrice: bigint;
    orderType: OrderType;
    minOutputAmount: bigint;
    executionFee?: bigint | undefined;
    autoCancel: boolean;
    allowedSlippage: number;
    isSetAcceptablePriceImpactEnabled?: boolean;
  }) {
    const { executionFee } = p;

    const encodedPayload = buildUpdateOrderTxn(this.sdk, p);

    const router = getContract(this.sdk.chainId, "ExchangeRouter");

    return this.sdk.callContract(router, abis.ExchangeRouter as Abi, "multicall", [encodedPayload], {
      value: executionFee != undefined && executionFee > 0 ? executionFee : undefined,
    });
  }

  async depositPositionCollateral({
    marketAddress,
    collateralTokenAddress,
    collateralTokenAmount,
    payTokenAddress,
    internalUsd,
    isLong,
    allowedSlippage,
    indexToken,
    tokensData,
    skipSimulation,
    gasLimits,
    gasPrice,
    prices,
    orderPositionType,
  }: {
    marketAddress: string;
    collateralTokenAmount: bigint;
    collateralTokenAddress: string;
    payTokenAddress?: string;
    internalUsd?: InternalUsdParams;
    isLong: boolean;
    allowedSlippage: number;
    indexToken: TokenData;
    tokensData: TokensData;
    prices: Record<Address, TokenPrices>;
    orderPositionType?: OrderPositionType;
    skipSimulation?: boolean;
    gasLimits?: GasLimitsConfig;
    gasPrice?: bigint;
  }) {
    const account = this.sdk.account;

    if (!account) return;
    const initialCollateralAddress = payTokenAddress ?? internalUsd?.underlyingTokenAddress ?? collateralTokenAddress;

    const executionFee = await this.sdk.utils.getExecutionFee(
      "increase",
      tokensData,
      prices[zeroAddress],
      {
        increaseAmounts: { swapsCount: 0 },
        callbackGasLimit: 0n,
      },
      gasLimits,
      gasPrice
    );
    if (!executionFee) {
      throw new Error("Execution fee is not available");
    }

    return await createIncreaseOrderTxn({
      sdk: this.sdk,
      createIncreaseOrderParams: {
        account,
        marketAddress,
        initialCollateralAddress,
        initialCollateralAmount: collateralTokenAmount,
        targetCollateralAddress: collateralTokenAddress,
        swapPath: [],
        sizeDeltaUsd: 0n,
        triggerPrice: undefined,
        acceptablePrice: 0n,
        isLong,
        orderType: OrderType.MarketIncrease,
        executionFee: executionFee.feeTokenAmount,
        allowedSlippage: Number(Math.floor(allowedSlippage * 10000)),
        referralCode: undefined,
        orderPositionType: orderPositionType ?? OrderPositionType.Normal,
        indexToken: indexToken,
        tokensData,
        skipSimulation: skipSimulation,
        internalUsd,
      },
    });
  }

  async withdrawPositionCollateral({
    marketAddress,
    collateralTokenAddress,
    collateralTokenAmount,
    internalUsd,
    isLong,
    allowedSlippage,
    indexToken,
    tokensData,
    updateSltpEntries,
    skipSimulation,
    prices,
    orderPositionType,
    gasLimits,
    gasPrice,
  }: {
    marketAddress: string;
    collateralTokenAmount: bigint;
    collateralTokenAddress: string;
    internalUsd?: InternalUsdParams;
    isLong: boolean;
    allowedSlippage: number;
    indexToken: TokenData;
    tokensData: TokensData;
    prices: Record<Address, TokenPrices>;
    orderPositionType?: OrderPositionType;
    updateSltpEntries?: UpdateOrderParams[];
    skipSimulation?: boolean;
    gasLimits?: GasLimitsConfig;
    gasPrice?: bigint;
  }) {
    const account = this.sdk.account;

    if (!account) return;
    const executionFee = await this.sdk.utils.getExecutionFee(
      "decrease",
      tokensData,
      prices[zeroAddress],
      {
        decreaseAmounts: { decreaseSwapType: DecreasePositionSwapType.NoSwap },
        callbackGasLimit: 0n,
      },
      gasLimits,
      gasPrice
    );

    if (!executionFee) {
      throw new Error("Execution fee is not available");
    }

    return await createDecreaseOrderTxn(this.sdk, {
      decreaseOrderParams: [
        {
          account,
          marketAddress,
          initialCollateralAddress: collateralTokenAddress,
          initialCollateralDeltaAmount: collateralTokenAmount,
          swapPath: [],
          sizeDeltaUsd: 0n,
          triggerPrice: undefined,
          acceptablePrice: 0n,
          isLong,
          orderType: OrderType.MarketDecrease,
          executionFee: executionFee.feeTokenAmount,
          allowedSlippage: Number(Math.floor(allowedSlippage * 10000)),
          referralCode: undefined,
          orderPositionType: orderPositionType ?? OrderPositionType.Normal,
          indexToken: indexToken,
          tokensData,
          skipSimulation: skipSimulation,
          receiveTokenAddress: collateralTokenAddress,
          minOutputUsd: 0n,
          decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
          autoCancel: false,
          internalUsd,
        },
      ],
      updateOrderParams: updateSltpEntries,
    });
  }
}
