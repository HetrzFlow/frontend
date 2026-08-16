'use client';

import { useCallback } from 'react';

import {
  CancelDecreaseOrderParams,
  CancelIncreaseOrderParams,
} from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import {
  InfiniteData,
  QueryObserverResult,
  RefetchOptions,
} from '@repo/lib/queryClient';
import { useHzSdk, useSetTxBasicParams } from '../chainClient/hooks';
import CoinIcon from '../components/CoinIcon';
import { useInstStore } from '../stores/instStore';
import { useCustomSignAndExecuteTransaction } from './useExecTransaction';

import type { Order } from '../services/rest/order';

// cancle ordet tx
const buildCancelOrderTx = ({
  orders,
  hzSdk,
  tx,
}: {
  orders: Order[];
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  const increaseOrderParams: CancelIncreaseOrderParams[] = [];
  const decreaseOrderParams: CancelDecreaseOrderParams[] = [];

  orders.forEach(({ orderId, collateralCoin, isOpen }) => {
    if (isOpen) {
      // increase order
      increaseOrderParams.push({
        orderId: orderId,
        collateralCoin: collateralCoin!,
      });
    } else {
      // decrease order
      decreaseOrderParams.push({ orderId: orderId });
    }
  });
  tx.add(
    hzSdk.OrderModule.createCancelAllOrdersPayload(
      increaseOrderParams,
      decreaseOrderParams,
    ),
  );
  return tx;
};

// cancel order
export const useCancelOrder = ({
  refetchOrders,
}: {
  refetchOrders?: (
    options?: RefetchOptions,
  ) =>
    | Promise<
        QueryObserverResult<
          InfiniteData<{ total: number; list: Order[] }, unknown>,
          Error
        >
      >
    | Promise<QueryObserverResult<Order[], Error>>;
}) => {
  const currentAccount = useCurrentAccount();
  const { refetch } = useSuiClientQuery('getAllBalances', {
    owner: currentAccount?.address || '',
  });
  const { t } = useLingui();
  const coins = useInstStore((state) => state.getCoins());
  const { mutate: signAndExecute, isPending } =
    useCustomSignAndExecuteTransaction({ mutationKey: ['cancelOrder'] });
  const hzSdk = useHzSdk();

  const setTxBasicParams = useSetTxBasicParams();

  return {
    mutate: useCallback(
      (orders: Order[]) => {
        if (!currentAccount?.address || !orders.length) {
          return;
        }

        // send transaction to cancel order
        let tx = new Transaction();
        // basic settings
        tx = setTxBasicParams(tx);

        tx = buildCancelOrderTx({ orders, hzSdk, tx });

        const isMulti = orders.length > 1;
        const _coin = coins[orders[0]?.targetCoin || ''];

        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              if (result.status === 'failed') {
                return;
              }
              refetch();
              if (refetchOrders) {
                refetchOrders();
              }
            },
          },
          {
            ordType: 'limit',
            title: isMulti ? t`Cancel Orders` : t`Cancel Order`,
            icon:
              !isMulti && _coin ? (
                <CoinIcon size={24} src={_coin.icon} alt={_coin.name} />
              ) : null,
            resultDescription: t`Canceled`,
          },
        );
      },
      [
        currentAccount,
        setTxBasicParams,
        hzSdk,
        refetch,
        signAndExecute,
        refetchOrders,
        coins,
        t,
      ],
    ),
    isPending,
  };
};
