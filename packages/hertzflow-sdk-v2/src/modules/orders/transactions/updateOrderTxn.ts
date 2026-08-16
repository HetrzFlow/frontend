import { Abi, encodeFunctionData } from "viem";

import { abis } from "abis";
import { getContract } from "configs/contracts";
import { Token } from "types/tokens";
import { convertToContractPrice } from "utils/tokens";

import type { HertzFlowSDK } from "../../../index";
import { isIncreaseOrderType, isStopIncreaseOrderType, isStopLossOrderType } from "utils/orders";
import { MaxUint256 } from "utils/numbers";
import { applySlippageToPrice } from "utils/trade";
import { OrderType } from "types/orders";

export type UpdateOrderParams = {
  // orderKey: string;
  // indexTokenDecimals: number;
  // sizeDeltaUsd: bigint;
  // triggerPrice: bigint;
  // acceptablePrice: bigint;
  // minOutputAmount: bigint;
  // // used to top-up execution fee for frozen orders
  // executionFee?: bigint;
  // autoCancel: boolean;

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
};

export function buildUpdateOrderTxn(sdk: HertzFlowSDK, p: UpdateOrderParams): `0x${string}`[] {
  const {
    orderKey,
    isLong,
    indexTokenDecimals,
    sizeDeltaUsd,
    triggerPrice,
    orderType,
    minOutputAmount,
    executionFee,
    autoCancel,
    allowedSlippage,
    isSetAcceptablePriceImpactEnabled,
  } = p;
  let acceptablePrice = 0n;
  if (isStopLossOrderType(orderType) || isStopIncreaseOrderType(orderType)) {
    acceptablePrice = isLong ? 0n : MaxUint256;
  } else if (!isSetAcceptablePriceImpactEnabled) {
    const increaseOrderAcceptablePrice = isLong ? MaxUint256 : 0n;
    const decreaseOrderAcceptablePrice = isLong ? 0n : MaxUint256;
    acceptablePrice = isIncreaseOrderType(orderType) ? increaseOrderAcceptablePrice : decreaseOrderAcceptablePrice;
  } else {
    acceptablePrice = applySlippageToPrice(
      Number(Math.floor(allowedSlippage * 10000)),
      triggerPrice,
      isLong,
      isIncreaseOrderType(orderType)
    );
  }
  return createUpdateEncodedPayload({
    sdk,
    orderKey,
    sizeDeltaUsd,
    executionFee,
    indexTokenDecimals,
    acceptablePrice,
    triggerPrice,
    minOutputAmount,
    autoCancel,
  });
}

export function createUpdateEncodedPayload({
  sdk,
  orderKey,
  sizeDeltaUsd,
  executionFee,
  indexTokenDecimals,
  acceptablePrice,
  triggerPrice,
  autoCancel,
  minOutputAmount,
}: {
  sdk: HertzFlowSDK;
  orderKey: string;
  sizeDeltaUsd: bigint;
  executionFee?: bigint;
  indexTokenDecimals: number;
  acceptablePrice: bigint;
  triggerPrice: bigint;
  minOutputAmount: bigint;
  autoCancel: boolean;
}) {
  const orderVaultAddress = getContract(sdk.chainId, "OrderVault");

  const multicall: { method: string; params: any[] }[] = [];
  if (executionFee != undefined && executionFee > 0) {
    multicall.push({ method: "sendWnt", params: [orderVaultAddress, executionFee] });
  }

  multicall.push({
    method: "updateOrder",
    params: [
      orderKey,
      sizeDeltaUsd,
      acceptablePrice !== undefined ? convertToContractPrice(acceptablePrice, indexTokenDecimals) : 0n,
      triggerPrice !== undefined ? convertToContractPrice(triggerPrice, indexTokenDecimals) : 0n,
      minOutputAmount,
      0n,
      autoCancel,
    ],
  });

  return multicall.filter(Boolean).map((call) =>
    encodeFunctionData({
      abi: abis.ExchangeRouter as Abi,
      functionName: call!.method,
      args: call!.params,
    })
  );
}
