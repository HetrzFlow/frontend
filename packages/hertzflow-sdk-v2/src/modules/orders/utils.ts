import { Address, isAddressEqual } from "viem";

import type { ContractsChainId } from "configs/chains";
import { getContract } from "configs/contracts";
import { accountOrderListKey } from "configs/dataStore";
import { getWrappedToken } from "configs/tokens";
import type { GasLimitsConfig } from "types/fees";
import type { MarketsInfoData } from "types/markets";
import { DecreasePositionSwapType, Order, OrderTxnType, OrderType } from "types/orders";
import type { TokenPrices, TokensData } from "types/tokens";
import { estimateOrderOraclePriceCount } from "utils/fees/estimateOraclePriceCount";
import { estimateExecuteDecreaseOrderGasLimit, getExecutionFee } from "utils/fees/executionFee";
import type { MulticallRequestConfig, MulticallResult } from "utils/multicall";
import { isIncreaseOrderType, isLimitOrderType, isTriggerDecreaseOrderType } from "utils/orders";
import { getSwapPathOutputAddresses } from "utils/swap/swapStats";

import type { HertzFlowSDK } from "../../index";

type MarketFilterLongShortDirection = "long" | "short" | "any";

type MarketFilterLongShortItemData = {
  marketAddress: Address | "any";
  direction: MarketFilterLongShortDirection;
  collateralAddress?: Address;
};

export const getOrderExecutionFee = (
  sdk: HertzFlowSDK,
  swapsCount: number,
  decreasePositionSwapType: DecreasePositionSwapType | undefined,
  gasLimits: GasLimitsConfig | undefined,
  tokensData: TokensData | undefined,
  nativeTokenPrices: TokenPrices,
  gasPrice: bigint | undefined,
  callbackGasLimit: bigint
) => {
  if (!gasLimits || !tokensData || gasPrice === undefined) return;

  const estimatedGas = estimateExecuteDecreaseOrderGasLimit(gasLimits, {
    decreaseSwapType: decreasePositionSwapType,
    swapsCount: swapsCount ?? 0,
    callbackGasLimit,
  });

  const oraclePriceCount = estimateOrderOraclePriceCount(swapsCount);

  return getExecutionFee(
    sdk.chainId,
    gasLimits,
    nativeTokenPrices,
    tokensData,
    estimatedGas,
    gasPrice,
    oraclePriceCount
  );
};

export const getExecutionFeeAmountForEntry = (
  sdk: HertzFlowSDK,
  entry: {
    txnType?: OrderTxnType;
    executionFee?: bigint;
    decreaseSwapType: DecreasePositionSwapType;
    callbackGasLimit: bigint;
  },
  gasLimits: GasLimitsConfig | undefined,
  tokensData: TokensData,
  nativeTokenPrices: TokenPrices,
  gasPrice: bigint | undefined
) => {
  if (!entry.txnType || entry.txnType === "cancel") return undefined;
  const securedExecutionFee = entry.executionFee ?? 0n;

  let swapsCount = 0;

  const executionFee = getOrderExecutionFee(
    sdk,
    swapsCount,
    entry.decreaseSwapType,
    gasLimits,
    tokensData,
    nativeTokenPrices,
    gasPrice,
    entry.callbackGasLimit
  );

  if (!executionFee || securedExecutionFee >= executionFee.feeTokenAmount) return undefined;

  return executionFee.feeTokenAmount - securedExecutionFee;
};

export function matchByMarket({
  order,
  nonSwapRelevantDefinedFiltersLowercased,
  hasNonSwapRelevantDefinedMarkets,
  pureDirectionFilters,
  hasPureDirectionFilters,
  marketsInfoData,
  chainId,
}: {
  order: ReturnType<typeof parseGetOrdersResponse>["orders"][number];
  nonSwapRelevantDefinedFiltersLowercased: MarketFilterLongShortItemData[];
  hasNonSwapRelevantDefinedMarkets: boolean;
  pureDirectionFilters: MarketFilterLongShortDirection[];
  hasPureDirectionFilters: boolean;
  marketsInfoData?: MarketsInfoData;
  chainId: number;
}) {
  if (!hasNonSwapRelevantDefinedMarkets && !hasPureDirectionFilters) {
    return true;
  }

  const matchesPureDirectionFilter =
    hasPureDirectionFilters && pureDirectionFilters.includes(order.isLong ? "long" : "short");

  if (hasPureDirectionFilters && !matchesPureDirectionFilter) {
    return false;
  }

  if (!hasNonSwapRelevantDefinedMarkets) {
    return true;
  }

  return nonSwapRelevantDefinedFiltersLowercased.some((filter) => {
    const marketMatch = filter.marketAddress === "any" || filter.marketAddress === order.marketAddress.toLowerCase();
    const directionMath = filter.direction === "any" || filter.direction === (order.isLong ? "long" : "short");
    const initialCollateralAddress = order.initialCollateralTokenAddress.toLowerCase();

    let collateralMatch = true;
    if (!filter.collateralAddress) {
      collateralMatch = true;
    } else if (isLimitOrderType(order.orderType)) {
      const wrappedToken = getWrappedToken(chainId);

      if (!marketsInfoData) {
        collateralMatch = true;
      } else {
        const { outTokenAddress } = getSwapPathOutputAddresses({
          marketsInfoData,
          initialCollateralAddress,
          isIncrease: isIncreaseOrderType(order.orderType),
          shouldUnwrapNativeToken: order.shouldUnwrapNativeToken,
          swapPath: order.swapPath,
          wrappedNativeTokenAddress: wrappedToken.address,
        });

        collateralMatch =
          outTokenAddress !== undefined && isAddressEqual(outTokenAddress as Address, filter.collateralAddress);
      }
    } else if (isTriggerDecreaseOrderType(order.orderType)) {
      collateralMatch = isAddressEqual(order.initialCollateralTokenAddress as Address, filter.collateralAddress);
    }

    return marketMatch && directionMath && collateralMatch;
  });
}

export const DEFAULT_COUNT = 1000;

export function buildGetOrdersMulticall(chainId: ContractsChainId, account: string) {
  return {
    dataStore: {
      contractAddress: getContract(chainId, "DataStore"),
      abiId: "DataStore",
      calls: {
        count: {
          methodName: "getBytes32Count",
          params: [accountOrderListKey(account!)],
        },
        keys: {
          methodName: "getBytes32ValuesAt",
          params: [accountOrderListKey(account!), 0, DEFAULT_COUNT],
        },
      },
    },
    reader: {
      contractAddress: getContract(chainId, "SyntheticsReader"),
      abiId: "SyntheticsReader",
      calls: {
        orders: {
          methodName: "getAccountOrders",
          params: [getContract(chainId, "DataStore"), account, 0, DEFAULT_COUNT],
        },
      },
    },
  } satisfies MulticallRequestConfig<any>;
}

export function parseGetOrdersResponse(res: MulticallResult<ReturnType<typeof buildGetOrdersMulticall>>) {
  const count = Number(res.data.dataStore.count.returnValues[0]);
  const orderKeys = res.data.dataStore.keys.returnValues;
  const orders = res.data.reader.orders.returnValues as {
    orderKey: string;
    order: {
      addresses: {
        account: string;
        receiver: string;
        cancellationReceiver: string;
        callbackContract: string;
        uiFeeReceiver: string;
        market: string;
        initialCollateralToken: string;
        swapPath: string[];
      };
      numbers: {
        orderType: bigint;
        decreasePositionSwapType: bigint;
        sizeDeltaUsd: bigint;
        initialCollateralDeltaAmount: bigint;
        triggerPrice: bigint;
        acceptablePrice: bigint;
        executionFee: bigint;
        callbackGasLimit: bigint;
        minOutputAmount: bigint;
        updatedAtTime: bigint;
        validFromTime: bigint;
        srcChainId: bigint;
      };
      flags: {
        isLong: boolean;
        shouldUnwrapNativeToken: boolean;
        isFrozen: boolean;
        autoCancel: boolean;
        isZFP?: boolean;
      };
      _dataList: string[];
    };
  }[];

  return {
    count,
    orders: orders.map(({ order }, i) => {
      const key = orderKeys[i];

      const orderData: Order = {
        key,
        account: order.addresses.account as Address,
        receiver: order.addresses.receiver as Address,
        callbackContract: order.addresses.callbackContract as Address,
        marketAddress: order.addresses.market as Address,
        initialCollateralTokenAddress: order.addresses.initialCollateralToken as Address,
        swapPath: order.addresses.swapPath as Address[],
        sizeDeltaUsd: BigInt(order.numbers.sizeDeltaUsd),
        initialCollateralDeltaAmount: BigInt(order.numbers.initialCollateralDeltaAmount),
        contractTriggerPrice: BigInt(order.numbers.triggerPrice),
        contractAcceptablePrice: BigInt(order.numbers.acceptablePrice),
        executionFee: BigInt(order.numbers.executionFee),
        callbackGasLimit: BigInt(order.numbers.callbackGasLimit),
        minOutputAmount: BigInt(order.numbers.minOutputAmount),
        updatedAtTime: BigInt(order.numbers.updatedAtTime),
        isLong: order.flags.isLong as boolean,
        shouldUnwrapNativeToken: order.flags.shouldUnwrapNativeToken as boolean,
        isFrozen: order.flags.isFrozen as boolean,
        isZFP: (order.flags.isZFP as boolean) ?? false,
        orderType: Number(order.numbers.orderType) as OrderType,
        decreasePositionSwapType: Number(order.numbers.decreasePositionSwapType) as DecreasePositionSwapType,
        autoCancel: order.flags.autoCancel as boolean,
        uiFeeReceiver: order.addresses.uiFeeReceiver as Address,
        validFromTime: BigInt(order.numbers.validFromTime),
        data: order._dataList,
      };

      return orderData;
    }),
  };
}
