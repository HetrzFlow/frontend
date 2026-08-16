import { useCallback, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

import { useQuery } from '@tanstack/react-query';
import { UseFormReturn } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { queryClient } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import {
  CoinIcon,
  useHzSdk,
  useSetTxBasicParams,
  useCustomSignAndExecuteTransaction,
  refetchOrders,
  getCachedPriceTickerData,
  useInstStore,
} from '@/common';
import type { Coin, Order } from '@/common';

const editOrderPriceIsSubmittingKey = ['editOrderPrice', 'isSubmitting'];

// modify increase order
const buildIncreaseOrderTx = ({
  order,
  px,
  baseCoinDecimal,
  tx,
  hzSdk,
}: {
  order: Order;
  px: string;
  baseCoinDecimal: number;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  tx.add(
    hzSdk.VaultModule.createUpdateIncreaseOrderPayload({
      orderId: order.orderId,
      size: order.size,
      triggerPrice: px,
      indexCoinDecimals: baseCoinDecimal,
      triggerAboveThreshold: order.triggerAboveThreshold,
    }),
  );
  return tx;
};

// modify decrease order
const buildDecreaseOrderTx = ({
  order,
  px,
  baseCoinDecimal,
  tx,
  hzSdk,
}: {
  order: Order;
  px: string;
  baseCoinDecimal: number;
  baseCoinPx: string;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  tx.add(
    hzSdk.VaultModule.createUpdateDecreaseOrderPayload({
      orderId: order.orderId,
      triggerPrice: px,
      triggerAboveThreshold: order.triggerAboveThreshold,
      indexCoinDecimals: baseCoinDecimal,
      size: order.size,
      collateral: order.collateralUsd!,
    }),
  );
  return tx;
};

// form action hook
export const useFormAction = ({
  order,
  form,
  onOpenChange,
}: {
  order: Order;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<{ px: string }, any, undefined>;
  onOpenChange: (open: boolean, modified?: boolean) => void;
}) => {
  const { t } = useLingui();
  const { mutate: signAndExecute } = useCustomSignAndExecuteTransaction({
    mutationKey: ['editOrderPrice'],
  });
  const currentAccount = useCurrentAccount();
  const { refetch } = useSuiClientQuery('getAllBalances', {
    owner: currentAccount?.address || '',
  });

  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );

  const baseCoin = coins[order.targetCoin];
  const inst = insts[order.targetCoin];
  const hzSdk = useHzSdk();
  const setTxBasicParams = useSetTxBasicParams();

  const onSubmit = useCallback(
    (data: { px: string }) => {
      const { px } = data;
      const pxData = getCachedPriceTickerData(inst?.id);
      const marketPx = pxData?.[0]?.p;
      if (
        !currentAccount?.address ||
        !px ||
        (!order.isOpen && !marketPx) ||
        !baseCoin
      ) {
        return;
      }
      queryClient.setQueryData(editOrderPriceIsSubmittingKey, true);
      let tx = new Transaction();
      // basic tx setting
      tx = setTxBasicParams(tx);
      try {
        // build tx
        if (order.isOpen) {
          tx = buildIncreaseOrderTx({
            order,
            px,
            baseCoinDecimal: baseCoin.decimal,
            tx,
            hzSdk,
          });
        } else {
          tx = buildDecreaseOrderTx({
            order,
            px,
            baseCoinDecimal: baseCoin.decimal,
            baseCoinPx: marketPx!,
            tx,
            hzSdk,
          });
        }
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              queryClient.setQueryData(editOrderPriceIsSubmittingKey, false);
              if (result.status === 'failed') {
                return;
              }

              onOpenChange(false, true);
              refetch();
              refetchOrders(currentAccount.address, hzSdk.fullClient.network);
            },
            onError: () => {
              queryClient.setQueryData(editOrderPriceIsSubmittingKey, false);
            },
          },
          {
            ordType: 'limit',
            title: t`Edit Order`,
            icon: (
              <CoinIcon size={24} src={baseCoin.icon} alt={baseCoin.name} />
            ),
            resultDescription: t`Succeeded`,
          },
        );
      } catch (error) {
        toast.error((error as Error).message);
        queryClient.setQueryData(editOrderPriceIsSubmittingKey, false);
      }
    },
    [
      currentAccount,
      setTxBasicParams,
      signAndExecute,
      onOpenChange,
      refetch,
      order,
      baseCoin,
      hzSdk,
      inst?.id,
      t,
    ],
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
  const { data: isSubmitting } = useQuery({
    queryKey: editOrderPriceIsSubmittingKey,
    queryFn: () => false,
  });

  return isSubmitting;
};

// params for calc collateral, lever
export const useCalcEditableParams = ({
  payCoinIsTargetCoin,
  triggerPrice,
  payCoinPx,
  px,
  payCoinAmount,
  payCoin,
  size,
  collateralUsd,
}: {
  payCoinIsTargetCoin: boolean;
  triggerPrice: string;
  payCoinPx?: string;
  px: string;
  payCoinAmount: string;
  payCoin?: Coin;
  size: string;
  collateralUsd?: string;
}) => {
  return useMemo(() => {
    const curPayCoinPx = payCoinIsTargetCoin ? triggerPrice : payCoinPx;
    const nextPayCoinPx = payCoinIsTargetCoin ? px : payCoinPx;
    const pxIsNoChange = curPayCoinPx === nextPayCoinPx;

    const curCollateral =
      collateralUsd ||
      (curPayCoinPx && payCoinAmount
        ? calc(payCoinAmount || '')
            .div(payCoin ? Math.pow(10, payCoin.decimal) : '')
            .times(curPayCoinPx ?? '')
        : '');

    const nextCollateral = pxIsNoChange
      ? curCollateral
      : collateralUsd ||
        (nextPayCoinPx && payCoinAmount
          ? calc(payCoinAmount || '')
              .div(payCoin ? Math.pow(10, payCoin.decimal) : '')
              .times(nextPayCoinPx ?? '')
          : '');

    const curLever = calc(size).div(curCollateral);
    const nextLever = pxIsNoChange ? curLever : calc(size).div(nextCollateral);

    return {
      curCollateral,
      nextCollateral,
      curLever,
      nextLever,
    };
  }, [
    payCoinIsTargetCoin,
    triggerPrice,
    payCoinPx,
    px,
    payCoin,
    payCoinAmount,
    size,
    collateralUsd,
  ]);
};
