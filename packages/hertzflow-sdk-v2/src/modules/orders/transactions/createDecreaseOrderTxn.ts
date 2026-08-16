import { Abi, encodeFunctionData, zeroAddress, zeroHash } from "viem";

import { abis } from "abis";
import { getContract } from "configs/contracts";
import { convertTokenAddress, NATIVE_TOKEN_ADDRESS } from "configs/tokens";
import type { DecreasePositionSwapType, OrderPositionType, OrderType } from "types/orders";
import type { Token, TokensData } from "types/tokens";
import { isMarketOrderType } from "utils/orders";
import { simulateExecuteOrder } from "utils/simulateExecuteOrder";
import {
  getInternalUsdOrderAddresses,
  validateInternalUsdDecreaseOrder,
  validateInternalUsdWrappedToken,
  type InternalUsdParams,
} from "utils/internalUsd";
import { convertToContractPrice } from "utils/tokens";
import { applySlippageToMinOut, applySlippageToPrice } from "utils/trade";

import type { PriceOverrides } from "./createIncreaseOrderTxn";
import type { HertzFlowSDK } from "../../../index";
import { buildUpdateOrderTxn, UpdateOrderParams } from "./updateOrderTxn";

export type DecreaseOrderParams = {
  account: string;
  marketAddress: string;
  initialCollateralAddress: string;
  initialCollateralDeltaAmount: bigint;
  swapPath: string[];
  receiveTokenAddress: string;
  sizeDeltaUsd: bigint;
  acceptablePrice: bigint;
  triggerPrice: bigint | undefined;
  minOutputUsd: bigint;
  isLong: boolean;
  decreasePositionSwapType: DecreasePositionSwapType;
  orderPositionType: OrderPositionType;
  orderType: OrderType.MarketDecrease | OrderType.LimitDecrease | OrderType.StopLossDecrease;
  executionFee: bigint;
  allowedSlippage: number;
  skipSimulation?: boolean;
  referralCode?: string;
  indexToken: Token;
  tokensData: TokensData;
  autoCancel: boolean;
  dataList?: string[];
  internalUsd?: InternalUsdParams;
};

export async function createDecreaseOrderTxn(
  sdk: HertzFlowSDK,
  params: { decreaseOrderParams: DecreaseOrderParams[]; updateOrderParams?: UpdateOrderParams[] }
) {
  const chainId = sdk.chainId;
  const { decreaseOrderParams, updateOrderParams } = params;
  const ps = decreaseOrderParams;
  const orderVaultAddress = getContract(chainId, "OrderVault");
  const totalWntAmount = ps.reduce((acc, p) => acc + p.executionFee, 0n);

  const encodedPayload = createDecreaseEncodedPayload({
    sdk,
    orderVaultAddress,
    ps,
  });

  const updateEncodedPayload =
    updateOrderParams?.reduce<string[]>((acc, cur) => {
      return [...acc, ...buildUpdateOrderTxn(sdk, cur)];
    }, []) ?? [];

  const simulationEncodedPayload = createDecreaseEncodedPayload({
    sdk,
    orderVaultAddress,
    ps,
  });

  await Promise.all(
    ps.map(async (p) => {
      if (!p.skipSimulation) {
        const primaryPriceOverrides: PriceOverrides = {};
        if (p.triggerPrice != undefined) {
          primaryPriceOverrides[p.indexToken.address] = {
            minPrice: p.triggerPrice,
            maxPrice: p.triggerPrice,
          };
        }
        await simulateExecuteOrder(sdk, {
          primaryPriceOverrides,
          createMulticallPayload: simulationEncodedPayload,
          value: totalWntAmount,
          tokensData: p.tokensData,
        });
      }
    })
  );

  const routerAddress = getContract(chainId, "ExchangeRouter");

  return await sdk.callContract(
    routerAddress,
    abis.ExchangeRouter as Abi,
    "multicall",
    [[...encodedPayload, ...updateEncodedPayload]],
    {
      value: totalWntAmount,
    }
  );
}

export function createDecreaseEncodedPayload({
  sdk,
  orderVaultAddress,
  ps,
}: {
  sdk: HertzFlowSDK;
  orderVaultAddress: string;
  ps: DecreaseOrderParams[];
}) {
  const multicall = [
    ...ps.flatMap((p) => {
      if (p.internalUsd) {
        validateInternalUsdWrappedToken(p.internalUsd, p.initialCollateralAddress);
        validateInternalUsdDecreaseOrder({
          internalUsd: p.internalUsd,
          receiveTokenAddress: p.receiveTokenAddress,
          swapPath: p.swapPath,
          decreasePositionSwapType: p.decreasePositionSwapType,
        });
      }
      const initialCollateralTokenAddress = p.internalUsd
        ? p.internalUsd.wrappedTokenAddress
        : convertTokenAddress(sdk.chainId, p.initialCollateralAddress, "wrapped");

      const shouldApplySlippage = isMarketOrderType(p.orderType);

      const acceptablePrice = shouldApplySlippage
        ? applySlippageToPrice(p.allowedSlippage, p.acceptablePrice, false, p.isLong)
        : p.acceptablePrice;

      const minOutputAmount = shouldApplySlippage
        ? applySlippageToMinOut(p.allowedSlippage, p.minOutputUsd)
        : p.minOutputUsd;
      const orderAddresses = p.internalUsd
        ? getInternalUsdOrderAddresses(p.account)
        : {
            receiver: p.account,
            cancellationReceiver: zeroAddress,
            callbackContract: zeroAddress,
            callbackGasLimit: 0n,
          };

      const orderParams = {
        addresses: {
          cancellationReceiver: orderAddresses.cancellationReceiver,
          receiver: orderAddresses.receiver,
          initialCollateralToken: initialCollateralTokenAddress,
          callbackContract: orderAddresses.callbackContract,
          market: p.marketAddress,
          swapPath: p.swapPath,
          uiFeeReceiver: sdk.config.settings?.uiFeeReceiverAccount || zeroAddress,
        },
        numbers: {
          sizeDeltaUsd: p.sizeDeltaUsd,
          initialCollateralDeltaAmount: p.initialCollateralDeltaAmount,
          triggerPrice: convertToContractPrice(p.triggerPrice ?? 0n, p.indexToken.decimals),
          acceptablePrice: convertToContractPrice(acceptablePrice, p.indexToken.decimals),
          executionFee: p.executionFee,
          callbackGasLimit: orderAddresses.callbackGasLimit,
          minOutputAmount,
          validFromTime: 0n,
        },
        orderType: p.orderType,
        decreasePositionSwapType: p.decreasePositionSwapType,
        isLong: p.isLong,
        shouldUnwrapNativeToken: p.receiveTokenAddress === NATIVE_TOKEN_ADDRESS,
        autoCancel: p.autoCancel,
        referralCode: p.referralCode || zeroHash,
        orderPositionType: p.orderPositionType,
        dataList: p.dataList ?? [],
      };

      return [
        { method: "sendWnt", params: [orderVaultAddress, p.executionFee] },
        {
          method: "createOrder",
          params: [orderParams],
        },
      ];
    }),
  ];

  return multicall.filter(Boolean).map((call) =>
    encodeFunctionData({
      abi: abis.ExchangeRouter as Abi,
      functionName: call!.method,
      args: call!.params,
    })
  );
}
