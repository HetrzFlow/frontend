import { OrderType } from '@hertzflow/sdk-v2/types/orders';
import { isMarketOrderType } from '@hertzflow/sdk-v2/utils/orders';

import { calc } from '@repo/lib/calc';
import {
  CONTRACT_USD_MULTIPLIER,
  Position,
  refetchOrders,
  refetchPositions,
  useHzSdk,
  useInstStore,
} from '@/common';
import {
  useOrderCancelledEvent,
  useOrderCreatedEvent,
  useOrderExecutedEvent,
} from '@/hooks/useContractEvents';
import { getPositionModeKey } from '@/lib/trade/position';

import { useOrdersStore } from '../store';

// handle create order event
export const useHandleCreateOrderEvent = () => {
  const coins = useInstStore((state) => state.getCoins());
  const openingPositions = useOrdersStore((state) => state.openingPositions);
  const setOrdersStore = useOrdersStore((state) => state.setState);

  const hzSdk = useHzSdk();
  useOrderCreatedEvent((logs) => {
    let shouldRefetchOrders = false;
    const openingPos: Position[] = [];

    logs.forEach((log) => {
      const eventData = log.parsedData.args.eventData;

      const addressItems = Object.fromEntries(
        eventData.addressItems.items.map((v) => [v.key, v.value]),
      );
      // const addressArrayItems = Object.fromEntries(
      //   eventData.addressItems.arrayItems.map((v) => [v.key, v.value]),
      // );
      const uintItems = Object.fromEntries(
        eventData.uintItems.items.map((v) => [v.key, v.value]),
      );

      if (addressItems.account !== hzSdk?.account) {
        return;
      }
      const orderType = Number(uintItems.orderType);

      if (!isMarketOrderType(orderType)) {
        shouldRefetchOrders = true;
        return;
      }

      if (orderType === OrderType.MarketIncrease) {
        const boolItems = Object.fromEntries(
          eventData.boolItems.items.map((v) => [v.key, v.value]),
        );
        const bytes32Items = Object.fromEntries(
          eventData.bytes32Items.items.map((v) => [v.key, v.value]),
        );

        const collateralToken = coins[addressItems.initialCollateralToken!];

        openingPos.push({
          key: bytes32Items.key!,
          contractKey: '',
          account: addressItems.account!,
          marketAddress: addressItems.market!,
          collateralTokenAddress: addressItems.initialCollateralToken!,
          sizeInTokens: 0n,
          increasedAtTime: 0n,
          decreasedAtTime: 0n,
          isLong: boolItems.isLong!,
          claimableLongTokenAmount: 0n,
          claimableShortTokenAmount: 0n,
          isOpening: true,
          pnl: 0n,
          positionFeeAmount: 0n,
          traderDiscountAmount: 0n,
          uiFeeAmount: 0n,
          data: '',
          id: addressItems.key!,
          sizeInUsd: calc(uintItems.sizeDeltaUsd!.toString())
            .div(CONTRACT_USD_MULTIPLIER)
            .toFixed() as never,
          entryPrice: '' as never,
          collateralAmount: (collateralToken
            ? calc(uintItems.initialCollateralDeltaAmount!.toString())
                .div(calc(10).pow(collateralToken.decimals))
                .toFixed()
            : '') as never,
          pendingBorrowingFeesUsd: '0' as never,
          pendingImpactAmount: '0' as never,
          fundingFeeAmount: '0' as never,
          isZFP: boolItems.isZFP!,
          pendingLossRebateUsd: '0' as never,
        });
      }
    });
    if (shouldRefetchOrders) {
      refetchOrders(hzSdk!.account as string, hzSdk!.chainId);
    }
    if (openingPos.length) {
      setOrdersStore({
        openingPositions: [...openingPositions, ...openingPos],
      });
    }
  });
};

// handle order executed event
export const useHandleOrderExecutedEvent = () => {
  const openingPositions = useOrdersStore((state) => state.openingPositions);
  const setOrdersStore = useOrdersStore((state) => state.setState);

  const hzSdk = useHzSdk();
  useOrderExecutedEvent((logs) => {
    let shouldRefetch = false;
    const deleteOpeningPositionKeys: string[] = [];

    logs.forEach((log) => {
      const eventData = log.parsedData.args.eventData;

      const addressItems = Object.fromEntries(
        eventData.addressItems.items.map((v) => [v.key, v.value]),
      );
      // const addressArrayItems = Object.fromEntries(
      //   eventData.addressItems.arrayItems.map((v) => [v.key, v.value]),
      // );
      // const uintItems = Object.fromEntries(
      //   eventData.uintItems.items.map((v) => [v.key, v.value]),
      // );
      // const boolItems = Object.fromEntries(
      //   eventData.boolItems.items.map((v) => [v.key, v.value]),
      // );
      const bytes32Items = Object.fromEntries(
        eventData.bytes32Items.items.map((v) => [v.key, v.value]),
      );

      if (addressItems.account !== hzSdk?.account) {
        return;
      }

      shouldRefetch = true;
      deleteOpeningPositionKeys.push(bytes32Items.key!);
    });
    if (shouldRefetch) {
      refetchOrders(hzSdk!.account as string, hzSdk!.chainId);
      refetchPositions(hzSdk!.account as string, hzSdk!.chainId).then(() => {
        if (deleteOpeningPositionKeys.length) {
          setOrdersStore({
            openingPositions: openingPositions.filter(
              (v) =>
                !deleteOpeningPositionKeys.includes(v.key) &&
                !deleteOpeningPositionKeys.includes(
                  getPositionModeKey({
                    marketAddress: v.marketAddress,
                    isLong: v.isLong,
                    isZFP: v.isZFP,
                  }),
                ),
            ),
          });
        }
      });
    }
  });
};

// handle order executed event
export const useHandleOrderCancelledEvent = () => {
  const openingPositions = useOrdersStore((state) => state.openingPositions);
  const setOrdersStore = useOrdersStore((state) => state.setState);

  const hzSdk = useHzSdk();
  useOrderCancelledEvent((logs) => {
    const deleteOpeningPositionKeys: string[] = [];

    logs.forEach((log) => {
      const eventData = log.parsedData.args.eventData;

      const addressItems = Object.fromEntries(
        eventData.addressItems.items.map((v) => [v.key, v.value]),
      );
      // const addressArrayItems = Object.fromEntries(
      //   eventData.addressItems.arrayItems.map((v) => [v.key, v.value]),
      // );
      // const uintItems = Object.fromEntries(
      //   eventData.uintItems.items.map((v) => [v.key, v.value]),
      // );
      // const boolItems = Object.fromEntries(
      //   eventData.boolItems.items.map((v) => [v.key, v.value]),
      // );
      const bytes32Items = Object.fromEntries(
        eventData.bytes32Items.items.map((v) => [v.key, v.value]),
      );

      if (addressItems.account !== hzSdk?.account) {
        return;
      }

      deleteOpeningPositionKeys.push(bytes32Items.key!);
    });
    if (deleteOpeningPositionKeys.length) {
      setOrdersStore({
        openingPositions: openingPositions.filter(
          (v) =>
            !deleteOpeningPositionKeys.includes(v.key) &&
            !deleteOpeningPositionKeys.includes(
              getPositionModeKey({
                marketAddress: v.marketAddress,
                isLong: v.isLong,
                isZFP: v.isZFP,
              }),
            ),
        ),
      });
    }
  });
};

export const useHandleOrderEvents = () => {
  useHandleCreateOrderEvent();
  useHandleOrderExecutedEvent();
  useHandleOrderCancelledEvent();
};
