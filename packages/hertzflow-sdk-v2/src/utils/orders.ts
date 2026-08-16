import { MarketsInfoData } from "types/markets";
import { Order, OrderInfo, OrderParams, OrderType, PositionOrderInfo, TwapOrderInfo } from "types/orders";
import { Token, TokenPrices, TokensData } from "types/tokens";
import { getSwapPathOutputAddresses, getSwapPathStats } from "utils/swap/swapStats";

import { getByKey } from "./objects";
import { getPositionKey, parsePositionKey } from "./positions";
import { getOrderThresholdType } from "./prices";
import { convertToUsd, parseContractPrice } from "./tokens";
import { Address } from "viem";

export function isMarketOrderType(orderType: OrderType) {
  return [OrderType.MarketDecrease, OrderType.MarketIncrease].includes(orderType);
}

export function isLimitOrderType(orderType: OrderType) {
  return [OrderType.LimitIncrease, OrderType.StopIncrease].includes(orderType);
}

export function isTriggerDecreaseOrderType(orderType: OrderType) {
  return [OrderType.LimitDecrease, OrderType.StopLossDecrease].includes(orderType);
}

export function isDecreaseOrderType(orderType: OrderType) {
  return [OrderType.MarketDecrease, OrderType.LimitDecrease, OrderType.StopLossDecrease].includes(orderType);
}

export function isIncreaseOrderType(
  orderType: OrderType
): orderType is OrderType.MarketIncrease | OrderType.LimitIncrease | OrderType.StopIncrease {
  return [OrderType.MarketIncrease, OrderType.LimitIncrease, OrderType.StopIncrease].includes(orderType);
}

export function isLiquidationOrderType(orderType: OrderType) {
  return orderType === OrderType.Liquidation;
}

export function isStopLossOrderType(orderType: OrderType) {
  return orderType === OrderType.StopLossDecrease;
}

export function isLimitDecreaseOrderType(orderType: OrderType) {
  return orderType === OrderType.LimitDecrease;
}

export function isLimitIncreaseOrderType(orderType: OrderType) {
  return orderType === OrderType.LimitIncrease;
}

export function isStopIncreaseOrderType(orderType: OrderType) {
  return orderType === OrderType.StopIncrease;
}

export function isTwapOrder<T extends OrderParams>(orderInfo: T): orderInfo is Extract<T, { isTwap: true }> {
  return orderInfo.isTwap;
}

export function isTwapPositionOrder(orderInfo: OrderInfo): orderInfo is TwapOrderInfo<PositionOrderInfo> {
  return orderInfo.isTwap;
}

export function isPositionOrder(orderInfo: OrderInfo): orderInfo is PositionOrderInfo {
  return !orderInfo.isTwap;
}

export function getOrderKeys(order: OrderInfo) {
  return isTwapOrder(order) ? order.orders.map((o) => o.key) : [order.key];
}

export function getOrderInfo(p: {
  marketsInfoData: MarketsInfoData;
  tokensData: TokensData;
  prices: Record<Address, TokenPrices>;
  wrappedNativeToken: Token;
  order: Order;
}) {
  const { marketsInfoData, tokensData, wrappedNativeToken, order, prices } = p;

  const marketInfo = getByKey(marketsInfoData, order.marketAddress);
  const indexToken = marketInfo?.indexToken;

  const initialCollateralToken = getByKey(tokensData, order.initialCollateralTokenAddress);
  const { outTokenAddress } = getSwapPathOutputAddresses({
    marketsInfoData,
    swapPath: order.swapPath,
    initialCollateralAddress: order.initialCollateralTokenAddress,
    wrappedNativeTokenAddress: wrappedNativeToken.address,
    shouldUnwrapNativeToken: order.shouldUnwrapNativeToken,
    isIncrease: isIncreaseOrderType(order.orderType),
  });

  const targetCollateralToken = getByKey(tokensData, outTokenAddress);

  if (!marketInfo || !indexToken || !initialCollateralToken || !targetCollateralToken) {
    return undefined;
  }

  const acceptablePrice = parseContractPrice(order.contractAcceptablePrice, indexToken.decimals);
  const triggerPrice = parseContractPrice(order.contractTriggerPrice, indexToken.decimals);

  const swapPathStats = getSwapPathStats({
    prices,
    tokensData,
    marketsInfoData,
    swapPath: order.swapPath,
    initialCollateralAddress: order.initialCollateralTokenAddress,
    wrappedNativeTokenAddress: wrappedNativeToken.address,
    usdIn: convertToUsd(
      order.initialCollateralDeltaAmount,
      initialCollateralToken.decimals,
      prices[initialCollateralToken.address].minPrice
    )!,
    shouldUnwrapNativeToken: order.shouldUnwrapNativeToken,
    shouldApplyPriceImpact: true,
    isAtomicSwap: false,
  });

  let triggerThresholdType;
  if (!isMarketOrderType(order.orderType)) {
    triggerThresholdType = getOrderThresholdType(order.orderType, order.isLong);
  }

  const orderInfo: PositionOrderInfo = {
    ...order,
    swapPathStats,
    marketInfo,
    indexToken,
    initialCollateralToken,
    targetCollateralToken,
    acceptablePrice,
    triggerPrice,
    triggerThresholdType,
    isSwap: false,
    isTwap: false,
  };

  return orderInfo;
}

export function isVisibleOrder(orderType: OrderType) {
  return isLimitOrderType(orderType) || isTriggerDecreaseOrderType(orderType) || isMarketOrderType(orderType);
}

export function isOrderForPosition(order: OrderInfo, positionKey: string): order is PositionOrderInfo {
  const { account, marketAddress, collateralAddress, isLong, isZFP } = parsePositionKey(positionKey);

  let isMatch =
    order.account === account &&
    order.marketAddress === marketAddress &&
    order.isLong === isLong &&
    ((order.isZFP as boolean | undefined) ?? false) === isZFP;

  // For limit orders, we need to check the target collateral token
  if (isLimitOrderType(order.orderType)) {
    const targetCollateralTokenAddress = order.targetCollateralToken.isNative
      ? order.targetCollateralToken.wrappedAddress
      : order.targetCollateralToken.address;
    isMatch = isMatch && targetCollateralTokenAddress === collateralAddress;
  } else if (isTriggerDecreaseOrderType(order.orderType)) {
    isMatch = isMatch && order.initialCollateralTokenAddress === collateralAddress;
  }

  return isMatch;
}

export function isOrderForPositionByData(
  order: OrderInfo,
  {
    account,
    marketAddress,
    collateralAddress,
    isLong,
  }: {
    account: string;
    marketAddress: string;
    collateralAddress: string;
    isLong: boolean;
  }
): order is PositionOrderInfo {
  let isMatch =
    order.account === account &&
    order.marketAddress === marketAddress &&
    order.isLong === isLong;

  // For limit orders, we need to check the target collateral token
  if (isLimitOrderType(order.orderType)) {
    const targetCollateralTokenAddress = order.targetCollateralToken.isNative
      ? order.targetCollateralToken.wrappedAddress
      : order.targetCollateralToken.address;
    isMatch = isMatch && targetCollateralTokenAddress === collateralAddress;
  } else if (isTriggerDecreaseOrderType(order.orderType)) {
    isMatch = isMatch && order.initialCollateralTokenAddress === collateralAddress;
  }

  return isMatch;
}

export function getOrderTradeboxKey(order: OrderInfo) {
  return `POSITION-${getPositionKey(
    order.account,
    order.marketAddress,
    order.initialCollateralTokenAddress,
    order.isLong,
    order.isZFP
  )}`;
}
