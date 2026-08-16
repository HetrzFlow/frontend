import uniq from "lodash/uniq";
import { encodeFunctionData, zeroAddress, zeroHash } from "viem";

import ExchangeRouterAbi from "abis/ExchangeRouter";
import { abis } from "abis/index";
import ERC20ABI from "abis/Token";
import { ContractsChainId, getExcessiveExecutionFee, getHighExecutionFee } from "configs/chains";
import { getContract } from "configs/contracts";
import { convertTokenAddress, getToken, getWrappedToken, NATIVE_TOKEN_ADDRESS } from "configs/tokens";
import { ExecutionFee } from "types/fees";
import { DecreasePositionSwapType, OrderPositionType, OrderType } from "types/orders";
import { ContractPrice, ERC20Address, TokenPrices, TokensData } from "types/tokens";
import { ExternalSwapQuote } from "types/trade";
import { TwapOrderParams } from "types/twap";

import {
  buildInternalUsdMintExternalCalls,
  getInternalUsdOrderAddresses,
  validateInternalUsdDecreaseOrder,
  validateInternalUsdWrappedToken,
  type InternalUsdParams,
} from "./internalUsd";
import { expandDecimals, MaxUint256, USD_DECIMALS } from "./numbers";
import { getByKey } from "./objects";
import { isIncreaseOrderType } from "./orders";
import { convertToContractPrice, convertToUsd } from "./tokens";
import { applySlippageToMinOut, applySlippageToPrice } from "./trade";
import { getTwapValidFromTime } from "./twap";
import { createTwapUiFeeReceiver } from "./twap/uiFeeReceiver";

export type ExchangeRouterCall = {
  method: string;
  params: any[];
};

export type BatchOrderTxnParams = {
  createOrderParams: CreateOrderTxnParams<any>[];
  updateOrderParams: UpdateOrderTxnParams[];
  cancelOrderParams: CancelOrderTxnParams[];
};

export type CreateOrderTxnParams<TParams extends IncreasePositionOrderParams | DecreasePositionOrderParams> = {
  params: TParams;
  orderPayload: CreateOrderPayload;
  tokenTransfersParams: TokenTransfersParams | undefined;
};

export type UpdateOrderTxnParams = {
  params: UpdateOrderParams;
  updatePayload: UpdateOrderPayload;
};

export type CancelOrderTxnParams = {
  orderKey: string;
};

export type CreateOrderPayload = {
  addresses: {
    receiver: string;
    cancellationReceiver: string;
    callbackContract: string;
    uiFeeReceiver: string;
    market: string;
    initialCollateralToken: ERC20Address;
    swapPath: string[];
  };
  numbers: {
    sizeDeltaUsd: bigint;
    /**
     * For express orders initialCollateralDeltaAmount will be transfered from user wallet to order vault in relay router logic,
     * for default orders - this field will be ignored in contracts and settled by actual value reveived in order vault
     * */
    initialCollateralDeltaAmount: bigint;
    triggerPrice: ContractPrice | 0n;
    acceptablePrice: ContractPrice | 0n;
    executionFee: bigint;
    callbackGasLimit: bigint;
    minOutputAmount: bigint;
    validFromTime: bigint;
  };
  orderType: OrderType;
  decreasePositionSwapType: DecreasePositionSwapType;
  isLong: boolean;
  shouldUnwrapNativeToken: boolean;
  autoCancel: boolean;
  referralCode: string;
  orderPositionType: OrderPositionType;
  dataList: string[];
};

export type UpdateOrderParams = {
  chainId: ContractsChainId;
  indexTokenAddress: string;
  orderKey: string;
  orderType: OrderType;
  sizeDeltaUsd: bigint;
  triggerPrice: bigint;
  acceptablePrice: bigint;
  minOutputAmount: bigint;
  autoCancel: boolean;
  validFromTime: bigint;
  // used to top-up execution fee for frozen orders
  executionFeeTopUp: bigint;
};

export type UpdateOrderPayload = {
  orderKey: string;
  sizeDeltaUsd: bigint;
  triggerPrice: ContractPrice;
  acceptablePrice: ContractPrice;
  minOutputAmount: bigint;
  autoCancel: boolean;
  validFromTime: bigint;
  // used to top-up execution fee for frozen orders
  executionFeeTopUp: bigint;
};

export type TokenTransfersParams = {
  // Whether the payment token is the chain's native token (e.g. ETH for Ethereum)
  isNativePayment: boolean;
  // Whether the receive token is the chain's native token (e.g. ETH for Ethereum)
  isNativeReceive: boolean;
  tokenTransfers: TokenTransfer[];
  value: bigint;
  payTokenAddress: string;
  payTokenAmount: bigint;
  initialCollateralTokenAddress: ERC20Address;
  initialCollateralDeltaAmount: bigint;
  minOutputAmount: bigint;
  swapPath: string[];
  externalCalls: ExternalCallsPayload | undefined;
  additionalExternalCalls?: ExternalCallsPayload[];
};

export type TokenTransfer = {
  tokenAddress: string;
  destination: string;
  amount: bigint;
};

export type ExternalCallsPayload = {
  sendTokens: ERC20Address[];
  sendAmounts: bigint[];
  externalCallTargets: string[];
  externalCallDataList: string[];
  refundTokens: string[];
  refundReceivers: string[];
};

export type CommonOrderParams = {
  chainId: ContractsChainId;
  receiver: string;
  executionFeeAmount: bigint;
  executionGasLimit: bigint;
  referralCode: string | undefined;
  uiFeeReceiver: string | undefined;
  allowedSlippage: number;
  autoCancel: boolean;
  validFromTime: bigint | undefined;
};

export type PositionOrderParams = {
  marketAddress: string;
  indexTokenAddress: string;
  isLong: boolean;
  sizeDeltaUsd: bigint;
  sizeDeltaInTokens: bigint;
  acceptablePrice: bigint;
  triggerPrice: bigint | undefined;
  orderPositionType: OrderPositionType;
};

export type IncreasePositionOrderParams = CommonOrderParams &
  PositionOrderParams & {
    // Token that the user pays with
    payTokenAddress: string;
    payTokenAmount: bigint;
    swapPath: string[];
    collateralDeltaAmount: bigint;
    // Target collateral for the position
    collateralTokenAddress: string;
    internalUsd?: InternalUsdParams;
    externalSwapQuote: ExternalSwapQuote | undefined;
    orderType: OrderType.MarketIncrease | OrderType.LimitIncrease | OrderType.StopIncrease;
  };

export type DecreasePositionOrderParams = CommonOrderParams &
  PositionOrderParams & {
    // Collateral of the position
    collateralTokenAddress: string;
    collateralDeltaAmount: bigint;
    internalUsd?: InternalUsdParams;
    swapPath: string[];
    externalSwapQuote: undefined;
    // Token that the user receives
    receiveTokenAddress: string;
    minOutputUsd: bigint;
    decreasePositionSwapType: DecreasePositionSwapType;
    orderType: OrderType.MarketDecrease | OrderType.LimitDecrease | OrderType.StopLossDecrease;
  };

export function buildIncreaseOrderPayload(
  p: IncreasePositionOrderParams
): CreateOrderTxnParams<IncreasePositionOrderParams> {
  const internalUsd = p.internalUsd;
  if (internalUsd) {
    validateInternalUsdWrappedToken(internalUsd, p.collateralTokenAddress);
  }

  const tokenTransfersParams = buildTokenTransfersParamsForIncrease({
    ...p,
    minOutputAmount: 0n,
    receiveTokenAddress: undefined,
    internalUsd,
  });

  const indexToken = getToken(p.chainId, p.indexTokenAddress);

  let acceptablePrice: ContractPrice;
  if (p.acceptablePrice === MaxUint256) {
    acceptablePrice = MaxUint256 as ContractPrice;
  } else {
    acceptablePrice = convertToContractPrice(
      applySlippageToPrice(p.allowedSlippage, p.acceptablePrice, true, p.isLong),
      indexToken.decimals
    );
  }

  let triggerPrice: ContractPrice;
  if (p.triggerPrice === MaxUint256) {
    triggerPrice = MaxUint256 as ContractPrice;
  } else {
    triggerPrice = convertToContractPrice(p.triggerPrice ?? 0n, indexToken.decimals);
  }

  const orderAddresses = internalUsd
    ? getInternalUsdOrderAddresses(p.receiver)
    : {
        receiver: p.receiver,
        cancellationReceiver: zeroAddress,
        callbackContract: zeroAddress,
        callbackGasLimit: 0n,
      };

  const orderPayload: CreateOrderPayload = {
    addresses: {
      receiver: orderAddresses.receiver,
      cancellationReceiver: orderAddresses.cancellationReceiver,
      callbackContract: orderAddresses.callbackContract,
      uiFeeReceiver: p.uiFeeReceiver ?? zeroAddress,
      market: p.marketAddress,
      initialCollateralToken: tokenTransfersParams.initialCollateralTokenAddress,
      swapPath: tokenTransfersParams.swapPath,
    },
    numbers: {
      sizeDeltaUsd: p.sizeDeltaUsd,
      initialCollateralDeltaAmount: tokenTransfersParams.initialCollateralDeltaAmount,
      triggerPrice,
      acceptablePrice,
      executionFee: p.executionFeeAmount,
      callbackGasLimit: orderAddresses.callbackGasLimit,
      minOutputAmount: applySlippageToMinOut(p.allowedSlippage, tokenTransfersParams.minOutputAmount),
      validFromTime: p.validFromTime ?? 0n,
    },
    orderType: p.orderType,
    decreasePositionSwapType: DecreasePositionSwapType.NoSwap,
    isLong: p.isLong,
    shouldUnwrapNativeToken: tokenTransfersParams.isNativePayment,
    autoCancel: p.autoCancel,
    referralCode: p.referralCode ?? zeroHash,
    orderPositionType: p.orderPositionType,
    dataList: [],
  };

  return {
    params: p,
    orderPayload,
    tokenTransfersParams,
  };
}

export function buildDecreaseOrderPayload(
  p: DecreasePositionOrderParams
): CreateOrderTxnParams<DecreasePositionOrderParams> {
  const internalUsd = p.internalUsd;
  if (internalUsd) {
    validateInternalUsdWrappedToken(internalUsd, p.collateralTokenAddress);
    validateInternalUsdDecreaseOrder({
      internalUsd,
      receiveTokenAddress: p.receiveTokenAddress,
      swapPath: p.swapPath,
      decreasePositionSwapType: p.decreasePositionSwapType,
    });
  }

  const indexToken = getToken(p.chainId, p.indexTokenAddress);
  const tokenTransfersParams = buildTokenTransfersParamsForDecrease({ ...p, internalUsd });

  let acceptablePrice: ContractPrice;
  if (p.acceptablePrice === MaxUint256) {
    acceptablePrice = MaxUint256 as ContractPrice;
  } else {
    acceptablePrice = convertToContractPrice(
      applySlippageToPrice(p.allowedSlippage, p.acceptablePrice, false, p.isLong),
      indexToken.decimals
    );
  }

  let triggerPrice: ContractPrice;
  if (p.triggerPrice === MaxUint256) {
    triggerPrice = MaxUint256 as ContractPrice;
  } else {
    triggerPrice = convertToContractPrice(p.triggerPrice ?? 0n, indexToken.decimals);
  }

  const orderAddresses = internalUsd
    ? getInternalUsdOrderAddresses(p.receiver)
    : {
        receiver: p.receiver,
        cancellationReceiver: zeroAddress,
        callbackContract: zeroAddress,
        callbackGasLimit: 0n,
      };

  const orderPayload: CreateOrderPayload = {
    addresses: {
      receiver: orderAddresses.receiver,
      cancellationReceiver: orderAddresses.cancellationReceiver,
      callbackContract: orderAddresses.callbackContract,
      uiFeeReceiver: p.uiFeeReceiver ?? zeroAddress,
      market: p.marketAddress,
      initialCollateralToken: tokenTransfersParams.initialCollateralTokenAddress,
      swapPath: tokenTransfersParams.swapPath,
    },
    numbers: {
      sizeDeltaUsd: p.sizeDeltaUsd,
      initialCollateralDeltaAmount: tokenTransfersParams.initialCollateralDeltaAmount,
      triggerPrice,
      acceptablePrice,
      executionFee: p.executionFeeAmount,
      callbackGasLimit: orderAddresses.callbackGasLimit,
      minOutputAmount: applySlippageToMinOut(p.allowedSlippage, tokenTransfersParams.minOutputAmount),
      validFromTime: p.validFromTime ?? 0n,
    },
    orderType: p.orderType,
    decreasePositionSwapType: p.decreasePositionSwapType,
    isLong: p.isLong,
    shouldUnwrapNativeToken: tokenTransfersParams.isNativeReceive,
    autoCancel: p.autoCancel,
    referralCode: p.referralCode ?? zeroHash,
    orderPositionType: p.orderPositionType,
    dataList: [],
  };

  return {
    params: p,
    orderPayload,
    tokenTransfersParams,
  };
}

export function buildTwapOrdersPayloads<T extends IncreasePositionOrderParams | DecreasePositionOrderParams>(
  p: T,
  twapParams: TwapOrderParams
): CreateOrderTxnParams<T>[] {
  const uiFeeReceiver = createTwapUiFeeReceiver({ numberOfParts: twapParams.numberOfParts });

  if (isIncreaseOrderType(p.orderType)) {
    return Array.from({ length: twapParams.numberOfParts }, (_, i) => {
      const params = p as IncreasePositionOrderParams;

      const acceptablePrice = params.isLong ? MaxUint256 : 0n;
      const triggerPrice = acceptablePrice;

      return buildIncreaseOrderPayload({
        chainId: params.chainId,
        receiver: params.receiver,
        executionGasLimit: params.executionGasLimit,
        referralCode: params.referralCode,
        autoCancel: params.autoCancel,
        swapPath: params.swapPath,
        externalSwapQuote: undefined,
        marketAddress: params.marketAddress,
        indexTokenAddress: params.indexTokenAddress,
        isLong: params.isLong,
        sizeDeltaUsd: params.sizeDeltaUsd / BigInt(twapParams.numberOfParts),
        sizeDeltaInTokens: params.sizeDeltaInTokens / BigInt(twapParams.numberOfParts),
        payTokenAddress: params.payTokenAddress,
        allowedSlippage: 0,
        payTokenAmount: params.payTokenAmount / BigInt(twapParams.numberOfParts),
        collateralTokenAddress: params.collateralTokenAddress,
        collateralDeltaAmount: params.collateralDeltaAmount / BigInt(twapParams.numberOfParts),
        internalUsd: params.internalUsd,
        executionFeeAmount: params.executionFeeAmount / BigInt(twapParams.numberOfParts),
        validFromTime: getTwapValidFromTime(twapParams.duration, twapParams.numberOfParts, i),
        orderType: OrderType.LimitIncrease,
        acceptablePrice,
        triggerPrice,
        orderPositionType: params.orderPositionType,
        uiFeeReceiver,
      }) as CreateOrderTxnParams<T>;
    });
  }

  return Array.from({ length: twapParams.numberOfParts }, (_, i) => {
    const params = p as DecreasePositionOrderParams;

    const acceptablePrice = !params.isLong ? MaxUint256 : 0n;
    const triggerPrice = acceptablePrice;

    return buildDecreaseOrderPayload({
      chainId: params.chainId,
      receiver: params.receiver,
      executionGasLimit: params.executionGasLimit,
      referralCode: params.referralCode,
      autoCancel: params.autoCancel,
      swapPath: params.swapPath,
      externalSwapQuote: undefined,
      marketAddress: params.marketAddress,
      indexTokenAddress: params.indexTokenAddress,
      isLong: params.isLong,
      collateralTokenAddress: params.collateralTokenAddress,
      collateralDeltaAmount: params.collateralDeltaAmount / BigInt(twapParams.numberOfParts),
      internalUsd: params.internalUsd,
      sizeDeltaUsd: params.sizeDeltaUsd / BigInt(twapParams.numberOfParts),
      sizeDeltaInTokens: params.sizeDeltaInTokens / BigInt(twapParams.numberOfParts),
      executionFeeAmount: params.executionFeeAmount / BigInt(twapParams.numberOfParts),
      validFromTime: getTwapValidFromTime(twapParams.duration, twapParams.numberOfParts, i),
      orderType: OrderType.LimitDecrease,
      acceptablePrice,
      triggerPrice,
      allowedSlippage: 0,
      uiFeeReceiver,
      minOutputUsd: params.minOutputUsd / BigInt(twapParams.numberOfParts),
      receiveTokenAddress: params.receiveTokenAddress,
      decreasePositionSwapType: params.decreasePositionSwapType,
      orderPositionType: params.orderPositionType,
    }) as CreateOrderTxnParams<T>;
  });
}

export function getIsTwapOrderPayload(p: CreateOrderPayload) {
  return p.numbers.validFromTime !== 0n;
}

export function buildUpdateOrderPayload(p: UpdateOrderParams): UpdateOrderTxnParams {
  const indexToken = getToken(p.chainId, p.indexTokenAddress);

  return {
    params: p,
    updatePayload: {
      orderKey: p.orderKey,
      sizeDeltaUsd: p.sizeDeltaUsd,
      triggerPrice: convertToContractPrice(p.triggerPrice, indexToken.decimals),
      acceptablePrice: convertToContractPrice(p.acceptablePrice, indexToken.decimals),
      minOutputAmount: p.minOutputAmount,
      autoCancel: p.autoCancel,
      validFromTime: 0n,
      executionFeeTopUp: p.executionFeeTopUp,
    },
  };
}

export function getBatchTotalExecutionFee({
  batchParams: { createOrderParams, updateOrderParams },
  tokensData,
  chainId,
  wntPrices,
}: {
  batchParams: BatchOrderTxnParams;
  tokensData: TokensData;
  chainId: number;
  wntPrices: TokenPrices;
}): ExecutionFee | undefined {
  let feeTokenAmount = 0n;
  let gasLimit = 0n;

  const wnt = getByKey(tokensData, getWrappedToken(chainId).address);

  if (!wnt) {
    return undefined;
  }

  for (const co of createOrderParams) {
    feeTokenAmount += co.orderPayload.numbers.executionFee;
    gasLimit += co.params.executionGasLimit;
  }

  for (const uo of updateOrderParams) {
    feeTokenAmount += uo.updatePayload.executionFeeTopUp;
  }

  const feeUsd = convertToUsd(feeTokenAmount, wnt.decimals, wntPrices.maxPrice)!;
  const isFeeHigh = feeUsd > expandDecimals(getHighExecutionFee(chainId), USD_DECIMALS);
  const isFeeVeryHigh = feeUsd > expandDecimals(getExcessiveExecutionFee(chainId), USD_DECIMALS);

  return {
    feeTokenAmount,
    gasLimit,
    feeUsd,
    feeToken: wnt,
    isFeeHigh,
    isFeeVeryHigh,
  };
}

export function getBatchTotalPayCollateralAmount(batchParams: BatchOrderTxnParams) {
  const payAmounts: { [tokenAddress: string]: bigint } = {};

  for (const co of batchParams.createOrderParams) {
    const payTokenAddress = co.tokenTransfersParams?.payTokenAddress;
    const payTokenAmount = co.tokenTransfersParams?.payTokenAmount;

    if (payTokenAddress && payTokenAmount) {
      payAmounts[payTokenAddress] = (payAmounts[payTokenAddress] ?? 0n) + payTokenAmount;
    }
  }

  return payAmounts;
}

export function getBatchExternalSwapGasLimit(batchParams: BatchOrderTxnParams) {
  return batchParams.createOrderParams.reduce((acc, co) => {
    const externalSwapQuote = (co.params as IncreasePositionOrderParams).externalSwapQuote;

    if (externalSwapQuote) {
      return acc + externalSwapQuote.txnData.estimatedGas;
    }

    return acc;
  }, 0n);
}

export function buildTokenTransfersParamsForDecrease({
  chainId,
  executionFeeAmount,
  collateralTokenAddress,
  collateralDeltaAmount,
  internalUsd,
  swapPath,
  minOutputUsd,
  receiveTokenAddress,
}: {
  chainId: ContractsChainId;
  executionFeeAmount: bigint;
  collateralTokenAddress: string;
  collateralDeltaAmount: bigint;
  internalUsd?: InternalUsdParams;
  receiveTokenAddress: string;
  swapPath: string[];
  minOutputUsd: bigint;
}): TokenTransfersParams {
  const orderVaultAddress = getContract(chainId, "OrderVault");
  if (internalUsd) {
    validateInternalUsdWrappedToken(internalUsd, collateralTokenAddress);
  }

  const initialCollateralTokenAddress = internalUsd
    ? (internalUsd.wrappedTokenAddress as ERC20Address)
    : convertTokenAddress(chainId, collateralTokenAddress, "wrapped");
  const { tokenTransfers, value } = combineTransfers([
    {
      tokenAddress: NATIVE_TOKEN_ADDRESS,
      destination: orderVaultAddress,
      amount: executionFeeAmount,
    },
  ]);

  return {
    isNativePayment: false,
    isNativeReceive: receiveTokenAddress === NATIVE_TOKEN_ADDRESS,
    initialCollateralTokenAddress,
    initialCollateralDeltaAmount: collateralDeltaAmount,
    tokenTransfers,
    payTokenAddress: zeroAddress,
    payTokenAmount: 0n,
    minOutputAmount: minOutputUsd,
    swapPath,
    value,
    externalCalls: undefined,
  };
}

export function buildTokenTransfersParamsForIncrease({
  chainId,
  receiver,
  payTokenAddress,
  payTokenAmount,
  receiveTokenAddress,
  executionFeeAmount,
  externalSwapQuote,
  internalUsd,
  minOutputAmount,
  swapPath,
}: {
  chainId: ContractsChainId;
  receiver: string;
  payTokenAddress: string;
  payTokenAmount: bigint;
  receiveTokenAddress: string | undefined;
  executionFeeAmount: bigint;
  externalSwapQuote: ExternalSwapQuote | undefined;
  internalUsd?: InternalUsdParams;
  minOutputAmount: bigint;
  swapPath: string[];
}): TokenTransfersParams {
  const isNativePayment = payTokenAddress === NATIVE_TOKEN_ADDRESS;
  const isNativeReceive = receiveTokenAddress === NATIVE_TOKEN_ADDRESS;
  const orderVaultAddress = getContract(chainId, "OrderVault");
  const externalHandlerAddress = getContract(chainId, "ExternalHandler");
  const shouldMintInternalUsdDirectly = Boolean(internalUsd && !externalSwapQuote && payTokenAmount > 0n);

  if (externalSwapQuote) {
    const payToken = convertTokenAddress(chainId, payTokenAddress, "wrapped");
    const quoteInputToken = convertTokenAddress(chainId, externalSwapQuote.inTokenAddress, "wrapped");

    if (quoteInputToken.toLowerCase() !== payToken.toLowerCase()) {
      throw new Error("External swap input token must match the payment token");
    }
    if (externalSwapQuote.amountIn !== payTokenAmount) {
      throw new Error("External swap input amount must match the payment amount");
    }
    if (externalSwapQuote.amountIn <= 0n || externalSwapQuote.amountOut <= 0n) {
      throw new Error("External swap quote amounts must be positive");
    }
    if (externalSwapQuote.txnData.value !== 0n) {
      throw new Error("External swap calls cannot forward native value");
    }
  }

  const { tokenTransfers, value } = combineTransfers([
    {
      tokenAddress: NATIVE_TOKEN_ADDRESS,
      destination: orderVaultAddress,
      amount: executionFeeAmount,
    },
    {
      tokenAddress: payTokenAddress,
      destination: externalSwapQuote
        ? externalHandlerAddress
        : shouldMintInternalUsdDirectly
          ? internalUsd!.bankAddress
          : orderVaultAddress,
      amount: payTokenAmount,
    },
  ]);

  let finalPayTokenAmount = payTokenAmount;
  let initialCollateralTokenAddress = convertTokenAddress(chainId, payTokenAddress, "wrapped");
  let initialCollateralDeltaAmount = payTokenAmount;
  let externalCalls: ExternalCallsPayload | undefined;
  let additionalExternalCalls: ExternalCallsPayload[] | undefined;

  if (internalUsd && externalSwapQuote) {
    if (!internalUsd.underlyingTokenAddress) {
      throw new Error("Internal USD underlying token is required for external swaps");
    }

    const externalSwapOutputToken = convertTokenAddress(chainId, externalSwapQuote.outTokenAddress, "wrapped");
    if (externalSwapOutputToken.toLowerCase() !== internalUsd.underlyingTokenAddress.toLowerCase()) {
      throw new Error("External swap output token must match the internal USD underlying token");
    }

    initialCollateralTokenAddress = internalUsd.wrappedTokenAddress as ERC20Address;
    initialCollateralDeltaAmount = 0n;
    externalCalls = getExternalCallsPayload({
      chainId,
      account: receiver,
      quote: externalSwapQuote,
      refundReceiverOverrides: {
        [externalSwapOutputToken]: internalUsd.bankAddress,
      },
    });
    additionalExternalCalls = [
      buildInternalUsdMintExternalCalls({
        chainId,
        payTokenAddress: internalUsd.underlyingTokenAddress,
        payTokenAmount: externalSwapQuote.amountOut,
        internalUsd,
        mintReceiver: orderVaultAddress,
      }),
    ];
    finalPayTokenAmount = externalSwapQuote.amountIn;
  } else if (internalUsd) {
    initialCollateralTokenAddress = internalUsd.wrappedTokenAddress as ERC20Address;
    externalCalls = shouldMintInternalUsdDirectly
      ? buildInternalUsdMintExternalCalls({
          chainId,
          payTokenAddress,
          payTokenAmount,
          internalUsd,
          mintReceiver: orderVaultAddress,
        })
      : undefined;
  } else if (externalSwapQuote) {
    initialCollateralTokenAddress = convertTokenAddress(chainId, externalSwapQuote.outTokenAddress, "wrapped");
    initialCollateralDeltaAmount = 0n;
    externalCalls = getExternalCallsPayload({
      chainId,
      account: receiver,
      quote: externalSwapQuote,
    });
    finalPayTokenAmount = externalSwapQuote.amountIn;
  }

  return {
    isNativePayment,
    isNativeReceive,
    initialCollateralTokenAddress,
    initialCollateralDeltaAmount,
    tokenTransfers,
    payTokenAddress,
    payTokenAmount: finalPayTokenAmount,
    minOutputAmount,
    swapPath,
    value,
    externalCalls,
    ...(additionalExternalCalls ? { additionalExternalCalls } : {}),
  };
}

export function getBatchExternalCalls(batchParams: BatchOrderTxnParams): ExternalCallsPayload {
  const externalCalls: ExternalCallsPayload[] = [];

  for (const createOrderParams of batchParams.createOrderParams) {
    if (createOrderParams.tokenTransfersParams?.additionalExternalCalls?.length) {
      throw new Error("Staged external calls must be encoded per order with buildCreateOrderMulticall");
    }

    if (createOrderParams.tokenTransfersParams?.externalCalls) {
      externalCalls.push(createOrderParams.tokenTransfersParams.externalCalls);
    }
  }

  return combineExternalCalls(externalCalls);
}

export function combineExternalCalls(externalCalls: ExternalCallsPayload[]): ExternalCallsPayload {
  const sendTokensMap: { [tokenAddress: string]: bigint } = {};
  const refundTokensMap: { [tokenAddress: string]: string } = {};
  const externalCallTargets: string[] = [];
  const externalCallDataList: string[] = [];

  for (const call of externalCalls) {
    for (const [index, tokenAddress] of call.sendTokens.entries()) {
      sendTokensMap[tokenAddress] = (sendTokensMap[tokenAddress] ?? 0n) + call.sendAmounts[index];
    }

    for (const [index, tokenAddress] of call.refundTokens.entries()) {
      refundTokensMap[tokenAddress] = call.refundReceivers[index];
    }

    externalCallTargets.push(...call.externalCallTargets);
    externalCallDataList.push(...call.externalCallDataList);
  }

  return {
    sendTokens: Object.keys(sendTokensMap) as ERC20Address[],
    sendAmounts: Object.values(sendTokensMap),
    externalCallTargets,
    externalCallDataList,
    refundReceivers: Object.values(refundTokensMap),
    refundTokens: Object.keys(refundTokensMap),
  };
}

export function getEmptyExternalCallsPayload(): ExternalCallsPayload {
  return {
    sendTokens: [],
    sendAmounts: [],
    externalCallTargets: [],
    externalCallDataList: [],
    refundReceivers: [],
    refundTokens: [],
  };
}

export function getExternalCallsPayload({
  chainId,
  account,
  quote,
  refundReceiverOverrides,
}: {
  chainId: number;
  account: string;
  quote: ExternalSwapQuote;
  refundReceiverOverrides?: Record<string, string>;
}): ExternalCallsPayload {
  const inTokenAddress = convertTokenAddress(chainId, quote.inTokenAddress, "wrapped");
  const outTokenAddress = convertTokenAddress(chainId, quote.outTokenAddress, "wrapped");
  const wntAddress = getWrappedToken(chainId).address;

  const refundTokens = uniq([inTokenAddress, outTokenAddress, wntAddress]);
  const normalizedRefundReceiverOverrides = Object.fromEntries(
    Object.entries(refundReceiverOverrides ?? {}).map(([token, receiver]) => [token.toLowerCase(), receiver])
  );

  const payload: ExternalCallsPayload = {
    sendTokens: [inTokenAddress],
    sendAmounts: [quote.amountIn],
    externalCallTargets: [],
    externalCallDataList: [],
    refundTokens,
    refundReceivers: refundTokens.map((token) => normalizedRefundReceiverOverrides[token.toLowerCase()] ?? account),
  };

  if (quote.needSpenderApproval) {
    payload.externalCallTargets.push(inTokenAddress);
    payload.externalCallDataList.push(
      encodeFunctionData({
        abi: ERC20ABI,
        functionName: "approve",
        args: [quote.txnData.to as `0x${string}`, MaxUint256],
      })
    );
  }

  payload.externalCallTargets.push(quote.txnData.to);
  payload.externalCallDataList.push(quote.txnData.data);

  return payload;
}

function combineTransfers(tokenTransfers: TokenTransfer[]) {
  const transfersMap: { [key: string]: TokenTransfer } = {};
  let value = 0n;

  for (const transfer of tokenTransfers) {
    const key = `${transfer.tokenAddress}:${transfer.destination}`;

    if (!transfersMap[key]) {
      transfersMap[key] = { ...transfer };
    } else {
      transfersMap[key].amount += transfer.amount;
    }

    if (transfer.tokenAddress === NATIVE_TOKEN_ADDRESS) {
      value += transfer.amount;
    }
  }

  return { tokenTransfers: Object.values(transfersMap), value };
}

export function getBatchOrderMulticallPayload({ params }: { params: BatchOrderTxnParams }) {
  const { createOrderParams, updateOrderParams, cancelOrderParams } = params;

  const multicall: ExchangeRouterCall[] = [];
  let value = 0n;

  for (const params of createOrderParams) {
    const { multicall: createMulticall, value: createValue } = buildCreateOrderMulticall(params);
    multicall.push(...createMulticall);
    value += createValue;
  }

  for (const update of updateOrderParams) {
    const { multicall: updateMulticall, value: updateValue } = buildUpdateOrderMulticall(update);
    multicall.push(...updateMulticall);
    value += updateValue;
  }

  for (const cancel of cancelOrderParams) {
    const { multicall: cancelMulticall, value: cancelValue } = buildCancelOrderMulticall({ params: cancel });
    multicall.push(...cancelMulticall);
    value += cancelValue;
  }

  const { encodedMulticall, callData } = encodeExchangeRouterMulticall(multicall);

  return { multicall, value, encodedMulticall, callData };
}

export function buildCreateOrderMulticall(params: CreateOrderTxnParams<any>) {
  const { tokenTransfersParams, orderPayload } = params;
  const {
    tokenTransfers = [],
    value = 0n,
    externalCalls = undefined,
    additionalExternalCalls = [],
  } = tokenTransfersParams ?? {};

  const multicall: ExchangeRouterCall[] = [];

  for (const transfer of tokenTransfers) {
    if (transfer.tokenAddress === NATIVE_TOKEN_ADDRESS) {
      multicall.push({ method: "sendWnt", params: [transfer.destination, transfer.amount] });
    } else {
      multicall.push({ method: "sendTokens", params: [transfer.tokenAddress, transfer.destination, transfer.amount] });
    }
  }

  for (const externalCall of [externalCalls, ...additionalExternalCalls]) {
    if (!externalCall) continue;

    multicall.push({
      method: "makeExternalCalls",
      params: [
        externalCall.externalCallTargets,
        externalCall.externalCallDataList,
        externalCall.refundTokens,
        externalCall.refundReceivers,
      ],
    });
  }

  multicall.push({
    method: "createOrder",
    params: [orderPayload],
  });

  return {
    multicall,
    value,
  };
}

export function buildUpdateOrderMulticall(updateTxn: UpdateOrderTxnParams) {
  const { updatePayload, params: updateParams } = updateTxn;
  const { chainId } = updateParams;
  const orderVaultAddress = getContract(chainId, "OrderVault");

  const multicall: ExchangeRouterCall[] = [];

  if (updatePayload.executionFeeTopUp > 0n) {
    multicall.push({ method: "sendWnt", params: [orderVaultAddress, updatePayload.executionFeeTopUp] });
  }

  multicall.push({
    method: "updateOrder",
    params: [
      updatePayload.orderKey,
      updatePayload.sizeDeltaUsd,
      updatePayload.acceptablePrice,
      updatePayload.triggerPrice,
      updatePayload.minOutputAmount,
      0n,
      updatePayload.autoCancel,
    ],
  });

  return {
    multicall,
    value: updatePayload.executionFeeTopUp,
  };
}

export function buildCancelOrderMulticall({ params }: { params: CancelOrderTxnParams }) {
  const { orderKey } = params;

  const multicall: ExchangeRouterCall[] = [];

  multicall.push({
    method: "cancelOrder",
    params: [orderKey],
  });

  return {
    multicall,
    value: 0n,
  };
}

export function encodeExchangeRouterMulticall(multicall: ExchangeRouterCall[]) {
  const encodedMulticall = multicall.map((call) =>
    encodeFunctionData({
      abi: abis.ExchangeRouter,
      functionName: call.method as any,
      args: call.params as any,
    })
  );

  const callData = encodeFunctionData({
    abi: ExchangeRouterAbi,
    functionName: "multicall",
    args: [encodedMulticall],
  });

  return {
    encodedMulticall,
    callData,
  };
}

export function getBatchRequiredActions(orderParams: BatchOrderTxnParams | undefined) {
  if (!orderParams) {
    return 0;
  }

  return (
    orderParams.createOrderParams.length + orderParams.updateOrderParams.length + orderParams.cancelOrderParams.length
  );
}

export function getBatchSwapsCount(orderParams: BatchOrderTxnParams | undefined) {
  if (!orderParams) {
    return 0;
  }

  return orderParams.createOrderParams.reduce((acc, co) => {
    return acc + co.orderPayload.addresses.swapPath.length;
  }, 0);
}

export function getIsEmptyBatch(orderParams: BatchOrderTxnParams | undefined) {
  if (!orderParams) {
    return true;
  }

  if (getBatchRequiredActions(orderParams) === 0) {
    return true;
  }

  const hasEmptyOrder = orderParams.createOrderParams.some(
    (o) => o.orderPayload.numbers.sizeDeltaUsd === 0n && o.orderPayload.numbers.initialCollateralDeltaAmount === 0n
  );

  return hasEmptyOrder;
}

export function getBatchIsNativePayment(orderParams: BatchOrderTxnParams) {
  return orderParams.createOrderParams.some((o) => o.tokenTransfersParams?.isNativePayment);
}

export function getIsInvalidBatchReceiver(batchParams: BatchOrderTxnParams, signerAddress: string) {
  return batchParams.createOrderParams.some((co) => co.orderPayload.addresses.receiver !== signerAddress);
}
