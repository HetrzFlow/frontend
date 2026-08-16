import { useCallback } from 'react';

import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import {
  getInternalUsdParamsForInst,
  getTradePayTokenAddress,
} from '@hertzflow/sdk-v2/configs/internalUsd';
import { OrderPositionType, OrderType } from '@hertzflow/sdk-v2/types/orders';
import { createRevertedTransactionError } from '@hertzflow/sdk-v2/utils/callContract';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { UseFormReturn } from 'react-hook-form';
import { withTimeout } from 'viem';

import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useMutation } from '@repo/lib/queryClient';
import { CreditIcon, LinkIcon, toast, tradeToast } from '@repo/ui';
import type { Order, Position } from '@/common';
import {
  CREDIT_MARKET_CATEGORY,
  CREDIT_TOKEN_DISPLAY_DECIMALS,
  CREDIT_TOKEN_SYMBOL,
  useHzSdk,
  useInstStore,
  useCurrentAccountAddress,
  CONTRACT_USD_MULTIPLIER,
  CONTRACT_PRECISION_MULTIPLIER,
  useOpenOrders,
  usePriceStore,
} from '@/common';

import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { useGasLimits, useGasPrice } from '@/common/services/rest/gas';

import { runFormSubmitAction } from '@/lib/runtime/runFormSubmitAction';
import { findFirstTriggerTpAndSlOrder } from '@/lib/trade/order';
import {
  getMarketOrderEventKey,
  handleMarketOrderEvent,
  TIMEOUT,
} from '@/lib/trade/transaction';
import { refetchPlatformHistoryOrders } from '@/services/rest/order';
import { createFormSubmitStatus } from '@/stores/trade/formSubmitStatus';
import { usePreferenceStore } from '@/stores/trade/preference';
import { TYPE } from '../enum';

const editCollateralFormSubmitStatus = createFormSubmitStatus();

export const useDepositOrWithdraw = () => {
  const hzSdk = useHzSdk();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInsts());
  const slippage = usePreferenceStore((state) => state.slippage);
  const { data: gasLimits } = useGasLimits();
  const { data: gasPrice } = useGasPrice();

  return useMutation({
    mutationKey: ['editCollateral'],
    mutationFn: async ({
      position,
      type,
      size,
      order,
      tpPx,
      cb,
    }: {
      position: Position;
      type: TYPE;
      size: string;
      order?: Order;
      tpPx?: string;
      cb: () => void;
    }) => {
      const { collateralTokenAddress, marketAddress, isLong } = position;
      const prices = usePriceStore.getState().pricesMap;
      const inst = insts[marketAddress];
      const internalUsd = getInternalUsdParamsForInst(hzSdk?.chainId, inst);
      const payTokenAddress = getTradePayTokenAddress({
        chainId: hzSdk?.chainId,
        inst,
        collateralTokenAddress,
      });
      const collateralToken = coins[collateralTokenAddress];
      const payToken = coins[payTokenAddress ?? collateralTokenAddress];
      const indexToken = coins[insts[marketAddress]?.indexTokenAddress || ''];
      if (!hzSdk || !collateralToken || !payToken || !indexToken || !inst) {
        toast.error('Required parameter is missing');
        return;
      }

      const isDeposit = type === TYPE.deposit;
      const title = i18n._(msg`Edit Collateral`);
      const isCreditMarket = inst.category === CREDIT_MARKET_CATEGORY;
      const dispSize = truncateFormat(
        size,
        isCreditMarket ? CREDIT_TOKEN_DISPLAY_DECIMALS : payToken.szDispDecimal,
      );
      const displayToken = payToken;
      const collateralTokenSymbol = isCreditMarket
        ? CREDIT_TOKEN_SYMBOL
        : displayToken.symbol;
      const amountToken = isDeposit ? payToken : collateralToken;
      const collateralTokenAmount = BigInt(
        calc(size).times(calc(10).pow(amountToken.decimals)).toFixed(0),
      );

      await executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: isDeposit
            ? i18n._(msg`Deposited`)
            : i18n._(msg`Withdrawn`),
          icon: isCreditMarket ? (
            <CreditIcon size={24} className="text-accent" />
          ) : (
            <CoinIcon
              size={24}
              src={displayToken.icon}
              alt={displayToken.name}
            />
          ),
          showDefaultSuccess: false, // Will show custom toast in handleMarketOrderEvent
          id: 'toast-editCollateral',
        },
        waitTransaction: false,
        executeTransaction: async () => {
          let txPromise;

          if (isDeposit) {
            txPromise = hzSdk.orders.depositPositionCollateral({
              marketAddress,
              collateralTokenAddress,
              payTokenAddress,
              collateralTokenAmount,
              internalUsd,
              isLong,
              allowedSlippage: +slippage,
              indexToken,
              tokensData: coins,
              skipSimulation: true,
              prices,
              gasLimits,
              gasPrice,
              orderPositionType: position.isZFP
                ? OrderPositionType.ZFP
                : OrderPositionType.Normal,
            });
          } else {
            txPromise = hzSdk.orders.withdrawPositionCollateral({
              marketAddress,
              collateralTokenAddress,
              collateralTokenAmount,
              internalUsd,
              isLong,
              allowedSlippage: +slippage,
              indexToken,
              tokensData: coins,
              updateSltpEntries:
                order && tpPx
                  ? [
                      {
                        orderKey: order.key,
                        orderType: order.orderType,
                        indexTokenDecimals: indexToken.decimals,
                        sizeDeltaUsd: BigInt(
                          calc(order.sizeDeltaUsd)
                            .abs()
                            .times(CONTRACT_USD_MULTIPLIER)
                            .toFixed(0),
                        ),
                        triggerPrice: BigInt(
                          calc(tpPx!)
                            .times(CONTRACT_PRECISION_MULTIPLIER)
                            .toFixed(0),
                        ),
                        isLong: order.isLong,
                        allowedSlippage: +slippage,
                        minOutputAmount: order.minOutputAmount,
                        isSetAcceptablePriceImpactEnabled: true,
                        autoCancel: order.autoCancel,
                      },
                    ]
                  : [],
              skipSimulation: true,
              prices,
              gasLimits,
              gasPrice,
              orderPositionType: position.isZFP
                ? OrderPositionType.ZFP
                : OrderPositionType.Normal,
            });
          }
          const explorerHost = hzSdk.config.chainId
            ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
            : undefined;
          const toastId = 'toast-editCollateral';

          const eventPromise = withTimeout(
            () =>
              new Promise((resolve, reject) => {
                handleMarketOrderEvent({
                  hzSdk,
                  orderKey: getMarketOrderEventKey({
                    marketAddress: inst.marketTokenAddress,
                    isLong,
                    orderType: isDeposit
                      ? OrderType.MarketIncrease
                      : OrderType.MarketDecrease,
                    isZFP: position.isZFP,
                  }),
                  onsubmit: (txHash) => {
                    const href =
                      txHash && explorerHost
                        ? `${explorerHost}/tx/${txHash}`
                        : '';
                    tradeToast(
                      {
                        type: 'loading',
                        title: title,
                        description: (
                          <>
                            {i18n._(msg`Submitted`)}
                            <a
                              href={href}
                              target="_blank"
                              className="text-accent cursor-pointer"
                              rel="noreferrer noopener"
                            >
                              <LinkIcon size={16} />
                            </a>
                          </>
                        ),
                        showClose: false,
                        icon: (
                          <CoinIcon
                            size={24}
                            src={displayToken.icon}
                            alt={displayToken.name}
                          />
                        ),
                      },
                      {
                        id: toastId,
                        duration: Infinity,
                      },
                    );
                  },
                  onSuccess: (txHash) => {
                    refetchPlatformHistoryOrders(inst.id);
                    const href =
                      txHash && explorerHost
                        ? `${explorerHost}/tx/${txHash}`
                        : '';
                    tradeToast(
                      {
                        type: 'success',
                        title: title,
                        description: (
                          <>
                            {isDeposit
                              ? i18n._(
                                  msg`Deposited ${dispSize} ${collateralTokenSymbol}`,
                                )
                              : i18n._(
                                  msg`Withdraw ${dispSize} ${collateralTokenSymbol}`,
                                )}
                            <a
                              href={href}
                              target="_blank"
                              className="text-accent cursor-pointer"
                              rel="noreferrer noopener"
                            >
                              <LinkIcon size={16} />
                            </a>
                          </>
                        ),
                        showClose: true,
                        icon: (
                          <CoinIcon
                            size={24}
                            src={displayToken.icon}
                            alt={displayToken.name}
                          />
                        ),
                      },
                      {
                        id: toastId,
                      },
                    );
                    resolve('');
                  },
                  onFailed: ({ reason }) => {
                    reject(
                      new Error(
                        reason
                          ? `${i18n._(msg`Order has been cancelled`)}: ${reason}.`
                          : i18n._(msg`Order has been cancelled`),
                      ),
                    );
                  },
                });

                void txPromise.then((txHash) => {
                  if (!txHash) {
                    return;
                  }

                  void hzSdk.publicClient
                    ?.waitForTransactionReceipt({
                      hash: txHash as `0x${string}`,
                    })
                    .then(async (receipt) => {
                      if (receipt.status === 'reverted') {
                        reject(
                          await createRevertedTransactionError({
                            sdk: hzSdk,
                            receipt,
                            txHash,
                          }),
                        );
                      }
                    })
                    .catch(reject);
                }, reject);
              }),
            {
              timeout: TIMEOUT,
              errorInstance: new Error('timeout'),
            },
          );

          return (await Promise.all([txPromise, eventPromise]))[0] || '';
        },
        onSuccess: async () => {
          cb();
        },
      });
    },
  });
};

// form action hook
export const useFormAction = ({
  position,
  form,
  onOpenChange,
}: {
  position: Position;

  form: UseFormReturn<{
    type: string;
    size: string;
    orderKey: string;
    tpPx: string;
  }>;
  onOpenChange: (open: boolean) => void;
}) => {
  const useAddress = useCurrentAccountAddress();
  const { data: orders } = useOpenOrders();
  const { isLong, marketAddress } = position;

  const { tpOrder } = findFirstTriggerTpAndSlOrder({
    isLong,
    marketAddress: marketAddress,
    orders: orders || [],
    isZFP: position.isZFP,
  });

  const { mutateAsync: depositOrWithdraw } = useDepositOrWithdraw();

  const onSubmit = useCallback(
    async (data: { type: string; size: string; tpPx: string }) => {
      const { size } = data;
      if (!useAddress || !size) {
        return;
      }
      await runFormSubmitAction({
        submitStatus: editCollateralFormSubmitStatus.submitStatus,
        action: async () =>
          await depositOrWithdraw({
            position,
            order: tpOrder,
            ...data,
            type: data.type as TYPE,
            cb: () => {
              onOpenChange(false);
            },
          }),
      });
    },
    [useAddress, onOpenChange, position, tpOrder, depositOrWithdraw],
  );

  const onTypeChange = useCallback(
    (type: string) => {
      form.setValue('type', type);
      form.setValue('size', '');
    },
    [form],
  );

  return {
    onSubmit,
    onTypeChange,
  };
};

// form is submitting
export const useFormIsSubmitting = () => {
  return editCollateralFormSubmitStatus.useIsSubmitting();
};
