'use client';

import { useCallback } from 'react';
import {
  OrderType,
  type Order as BaseOrder,
} from '@hertzflow/sdk-v2/types/orders';
import { calc } from '@repo/lib/calc';
import { queryClient, useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient';
import { CONTRACT_USD_MULTIPLIER } from '@/common/constants';
import { throttle } from '@/lib/runtime/timing';
import { useInstStore } from '../../stores/instStore';

export type Order = BaseOrder & {
  id: string;
  isOpen: boolean;
  sizeDeltaUsd: string;
  triggerPrice: string;
  triggerAboveThreshold: boolean;
  initialCollateralDeltaAmount: string;
  timestamp: number;
  isLimit: boolean;
  isMarket: boolean;
  isTpSl: boolean;
  isTp: boolean;
  isSl: boolean;
};

export const PAGE_LIMIT = 10;

// query open orders
export const useOpenOrders = ({
  instId,
}: {
  instId?: string;
} = {}) => {
  const hzSdk = useHzSdk();
  const accountAddress = useCurrentAccountAddress();
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const marketAddress = instId
    ? insts[instId]?.marketTokenAddress
    : undefined;
  const selectOrders = useCallback(
    (orders: Order[]) => {
      if (!instId) return orders;
      return orders.filter((order) => order.marketAddress === marketAddress);
    },
    [instId, marketAddress],
  );

  const result = useQuery({
    queryKey: ['rest', 'orders', hzSdk?.chainId, accountAddress],
    enabled:
      !!hzSdk &&
      !!accountAddress &&
      !!Object.keys(insts).length &&
      !!Object.keys(coins).length,
    queryFn: async () => {
      try {
        const { ordersData = {} } = await hzSdk!.orders.getOrders({});

        const result = (Object.entries(ordersData)
          .filter(
            ([, v]) =>
              insts[v.marketAddress]?.isView &&
              [
                OrderType.LimitIncrease,
                OrderType.LimitDecrease,
                OrderType.StopLossDecrease,
              ].includes(v.orderType),
          )
          .map(([, v]) => {
            const sizeDeltaUsdStr = v.sizeDeltaUsd.toString();
            const market = insts[v.marketAddress];
            const indexToken = market
              ? coins[market.indexTokenAddress]
              : undefined;
            const isOpen = [
              OrderType.LimitIncrease,
              OrderType.StopIncrease,
              OrderType.MarketIncrease,
            ].includes(v.orderType);
            const isSl = v.orderType === OrderType.StopLossDecrease;
            const triggerAboveThreshold =
              (isOpen && !v.isLong) || (!isOpen && v.isLong);
            const collateralToken = coins[v.initialCollateralTokenAddress];
            return {
              ...v,
              id: v.key,
              isOpen: isOpen,
              sizeDeltaUsd: calc(sizeDeltaUsdStr)
                .div(CONTRACT_USD_MULTIPLIER)
                .times(isOpen ? 1 : -1)
                .toFixed(),
              triggerPrice: indexToken
                ? calc(v.contractTriggerPrice.toString())
                    .times(calc(10).pow(indexToken.decimals))
                    .div(CONTRACT_USD_MULTIPLIER)
                    .toFixed()
                : '',
              triggerAboveThreshold: isSl
                ? !triggerAboveThreshold
                : triggerAboveThreshold,
              initialCollateralDeltaAmount: collateralToken
                ? calc(v.initialCollateralDeltaAmount.toString())
                    .div(calc(10).pow(collateralToken.decimals))
                    .times(isOpen ? 1 : -1)
                    .toFixed()
                : '',
              timestamp: Number(v.updatedAtTime) * 1000,
              isMarket: [
                OrderType.MarketDecrease,
                OrderType.MarketIncrease,
              ].includes(v.orderType),
              isTpSl: [
                OrderType.LimitDecrease,
                OrderType.StopLossDecrease,
              ].includes(v.orderType),
              isLimit: v.orderType === OrderType.LimitIncrease,
              isTp: v.orderType === OrderType.LimitDecrease,
              isSl: v.orderType === OrderType.StopLossDecrease,
            };
          }) || []) as Order[];

        return result.sort((a, b) => b.timestamp - a.timestamp);
      } catch (error) {
        if ((error as Error).message !== 'multicall timeout') {
          toast.error((error as Error).message, { id: 'rest-orders' });
        }
        throw error;
      }
    },
    refetchOnMount: false,
    refetchInterval: 10000,
    staleTime: 10000,
    select: selectOrders,
  });

  return result;
};

// get orders from cache
export const getOrdersByInstFromCache = ({
  address,
  network,
  marketAddress,
  isLong,
}: {
  address?: string;
  network: string | number;
  marketAddress?: string;
  isLong?: boolean;
}) => {
  const data = queryClient.getQueryData<Order[]>([
    'rest',
    'orders',
    network,
    address,
  ]);

  return (
    data?.filter(
      (v) =>
        (marketAddress === undefined || v.marketAddress === marketAddress) &&
        (isLong === undefined || v.isLong === isLong),
    ) || []
  );
};

// Throttle interval (ms): ensure at most one refetch per 2 seconds
const THROTTLE_INTERVAL = 2000;

// Throttled refetch orders function
const throttledRefetchOrders = throttle(
  (address: string, chainId: string | number) =>
    queryClient.refetchQueries({
      queryKey: ['rest', 'orders', chainId, address],
      type: 'active',
    }),
  THROTTLE_INTERVAL,
);

// refetch orders with throttle
export const refetchOrders = (
  address: string,
  chainId: string | number,
): Promise<void> => {
  return throttledRefetchOrders(address, chainId) || Promise.resolve();
};
