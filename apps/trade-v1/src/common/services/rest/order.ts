'use client';

import {
  PRICE_AMPLIFICATION_MULTIPLIER,
  PRICE_MULTIPLIER_DECIMAL,
  type OrderDetail,
} from '@hertzflow/sdk';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { normalizeStructTag } from '@mysten/sui/utils';
import { calc } from '@repo/lib/calc';
import { queryClient, useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { useHzSdk } from '../../chainClient/hooks';
import { useInstStore } from '../../stores/instStore';

export type Order = Omit<OrderDetail, 'timestamp'> & {
  isOpen: boolean;
  isBuy: boolean;
  isLong: boolean;
  targetCoin: string;
  payCoin: string;
  isLimit: boolean;
  payCoinAmount: string;
  triggerAboveThreshold: boolean;
  timestamp: number;
  positionId?: string;
  collateralUsd?: string;
};

export const PAGE_LIMIT = 10;

// query open orders
export const useOpenOrders = ({
  coinType,
  refetchInterval,
}: {
  coinType?: string;
  refetchInterval?: number;
} = {}) => {
  const hzSdk = useHzSdk();
  const currentAccount = useCurrentAccount();

  const coins = useInstStore((state) => state.getCoins());
  const result = useQuery({
    queryKey: [
      'rest',
      'orders',
      currentAccount?.address,
      hzSdk.fullClient.network,
    ],
    enabled: !!currentAccount?.address,
    queryFn: async () => {
      try {
        const data = await hzSdk.OrderModule.getUserOrdersFromUserTable(
          currentAccount!.address,
        );

        return data.map((v) => {
          const order = v as unknown as Order;
          order.targetCoin = v.indexCoin ? normalizeStructTag(v.indexCoin) : '';
          order.isOpen = v.orderType === 'IncreaseOrder';
          order.isBuy = order.isOpen
            ? v.direction === 'long'
            : v.direction !== 'long';
          order.isLimit = true;
          order.collateralCoin = v.collateralCoin
            ? normalizeStructTag(v.collateralCoin)
            : '';
          order.payCoin = order.isOpen
            ? normalizeStructTag(order.collateralCoin)
            : '';
          // collateral_delta in decrease order, not in increase order
          order.payCoinAmount = order.isOpen ? v.collateralValue : '';
          order.collateralUsd = order.isOpen
            ? undefined
            : calc(v.collateralValue)
                .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
                .toFixed();

          order.triggerAboveThreshold = v.triggerCondition === 'above';
          order.isLong = v.direction === 'long';
          order.timestamp = +order.timestamp * 1000;
          order.positionId = v.position;
          order.size = calc(v.size)
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .toFixed();
          order.triggerPrice = calc(v.triggerPrice)
            .times(calc(10).pow(coins[order.targetCoin]?.decimal || ''))
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .div(calc(10).pow(PRICE_AMPLIFICATION_MULTIPLIER))
            .toFixed();
          return order;
        }) as Order[];
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-orders' });
        throw error;
      }
    },
    refetchOnMount: 'always',
    refetchInterval: refetchInterval,
  });

  return {
    ...result,
    data: coinType
      ? result.data?.filter((v) => v.targetCoin === coinType)
      : result.data,
  };
};

// get orders from cache
export const getOrdersByInstFromCache = ({
  address,
  network,
  indexCoinType,
  isLong,
}: {
  address?: string;
  network: string;
  indexCoinType?: string;
  isLong?: boolean;
}) => {
  const data = queryClient.getQueryData<Order[]>([
    'rest',
    'orders',
    address,
    network,
  ]);

  return (
    data?.filter(
      (v) =>
        (indexCoinType === undefined || v.targetCoin === indexCoinType) &&
        (isLong === undefined || v.isLong === isLong),
    ) || []
  );
};

// refetch positions
export const refetchOrders = (address: string, network: string) => {
  queryClient.refetchQueries({
    queryKey: ['rest', 'orders', address, network],
    type: 'active',
  });
};

export type SwapOrder = {
  id: string;
  payCoin: string;
  payCoinSz: string;
  receiveCoin: string;
  receiveCoinSz: string;
  triggerPrice: string;
};

// get swap orders
export const useOpenSwapOrders = () => {
  return useQuery({
    queryKey: ['rest', 'swap', 'orders'],
    initialData: [],
    queryFn: () => {
      // return get(`${API_BASE_URL}/xxx`)
      return Promise.resolve([
        {
          id: '1',
          payCoin:
            '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
          payCoinSz: '1',
          receiveCoin:
            '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
          receiveCoinSz: '100500.1',
          triggerPrice: '0.00000995024',
        },
        {
          id: '2',
          payCoin:
            '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
          payCoinSz: '2.85',
          receiveCoin: '0x2::sui::SUI',
          receiveCoinSz: '1.11',
          triggerPrice: '2.567567',
        },
      ] as SwapOrder[]);
    },
  });
};
