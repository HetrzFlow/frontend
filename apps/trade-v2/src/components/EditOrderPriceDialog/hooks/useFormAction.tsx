import { useCallback } from 'react';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { UseFormReturn } from 'react-hook-form';

import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { useMutation } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import {
  useHzSdk,
  refetchOrders,
  useInstStore,
  useCurrentAccountAddress,
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
} from '@/common';

import type { Order } from '@/common';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { runFormSubmitAction } from '@/lib/runtime/runFormSubmitAction';
import { createFormSubmitStatus } from '@/stores/trade/formSubmitStatus';
import { usePreferenceStore } from '@/stores/trade/preference';

const editOrderPriceFormSubmitStatus = createFormSubmitStatus();

// update order price
export const useUpdateOrderPx = () => {
  const userAddress = useCurrentAccountAddress();
  const hzSdk = useHzSdk();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const slippage = usePreferenceStore((state) => state.slippage);

  return useMutation({
    mutationKey: ['updateOrder'],
    mutationFn: async ({
      order,
      px,
      sizeDeltaUsd: customSizeDeltaUsd,
      cb,
    }: {
      order: Order;
      px: string;
      sizeDeltaUsd?: string;
      cb: () => void;
    }) => {
      const inst = insts[order.marketAddress];
      const indexToken =
        coins[insts[order.marketAddress]?.indexTokenAddress || ''];

      if (!hzSdk || !indexToken || !px) {
        toast.error('Required parameter is missing');
        return;
      }

      const title = i18n._(msg`Edit Order`);

      await executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: i18n._(msg`Succeeded`),
          icon: <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />,
          id: 'toast-updateOrders',
        },
        executeTransaction: async () => {
          return await hzSdk.orders.updateOrder({
            orderKey: order.key,
            orderType: order.orderType,
            indexTokenDecimals: indexToken.decimals,
            sizeDeltaUsd: BigInt(
              calc(customSizeDeltaUsd || order.sizeDeltaUsd)
                .abs()
                .times(CONTRACT_USD_MULTIPLIER)
                .toFixed(0),
            ),
            triggerPrice: BigInt(
              calc(px).times(CONTRACT_PRECISION_MULTIPLIER).toFixed(0),
            ),
            isLong: order.isLong,
            allowedSlippage: +slippage,
            minOutputAmount: order.minOutputAmount,
            isSetAcceptablePriceImpactEnabled: true,
            autoCancel: order.autoCancel,
          });
        },
        onSuccess: async () => {
          // refresh orders
          if (refetchOrders) {
            refetchOrders(userAddress, hzSdk.chainId);
          }
          cb();
        },
      });
    },
  });
};

// form action hook
export const useFormAction = ({
  order,
  form,
  onOpenChange,
  sizeEditable,
}: {
  order: Order;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<{ px: string; size?: string }, any, undefined>;
  onOpenChange: (open: boolean, modified?: boolean) => void;
  sizeEditable?: boolean;
}) => {
  const userAddress = useCurrentAccountAddress();

  const { mutateAsync: updateOrderPx } = useUpdateOrderPx();

  const onSubmit = useCallback(
    async (data: { px: string; size?: string }) => {
      const { px, size } = data;

      if (!userAddress || !px) {
        return;
      }
      await runFormSubmitAction({
        submitStatus: editOrderPriceFormSubmitStatus.submitStatus,
        action: async () =>
          await updateOrderPx({
            order,
            px,
            sizeDeltaUsd: sizeEditable ? size : undefined,
            cb: () => {
              onOpenChange(false, true);
            },
          }),
      });
    },
    [order, updateOrderPx, userAddress, onOpenChange, sizeEditable],
  );

  const onTypeChange = useCallback(
    (type: string) => {
      form.setValue('px', type);
    },
    [form],
  );

  return {
    onSubmit,
    onTypeChange,
  };
};

// whether form is submitting
export const useFormIsSubmitting = () => {
  return editOrderPriceFormSubmitStatus.useIsSubmitting();
};
