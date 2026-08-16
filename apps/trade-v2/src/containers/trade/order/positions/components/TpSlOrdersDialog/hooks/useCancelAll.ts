'use client';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { useMutation } from '@repo/lib/queryClient';
import { useHzSdk , useCurrentAccountAddress } from '@/common/chainClient';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { refetchOrders } from '@/common/services/rest/order';

import type { Order } from '@/common/services/rest/order';

/**
 * Batch cancel all TP/SL orders for a position.
 * Follows the same pattern as useCancelOrder in common/hooks/useCancelOrder.tsx.
 */
export const useCancelAllTpSl = () => {
  const hzSdk = useHzSdk();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const userAddress = useCurrentAccountAddress();

  return useMutation({
    mutationKey: ['cancelAllTpSl'],
    mutationFn: async ({
      orders,
      onSuccess: cb,
    }: {
      orders: Order[];
      onSuccess?: () => void;
    }) => {
      if (orders.length === 0 || !hzSdk) {
        return;
      }

      const title = i18n._(msg`Cancel TP/SL Orders`);

      await executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: i18n._(msg`Canceled`),
          id: 'toast-cancelAllTpSl',
        },
        executeTransaction: async () => {
          return await hzSdk.orders.cancelOrders(orders.map((o) => o.key));
        },
        onSuccess: async () => {
          if (userAddress) {
            refetchOrders(userAddress, hzSdk.chainId);
          }
          cb?.();
        },
      });
    },
  });
};
