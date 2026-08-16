import { ProtocolStoreObjectInfo } from '../modules/queryModule';
import { SafeNumber } from './base-types';

export type AddLiquidityParams = {
  amountIn: SafeNumber;
  slippage: number;
  inCoinDecimals: number;
  inCoinPrice: SafeNumber;
  typeArguments: [assetCoin: string];
};

export type RemoveLiquidityParams = {
  amountIn: SafeNumber;
  outCoinDecimals: number;
  outCoinPrice: SafeNumber;
  slippage: number;
  typeArguments: [outCoin: string];
};

export type CreatePositionRequestArgs = [
  payCoin: string,
  collateralCoin: string,
  indexCoin: string,
];
export type CreatePositionRequestParams = {
  protocolStore: ProtocolStoreObjectInfo;
  amountIn: SafeNumber;
  isLong: boolean;
  leverage: number;
  slippage: number;
  payCoinDecimals: number;
  indexCoinMarketPrice: SafeNumber;
  indexCoinDecimals: number;
  collateralCoinMarketPrice: SafeNumber;
  collateralCoinDecimals: number;
  typeArguments: CreatePositionRequestArgs;
};

export type IncreasePositionRequestParams = {
  amountIn: SafeNumber;
  minOut: SafeNumber;
  sizeDelta: SafeNumber;
  isLong: boolean;
  acceptablePrice: SafeNumber;
  typeArguments: [payCoin: string, collateralCoin: string, indexCoin: string];
};

export type DecreasePositionRequestParams = {
  minOut: SafeNumber;
  collateralDelta: SafeNumber;
  sizeDelta: SafeNumber;
  acceptablePrice: SafeNumber;
  typeArguments: [receiverCoin: string];
};

export type CancelIncreasePositionRequestParams = {
  requestId: string;
  typeArguments: [payCoin: string];
};

export type CancelDecreasePositionRequestParams = {
  requestId: string;
};

export type SwapParams = {
  protocolStore: ProtocolStoreObjectInfo;
  amountIn?: SafeNumber;
  amountOut?: SafeNumber;
  outCoinPrice: SafeNumber;
  slippage: number;
  inCoinDecimals: number;
  outCoinDecimals: number;
  typeArguments: [inCoin: string, outCoin: string];
};

export type CreateIncreaseOrderParams = {
  protocolStore: ProtocolStoreObjectInfo;
  amountIn: SafeNumber;
  isLong: boolean;
  leverage: number;
  triggerPrice: SafeNumber;
  triggerAboveThreshold: boolean;
  collateralCoinPrice: SafeNumber;
  collateralCoinDecimals: number;
  indexCoinDecimals: number;
  typeArguments: [collateralCoin: string, indexCoin: string];
};

export type CancelIncreaseOrderParams = {
  orderId: string;
  collateralCoin: string;
};

export type CancelDecreaseOrderParams = {
  orderId: string;
};

export type CreateDecreaseOrderParams = {
  positionId: string;
  sizeDelta: SafeNumber;
  currentSize: SafeNumber;
  currentCollateral: SafeNumber;
  triggerPrice: SafeNumber;
  leverage: number;
  triggerAboveThreshold: boolean;
  indexCoinDecimals: number;
  positionFundingFee: SafeNumber;
};

export type IncreaseOrderParams = {
  protocolStore: ProtocolStoreObjectInfo;
  positionId: string;
  amountIn: SafeNumber;
  leverage: number;
  isLong: boolean;
  borrowFee: SafeNumber;
  triggerPrice: SafeNumber;
  triggerAboveThreshold: boolean;
  collateralCoinPrice: SafeNumber;
  collateralCoinDecimals: number;
  indexCoinDecimals: number;
  typeArguments: [collateralCoin: string, indexCoin: string];
};

export type IncreasePositionRequestWithPositionParams = {
  protocolStore: ProtocolStoreObjectInfo;
  positionId: string;
  amountIn: SafeNumber;
  isLong: boolean;
  leverage: number;
  borrowFee: SafeNumber;
  slippage: number;
  indexCoinMarketPrice: SafeNumber;
  indexCoinDecimals: number;
  collateralCoinMarketPrice: SafeNumber;
  collateralCoinDecimals: number;
  payCoinDecimals: number;
  typeArguments: [payCoin: string, collateralCoin: string, indexCoin: string];
};

export type DecreasePositionRequestWithPositionParams = {
  protocolStore: ProtocolStoreObjectInfo;
  positionId: string;
  sizeDelta: SafeNumber;
  currentSize: SafeNumber;
  currentCollateral: SafeNumber;
  isLong: boolean;
  slippage: number;
  collateralCoinMarketPrice: SafeNumber;
  collateralCoinDecimals: number;
  receiverCoinMarketPrice: SafeNumber;
  receiverCoinDecimals: number;
  indexCoinMarketPrice: SafeNumber;
  indexCoinDecimals: number;
  borrowFee: SafeNumber;
  typeArguments: [collateralCoin: string, receiverCoin: string];
};

export type UpdateIncreaseOrderParams = {
  orderId: string;
  size: SafeNumber;
  triggerPrice: SafeNumber;
  indexCoinDecimals: number;
  triggerAboveThreshold: boolean;
};

export type UpdateDecreaseOrderParams = {
  orderId: string;
  triggerPrice: SafeNumber;
  indexCoinDecimals: number;
  triggerAboveThreshold: boolean;
  size: SafeNumber;
  collateral: SafeNumber;
};

export type AddMarginParams = {
  protocolStore: ProtocolStoreObjectInfo;
  positionId: string;
  amountIn: SafeNumber;
  isLong: boolean;
  slippage: number;
  indexCoinMarketPrice: SafeNumber;
  indexCoinDecimals: number;
  payCoinDecimals: number;
  collateralCoinMarketPrice: SafeNumber;
  collateralCoinDecimals: number;
  typeArguments: [payCoin: string, collateralCoin: string, indexCoin: string];
};
export type ReduceMarginParams = {
  positionId: string;
  isLong: boolean;
  slippage: number;
  collateralDelta: SafeNumber;
  receiverCoinMarketPrice: SafeNumber;
  receiverCoinDecimals: number;
  indexCoinMarketPrice: SafeNumber;
  indexCoinDecimals: number;
  typeArguments: [receiverCoin: string];
};
