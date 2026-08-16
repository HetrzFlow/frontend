'use client';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import {
  InfiniteData,
  QueryObserverResult,
  RefetchOptions,
  useMutation,
} from '@repo/lib/queryClient';
import { useHzSdk } from '../chainClient/hooks';
import { useCustomSignAndExecuteTransaction } from './useExecTransaction';

import type { Order } from '../services/rest/order';

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
  const hzSdk = useHzSdk();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();

  return useMutation({
    mutationKey: ['cancelOrder'],
    mutationFn: async (orders: Order[]) => {
      if (orders.length === 0 || !hzSdk) {
        return;
      }

      const isMulti = orders.length > 1;
      const title = isMulti
        ? i18n._(msg`Cancel Orders`)
        : i18n._(msg`Cancel Order`);

      await executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: i18n._(msg`Canceled`),
          id: 'toast-cancelOrders',
        },
        executeTransaction: async () => {
          return await hzSdk.orders.cancelOrders(orders.map((v) => v.key));
        },
        onSuccess: async () => {
          if (refetchOrders) {
            await refetchOrders();
          }
        },
      });
    },
  });
};
