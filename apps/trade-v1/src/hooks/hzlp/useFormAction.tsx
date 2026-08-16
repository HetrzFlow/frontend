import { useCallback, useMemo, useState } from 'react';

import { fromDecimalsAmount, ZERO_STR } from '@hertzflow/sdk';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

import debounce from 'lodash-es/debounce';
import { UseFormReturn } from 'react-hook-form';
import { truncateFormat } from '@repo/lib/format';
import { ArrowLeftRightIcon, toast } from '@repo/ui';
import {
  IMAGES_MAP,
  useHzSdk,
  useSetTxBasicParams,
  buildPriceId,
  useCustomSignAndExecuteTransaction,
  useHzLPDetail,
  usePoolDetail,
  useVaultObject,
  getCachedPriceTickerData,
  useInstStore,
} from '@/common';
import { HzlpTraderType } from '@/constants/hzlp/enum';
import { useCalcReceiveAmount } from '@/services/rest/hzlp/trade';
import { usePreferenceStore } from '@/stores/hzlp/preference';
import { FormDataType, useTradeStore } from '@/stores/hzlp/trade';

const handleHzlpError = (error: Error) => {
  const toastId = 'hzlp-sdk-error';
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

const buildAddLiquidityTx = ({
  payCoinSz,
  payCoinDecimal,
  inCoinPrice,
  payCoinType,
  slippage,
  hzSdk,
  tx,
}: {
  payCoinSz: string;
  payCoinDecimal: number;
  payCoinType: string;
  inCoinPrice: string;
  slippage: string;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  tx.add(
    hzSdk.VaultModule.createAddLiquidityPayload({
      amountIn: payCoinSz,
      inCoinDecimals: payCoinDecimal,
      slippage: +slippage,
      typeArguments: [payCoinType],
      inCoinPrice,
    }),
  );
  return tx;
};

const buildRemoveLiquidityTx = ({
  payCoinSz,
  receiveCoinType,
  receiveCoinDecimals,
  receiveCoinPrice,
  slippage,
  hzSdk,
  tx,
}: {
  payCoinSz: string;
  receiveCoinDecimals: number;
  receiveCoinType: string;
  receiveCoinPrice: string;
  slippage: string;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  tx.add(
    hzSdk.VaultModule.createRemoveLiquidityPayload({
      amountIn: payCoinSz,
      slippage: +slippage,
      typeArguments: [receiveCoinType],
      outCoinPrice: receiveCoinPrice,
      outCoinDecimals: receiveCoinDecimals,
    }),
  );
  return tx;
};

export const useFormAction = (form: UseFormReturn<FormDataType>) => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const currentAccount = useCurrentAccount();
  const { refetch: refetchBalance } = useSuiClientQuery('getAllBalances', {
    owner: currentAccount?.address || '',
  });
  const tradeType = useTradeStore((state) => state.tradeType);
  const coins = useInstStore((state) => state.getCoins());
  const slippage = usePreferenceStore((state) => state.slippage);

  const { mutate: signAndExecute } = useCustomSignAndExecuteTransaction({
    mutationKey: ['tradeHzlp'],
  });
  const { data: hzlpDetail } = useHzLPDetail();
  const { refetch: refetchPoolDetail } = usePoolDetail();
  const { refetch: refetchVaultObject } = useVaultObject();

  const isBuy = tradeType === HzlpTraderType.Buy;
  const { mutateAsync: calcReceiveAmount, isPending: isCalcing } =
    useCalcReceiveAmount({
      isBuy,
      onError: handleHzlpError,
    });
  const setTxBasicParams = useSetTxBasicParams();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    (data: FormDataType) => {
      const { paySz, receiveSz } = data;

      if (
        !currentAccount?.address ||
        !paySz.coin ||
        !paySz.value ||
        !receiveSz.coin ||
        !receiveSz.value ||
        !hzlpDetail
      ) {
        return;
      }

      let tx = new Transaction();

      tx = setTxBasicParams(tx);

      if (!paySz.value) return;

      const isBuy = tradeType === HzlpTraderType.Buy;

      const coinPrice =
        getCachedPriceTickerData(
          isBuy
            ? paySz?.coin
              ? buildPriceId(coins[paySz.coin]?.symbol ?? '')
              : ''
            : receiveSz?.coin
              ? buildPriceId(coins[receiveSz.coin]?.symbol ?? '')
              : '',
        )?.[0]?.p || ZERO_STR;

      setIsSubmitting(true);
      try {
        if (isBuy) {
          const payCoinObj = coins[paySz.coin];
          if (!payCoinObj) {
            setIsSubmitting(false);
            return;
          }
          if (!coinPrice) {
            setIsSubmitting(false);
            return;
          }
          tx = buildAddLiquidityTx({
            payCoinSz: paySz.value,
            payCoinDecimal: payCoinObj.decimal,
            payCoinType: payCoinObj.coinType,
            slippage: slippage,
            tx,
            hzSdk,
            inCoinPrice: coinPrice,
          });
        } else {
          const receiveCoinObj = coins[receiveSz.coin];
          if (!receiveCoinObj) {
            setIsSubmitting(false);
            return;
          }

          if (!coinPrice) {
            setIsSubmitting(false);
            return;
          }
          tx = buildRemoveLiquidityTx({
            payCoinSz: paySz.value,
            receiveCoinDecimals: receiveCoinObj.decimal,
            receiveCoinType: receiveCoinObj.coinType,
            receiveCoinPrice: coinPrice,
            slippage: slippage,
            tx,
            hzSdk,
          });
        }

        const _hzlpObj = {
          decimal: hzlpDetail.hzlp_decimal,
          symbol: hzlpDetail.symbol,
          icon: IMAGES_MAP.coinIcons.HzLP,
        };
        const _payCoinObj = isBuy ? coins[paySz.coin] : _hzlpObj;
        const _receiveObj = isBuy ? _hzlpObj : coins[receiveSz.coin];

        signAndExecute(
          { transaction: tx },
          {
            onSuccess() {
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

              refetchBalance();
              refetchPoolDetail();
              refetchVaultObject();
            },
            onSettled() {
              setIsSubmitting(false);
            },
          },
          {
            ordType: 'swap',
            title: t`Swap`,
            icon: <ArrowLeftRightIcon size={24} />,
            swapProps: {
              paySz: truncateFormat(paySz.value, _payCoinObj?.decimal, {
                stripTrailingZeros: true,
              }),
              payCoinSymbol: _payCoinObj!.symbol,
              payCoinIconSrc: _payCoinObj!.icon,
              receiveCoinIconSrc: _receiveObj!.icon,
              receiveCoinSymbol: _receiveObj!.symbol,
              receiveSz: truncateFormat(
                form.getValues('receiveSz').value!,
                _receiveObj?.decimal,
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
      currentAccount?.address,
      hzlpDetail,
      setTxBasicParams,
      tradeType,
      coins,
      signAndExecute,
      t,
      form,
      slippage,
      hzSdk,
      refetchBalance,
      refetchPoolDetail,
      refetchVaultObject,
    ],
  );

  const handlePaySzChange = useMemo(() => {
    const debounceUpdate = debounce(async ({ value, receiveSz }) => {
      const amountOutAfterFee = isBuy
        ? await calcReceiveAmount({
            coinType: coins[value.coin]!.coinType,
            amount: value.value,
          })
        : await calcReceiveAmount({
            coinType: coins[receiveSz.coin]!.coinType,
            amount: value.value,
          });

      const { paySz: curPaySz, receiveSz: curReceiveSz } = form.getValues();

      const receiveSzValue = amountOutAfterFee
        ? fromDecimalsAmount(
            amountOutAfterFee,
            isBuy ? hzlpDetail!.hzlp_decimal : coins[receiveSz.coin]!.decimal,
          )
        : '';

      if (
        curPaySz.value === value.value &&
        curPaySz.coin === value.coin &&
        curReceiveSz.coin === receiveSz.coin &&
        receiveSzValue !== receiveSz.value
      ) {
        form.setValue('receiveSz', {
          ...receiveSz,
          value: receiveSzValue,
        });
      }
    }, 200);

    return async (value: { value?: string; coin?: string }) => {
      const { receiveSz } = form.getValues();
      form.setValue('paySz', value);

      if (
        !receiveSz.coin ||
        (!isBuy && !coins[receiveSz.coin]) ||
        !value.coin ||
        (isBuy && !coins[value.coin || '']) ||
        !hzlpDetail
      ) {
        return;
      }

      if (!value.value) {
        form.setValue('receiveSz', {
          ...receiveSz,
          value: '',
        });
        return;
      }
      debounceUpdate({
        value,
        receiveSz,
      });
    };
  }, [form, isBuy, coins, hzlpDetail, calcReceiveAmount]);

  const handleReceiveSzChange = useMemo(() => {
    const debounceUpdate = debounce(async ({ paySz, value }) => {
      const amountOutAfterFee = isBuy
        ? await calcReceiveAmount({
            coinType: coins[paySz.coin]!.coinType,
            amount: paySz.value,
          })
        : await calcReceiveAmount({
            coinType: coins[value.coin]!.coinType,
            amount: paySz.value,
          });

      const { paySz: curPaySz, receiveSz: curReceiveSz } = form.getValues();
      const receiveSzValue = amountOutAfterFee
        ? fromDecimalsAmount(
            amountOutAfterFee,
            isBuy ? hzlpDetail!.hzlp_decimal : coins[value.coin]!.decimal,
          )
        : '';
      if (
        curPaySz.value === paySz.value &&
        curPaySz.coin === paySz.coin &&
        curReceiveSz.coin === value.coin &&
        receiveSzValue !== value.value
      ) {
        form.setValue('receiveSz', {
          ...value,
          value: receiveSzValue,
        });
      }
    });

    return async (value: { value?: string; coin?: string }) => {
      const { paySz } = form.getValues();
      form.setValue('receiveSz', value);

      if (!paySz.coin) {
        return;
      }

      if (!value.value) {
        form.setValue('paySz', {
          ...paySz,
          value: '',
        });
        return;
      }

      debounceUpdate({ paySz, value });
    };
  }, [form, isBuy, coins, hzlpDetail, calcReceiveAmount]);
  return {
    onSubmit,
    isSubmitting,
    isCalcing,
    handlePaySzChange,
    handleReceiveSzChange,
  };
};
