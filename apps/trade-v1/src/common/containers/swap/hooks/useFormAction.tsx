import { useCallback, useMemo, useState } from 'react';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import debounce from 'lodash-es/debounce';
import { UseFormReturn } from 'react-hook-form';

import { calc, truncate } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { ArrowLeftRightIcon, toast } from '@repo/ui';

import { useHzSdk, useSetTxBasicParams } from '../../../chainClient/hooks';
import { useCustomSignAndExecuteTransaction } from '../../../hooks/useExecTransaction';
import { ORDER_TYPE } from '../../../services/enum';
import { getProtocolStoreDataFromCache } from '../../../services/rest/liqPool';
import { useCalcSwapAmount } from '../../../services/rest/swap';
import { getCachedPriceTickerData } from '../../../services/ws/tickers';
import { useInstStore } from '../../../stores/instStore';
import { MARKET_PX, SWAP_PX_DECIMAL } from '../consts';
import { SwapForm, useSwapStore } from '../store';

import type {
  ProtocolStoreObjectInfo,
  SwapAmountInResult,
  SwapAmountOutResult,
} from '@hertzflow/sdk';

const handleSwapError = (error: Error) => {
  const toastId = 'swap-sdk-error';
  const errorMsg = error.message;

  if (
    errorMsg.includes('SlippageTooSmall') ||
    errorMsg.includes('slippage') ||
    errorMsg.includes('price impact')
  ) {
    toast.error(
      i18n._(
        msg`Slippage tolerance is too low. Please increase your slippage and try again.`,
      ),
      { id: toastId },
    );
    return;
  }
  if (
    errorMsg.includes('InsufficientLiquidity') ||
    errorMsg.includes('liquidity')
  ) {
    toast.error(
      i18n._(
        msg`Not enough liquidity to complete this trade. Try reducing your trade size.`,
      ),
      { id: toastId },
    );
    return;
  }

  if (
    errorMsg.includes('Invalid return values') ||
    errorMsg.includes('null price')
  ) {
    toast.error(
      i18n._(
        msg`Failed to fetch a valid swap quote. Please adjust your amount or try again later.`,
      ),
      { id: toastId },
    );
    return;
  }
  if (
    errorMsg.includes('BalanceTooLow') ||
    errorMsg.includes('insufficient funds')
  ) {
    toast.error(
      i18n._(
        msg`Your balance is too low to perform this action. Please add more funds.`,
      ),
      { id: toastId },
    );
    return;
  }

  if (errorMsg.includes('MoveAbort') || errorMsg.includes('revert')) {
    toast.error(
      i18n._(
        msg`Transaction execution failed. Please try again or adjust your parameters.`,
      ),
      { id: toastId },
    );
    return;
  }

  toast.error(error.message);
};

// swap tx
const buildSwapTx = ({
  payCoinType,
  receiveCoinType,
  receiveCoinPx,
  receiveCoinDecimal,
  payCoinSz,
  payCoinDecimal,
  slippage,
  protocolStore,
  hzSdk,
  tx,
}: {
  payCoinType: string;
  receiveCoinType: string;
  receiveCoinDecimal: number;
  receiveCoinPx: string;
  payCoinSz: string;
  payCoinDecimal: number;
  slippage: string;
  protocolStore: ProtocolStoreObjectInfo;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  tx.add(
    hzSdk.VaultModule.createSwapPayload({
      protocolStore,
      amountIn: payCoinSz,
      outCoinPrice: receiveCoinPx,
      slippage: +slippage,
      inCoinDecimals: payCoinDecimal,
      outCoinDecimals: receiveCoinDecimal,
      typeArguments: [payCoinType, receiveCoinType],
    }),
  );
  return tx;
};

// swap limit tx
const buildSwapLimitTx = ({
  // payCoinType,
  // receiveCoinType,
  // payCoinSz,
  // payCoinDecimal,
  // px,
  // pxIsReversed,
  // receiveCoinDecimal,
  // slippage,
  // sender,
  // hzSdk,
  tx,
}: {
  payCoinType: string;
  receiveCoinType: string;
  payCoinSz: string;
  payCoinDecimal: number;
  receiveCoinDecimal: number;
  px: string;
  pxIsReversed: boolean;
  slippage: string;
  sender: string;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  // const inputAmount = truncate(payCoinSz, payCoinDecimal);
  // TODO：limit swap
  return tx;
  // hzSdk.orderbookService.buildCreateSwapOrderTx(
  //   {
  //     inputAmount,
  //     // unit：xxx receive coin / pay coin
  //     triggerPrice: pxIsReversed ? calc(1).div(px).toFixed() : px,
  //     triggerPriceAboveAllowed: false,
  //     typeArguments: [payCoinType, receiveCoinType],
  //   },
  //   {
  //     caller: sender,
  //     slippage,
  //     inputCoinDecimals: payCoinDecimal,
  //     minOutCoinDecimals: receiveCoinDecimal,
  //   },
  //   tx,
  // );
};

// calc px
const getCalcPx = ({
  orderType,
  receiveCoin,
  payCoin,
  px,
  pxIsReversed,
}: {
  orderType: ORDER_TYPE;
  receiveCoin?: string;
  payCoin?: string;
  px?: string;
  pxIsReversed: boolean;
}) => {
  if (orderType === ORDER_TYPE.market) {
    const receiveCoinPx = getCachedPriceTickerData(receiveCoin)?.[0]?.p;
    const payCoinPx = getCachedPriceTickerData(payCoin)?.[0]?.p;
    if (receiveCoin && payCoin && receiveCoinPx && payCoinPx) {
      return calc(payCoinPx).div(receiveCoinPx);
    }
  } else if (px && px !== MARKET_PX) {
    return pxIsReversed ? calc(1).div(px) : px;
  }
};

// form action hook
export const useFormAction = (form: UseFormReturn<SwapForm>) => {
  const { t } = useLingui();
  const orderType = useSwapStore((state) => state.orderType);
  const slippage = useSwapStore((state) => state.slippage);
  const currentAccount = useCurrentAccount();
  const { refetch } = useSuiClientQuery('getAllBalances', {
    owner: currentAccount?.address || '',
  });
  const { mutate: signAndExecute } = useCustomSignAndExecuteTransaction({
    mutationKey: ['swap'],
  });
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setTxBasicParams = useSetTxBasicParams();
  // submit form
  const onSubmit = useCallback(
    (data: SwapForm) => {
      const { paySz, receiveSz, px, pxIsReversed } = data;
      const protocolStore = getProtocolStoreDataFromCache(
        hzSdk.fullClient.network,
      );

      const receiveCoinPx = getCachedPriceTickerData(
        receiveSz.coin ? `${coins[receiveSz.coin]?.symbol}/USD` : '',
      )?.[0]?.p;
      if (
        !currentAccount?.address ||
        !paySz.value ||
        !paySz.coin ||
        !receiveSz.value ||
        !receiveSz.coin ||
        !coins[paySz.coin] ||
        !coins[receiveSz.coin] ||
        !protocolStore ||
        !receiveCoinPx
      ) {
        return;
      }

      let tx = new Transaction();
      // basic settings
      tx = setTxBasicParams(tx);

      setIsSubmitting(true);
      try {
        // build tx
        if (orderType === ORDER_TYPE.market) {
          tx = buildSwapTx({
            protocolStore,
            payCoinType: coins[paySz.coin]!.coinType,
            receiveCoinType: coins[receiveSz.coin]!.coinType,
            payCoinSz: paySz.value,
            payCoinDecimal: coins[paySz.coin]!.decimal,
            receiveCoinDecimal: coins[receiveSz.coin]!.decimal,
            receiveCoinPx: receiveCoinPx,
            slippage,
            hzSdk,
            tx,
          });
        } else {
          tx = buildSwapLimitTx({
            payCoinType: coins[paySz.coin]!.coinType,
            receiveCoinType: coins[receiveSz.coin]!.coinType,
            payCoinSz: paySz.value,
            payCoinDecimal: coins[paySz.coin]!.decimal,
            receiveCoinDecimal: coins[receiveSz.coin]!.decimal,
            px,
            pxIsReversed,
            slippage,
            hzSdk,
            sender: currentAccount.address,
            tx,
          });
        }

        signAndExecute(
          { transaction: tx },
          {
            onSuccess(result) {
              setIsSubmitting(false);
              if (result.status === 'failed') {
                return;
              }
              const paySz = form.getValues('paySz');
              form.setValue('paySz', {
                ...paySz,
                value: '',
              });
              const receiveSz = form.getValues('receiveSz');
              form.setValue('receiveSz', {
                ...receiveSz,
                value: '',
              });

              refetch();
            },
            onError() {
              setIsSubmitting(false);
            },
          },
          {
            ordType: 'swap',
            title: t`Swap`,
            icon: <ArrowLeftRightIcon size={24} />,
            swapProps: {
              paySz: truncateFormat(
                paySz.value,
                coins[paySz.coin]?.szDispDecimal,
                {
                  stripTrailingZeros: true,
                },
              ),
              payCoinSymbol: coins[paySz.coin]!.symbol,
              payCoinIconSrc: coins[paySz.coin]!.icon,
              receiveCoinIconSrc: coins[receiveSz.coin]!.icon,
              receiveCoinSymbol: coins[receiveSz.coin]!.symbol,
              receiveSz: truncateFormat(
                form.getValues('receiveSz').value!,
                coins[receiveSz.coin]?.szDispDecimal,
                { stripTrailingZeros: true },
              ),
            },
          },
        );
      } catch (error) {
        toast.error((error as Error).message);
        setIsSubmitting(false);
      }
    },
    [
      currentAccount,
      setTxBasicParams,
      signAndExecute,
      form,
      coins,
      orderType,
      slippage,
      hzSdk,
      refetch,
      t,
    ],
  );

  const { mutateAsync: calcSwapAmount } = useCalcSwapAmount({
    onError: handleSwapError,
  });

  // handle pay sz change
  const handlePaySzChange = useMemo(() => {
    const debounceUpdate = debounce(async ({ value, receiveSz }) => {
      const result = await calcSwapAmount({
        calcOut: true,
        inCoinType: value.coin,
        outCoinType: receiveSz.coin,
        inCoinAmount: value.value,
        slippage: +slippage,
      });

      const { paySz: curPaySz, receiveSz: curReceiveSz } = form.getValues();

      const receiveSzValue = (result as SwapAmountOutResult | undefined)
        ?.formatted.amountOutAfterFee;

      if (
        curPaySz.value === value.value &&
        curPaySz.coin === value.coin &&
        receiveSzValue !== curReceiveSz.value &&
        curReceiveSz.coin === receiveSz.coin
      ) {
        form.setValue('receiveSz', {
          ...curReceiveSz,
          value: receiveSzValue,
        });
      }
    }, 200);

    return (value: { value: string; coin: string }) => {
      const { receiveSz, px, pxIsReversed, paySz: oldPaySz } = form.getValues();
      form.setValue('paySz', value);
      if (value.coin && value.coin === receiveSz.coin) {
        receiveSz.coin = oldPaySz.coin;
        form.setValue('receiveSz', receiveSz);
      }
      // reset px
      if (oldPaySz.coin !== value.coin && orderType !== ORDER_TYPE.market) {
        // trigger pxChange
        form.setValue('px', MARKET_PX);
        return;
      }

      // no receiveSz.coin, return
      if (!receiveSz.coin) {
        return;
      }

      // payCoin === receiveCoin, return
      if (value.coin === receiveSz.coin) {
        form.setValue('receiveSz', {
          ...receiveSz,
          value: value.value,
        });
        return;
      }

      const paySzAfterFee = calc(1)
        .minus(coins[receiveSz.coin || '']?.swapFeeRate || 0)
        .times(value.value);

      // calc px
      if (
        orderType !== ORDER_TYPE.market &&
        (!px || px === MARKET_PX) &&
        receiveSz.value
      ) {
        form.setValue(
          'px',
          truncate(calc(paySzAfterFee).div(receiveSz.value), 13),
        );
        return;
      }

      if (orderType === ORDER_TYPE.market) {
        debounceUpdate({ value, receiveSz });
      } else {
        // calc receive sz
        let receiveSzValue = receiveSz.value;
        const calcPx = getCalcPx({
          orderType,
          receiveCoin: `${coins[receiveSz.coin]?.symbol}/USD`,
          payCoin: `${coins[value.coin]?.symbol}/USD`,
          px,
          pxIsReversed,
        });
        if (calcPx) {
          receiveSzValue = truncate(
            calc(paySzAfterFee).times(calcPx),
            coins[receiveSz.coin]!.decimal,
          );
        }

        if (receiveSzValue !== receiveSz.value) {
          form.setValue('receiveSz', {
            ...receiveSz,
            value: receiveSzValue,
          });
        }
      }
    };
  }, [form, orderType, calcSwapAmount, coins, slippage]);

  // handle receive sz
  const handleReceiveSzChange = useMemo(() => {
    const debounceUpdate = debounce(async ({ calcOut, paySz, receiveSz }) => {
      const result = calcOut
        ? await calcSwapAmount({
            calcOut: calcOut,
            inCoinType: paySz.coin,
            outCoinType: receiveSz.coin,
            inCoinAmount: paySz.value,
            slippage: +slippage,
          })
        : await calcSwapAmount({
            calcOut: calcOut,
            inCoinType: paySz.coin,
            outCoinType: receiveSz.coin,
            outCoinAmount: receiveSz.value,
            slippage: +slippage,
          });
      const szValue = calcOut
        ? (result as SwapAmountOutResult | undefined)?.formatted
            .amountOutAfterFee
        : (result as SwapAmountInResult | undefined)?.formatted.amountInRes;

      const { paySz: curPaySz, receiveSz: curReceiveSz } = form.getValues();
      if (calcOut) {
        if (
          curPaySz.value === paySz.value &&
          curPaySz.coin === paySz.coin &&
          szValue !== curReceiveSz.value &&
          receiveSz.coin === curReceiveSz.coin
        ) {
          form.setValue('receiveSz', {
            ...curReceiveSz,
            value: szValue,
          });
        }
      } else {
        if (
          szValue !== curPaySz.value &&
          paySz.coin === curPaySz.coin &&
          receiveSz.value === curReceiveSz.value &&
          receiveSz.coin === curReceiveSz.coin
        ) {
          form.setValue('paySz', {
            ...curPaySz,
            value: szValue,
          });
        }
      }
    }, 200);
    return (value: { value: string; coin: string }) => {
      const {
        paySz,
        px,
        pxIsReversed,
        receiveSz: oldReceiveSz,
      } = form.getValues();
      form.setValue('receiveSz', value);

      if (value.coin && value.coin === paySz.coin) {
        paySz.coin = oldReceiveSz.coin;
        form.setValue('paySz', paySz);
      }

      // reset px
      if (oldReceiveSz.coin !== value.coin && orderType !== ORDER_TYPE.market) {
        form.setValue('px', MARKET_PX);
        return;
      }

      // no paySz.coin, return
      if (!paySz.coin) {
        return;
      }

      // receiveCoin not change, payCoin === receiveCoin, return
      if (value.coin === paySz.coin) {
        if (oldReceiveSz.coin === value.coin) {
          form.setValue('paySz', {
            ...paySz,
            value: value.value,
          });
        } else {
          form.setValue('receiveSz', {
            ...value,
            value: paySz.value,
          });
        }
        return;
      }

      const swapFeeRate = coins[value.coin || '']?.swapFeeRate || 0;
      //calc px
      if (
        orderType !== ORDER_TYPE.market &&
        (!px || px === MARKET_PX) &&
        paySz.value
      ) {
        // (1 - swapFeeRate) * paySz.value / value.value
        form.setValue(
          'px',
          truncate(
            calc(1).minus(swapFeeRate).times(paySz.value).div(value.value),
            SWAP_PX_DECIMAL,
          ),
        );
        return;
      }

      if (orderType === ORDER_TYPE.market) {
        debounceUpdate({
          calcOut: oldReceiveSz.coin !== value.coin,
          paySz,
          receiveSz: value,
        });
      } else {
        // calc paySz
        let paySzValue = paySz.value;
        const calcPx = getCalcPx({
          orderType,
          receiveCoin: `${coins[value.coin]?.symbol}/USD`,
          payCoin: `${coins[paySz.coin]?.symbol}/USD`,
          px,
          pxIsReversed,
        });
        if (calcPx) {
          paySzValue = truncate(
            // paySz = receiveSz / calcPx / (1 - swapFeeRate)
            calc(value.value).div(calcPx).div(calc(1).minus(swapFeeRate)),
            coins[paySz.coin]!.decimal,
          );
        }

        if (paySzValue !== paySz.value) {
          form.setValue('paySz', {
            ...paySz,
            value: paySzValue,
          });
        }
      }
    };
  }, [form, orderType, coins, slippage, calcSwapAmount]);

  // handle px change
  const handlePxChange = useCallback(
    (value: string) => {
      const { paySz, receiveSz, px: prevPx, pxIsReversed } = form.getValues();
      if (value !== prevPx) {
        form.setValue('px', value);
      }

      // empty, return
      if (!value) {
        return;
      }

      const swapFeeRate = coins[receiveSz.coin || '']?.swapFeeRate || 0;
      // calc receiveSz
      if (paySz.value && paySz.coin) {
        let receiveSzValue = receiveSz.value;
        const calcPx = getCalcPx({
          orderType,
          receiveCoin: receiveSz.coin
            ? `${coins[receiveSz.coin]?.symbol}/USD`
            : '',
          payCoin: `${coins[paySz.coin]?.symbol}/USD`,
          px: value,
          pxIsReversed,
        });

        if (calcPx) {
          receiveSzValue = truncate(
            calc(1).minus(swapFeeRate).times(paySz.value).times(calcPx),
            coins[paySz.coin]!.decimal,
          );
        }
        form.setValue('receiveSz', {
          ...receiveSz,
          value: receiveSzValue,
        });
      } else if (receiveSz.value && receiveSz.coin) {
        // calc paySz
        let paySzValue = paySz.value;
        const calcPx = getCalcPx({
          orderType,
          receiveCoin: `${coins[receiveSz.coin]?.symbol}/USD`,
          payCoin: paySz.coin ? `${coins[paySz.coin]?.symbol}/USD` : '',
          px: value,
          pxIsReversed,
        });

        if (calcPx) {
          paySzValue = truncate(
            calc(receiveSz.value).div(calcPx).div(calc(1).minus(swapFeeRate)),
            coins[receiveSz.coin]!.decimal,
          );
        }
        form.setValue('paySz', {
          ...paySz,
          value: paySzValue,
        });
      }
    },
    [form, coins, orderType],
  );

  // handle switch pay coin and receive coin
  const handleSwitchCoins = useCallback(() => {
    const { paySz, receiveSz, px } = form.getValues();
    form.setValue('paySz', receiveSz);
    form.setValue('receiveSz', paySz);
    if (px && px !== MARKET_PX) {
      form.setValue('px', truncate(calc(1).div(px), SWAP_PX_DECIMAL));
    }
    if (receiveSz.coin && receiveSz.value) {
      handlePaySzChange(receiveSz as { value: string; coin: string });
    } else if (paySz.coin && paySz.value) {
      handleReceiveSzChange(paySz as { value: string; coin: string });
    }
  }, [form, handlePaySzChange, handleReceiveSzChange]);

  return {
    onSubmit,
    isSubmitting: isSubmitting,
    onPaySzChange: handlePaySzChange,
    onReceiveSzChange: handleReceiveSzChange,
    onPxChange: handlePxChange,
    onSwitchCoins: handleSwitchCoins,
  };
};
