import React, { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { useShallow } from 'zustand/react/shallow';

import { Button, cn, LoaderCircleIcon } from '@repo/ui';
import {
  NORMALIZED_SUI_TYPE_ARG,
  useBalances,
  balanceValidator,
  getCachedPriceTickerData,
  usePriceTickerStream,
  useInstStore,
} from '@/common';

import { useOrder } from './context';
import { useCalcEditableParams, useFormIsSubmitting } from './useFormAction';

const FormBtn: FC = () => {
  const { t } = useLingui();
  const {
    isLong,
    targetCoin,
    payCoin,
    size,
    triggerPrice,
    payCoinAmount,
    isOpen,
    collateralUsd,
  } = useOrder();
  const [coins] = useInstStore(useShallow((state) => [state.getCoins()]));
  const baseCoin = coins[targetCoin];
  const balances = useBalances([NORMALIZED_SUI_TYPE_ARG]);

  const isSubmitting = useFormIsSubmitting();

  const px = useWatch({ name: 'px' });

  const payCoinObj = coins[payCoin];
  const payCoinPx = usePriceTickerStream(
    payCoinObj ? `${payCoinObj?.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;

  const payCoinIsTargetCoin = payCoin === targetCoin;
  const { curLever, nextLever } = useCalcEditableParams({
    payCoinIsTargetCoin,
    triggerPrice,
    payCoinPx,
    px,
    payCoinAmount,
    payCoin: payCoinObj,
    size,
    collateralUsd,
  });

  const text = useMemo(() => {
    // not input in px
    if (!+px) {
      return t`Enter an amount`;
    }

    // price validation
    if (baseCoin) {
      const { p: last } =
        getCachedPriceTickerData(`${baseCoin.symbol}/USD`)?.[0] || {};
      // limit price validation
      if (last) {
        if (((isLong && isOpen) || (!isLong && !isOpen)) && px > 1.1 * +last) {
          return t`Price too high\n(above 1.1x current)`;
        }
        if (((!isLong && isOpen) || (isLong && !isOpen)) && px < 0.9 * +last) {
          return t`Price too low\n(below 0.9x current)`;
        }
      }
    }

    // lever validation
    if (curLever !== nextLever) {
      if (nextLever.gt(100)) {
        return t`Leverage too high\n(above 100x)`;
      }

      if (nextLever.lt(1.1)) {
        return t`Leverage too low\n(below 1.1x)`;
      }
    }

    const _text = balanceValidator({
      suiCoin: coins[NORMALIZED_SUI_TYPE_ARG],
      suiBalance: balances?.[0]?.totalBalance,
    });
    if (_text) {
      return _text;
    }

    return '';
  }, [t, px, baseCoin, balances, coins, isLong, curLever, nextLever, isOpen]);

  const hasError = !!text;
  const showError = !isSubmitting && hasError;
  const showAble = !isSubmitting && !hasError;
  const enableText = t`Confirm`;

  return (
    <Button
      type="submit"
      disabled={hasError || isSubmitting}
      onClick={() => {}}
      className={cn(
        'bg-accent text-accent-foreground hover:bg-accent/90 disabled:bg-bg-3 w-full text-base',
      )}
    >
      {isSubmitting && (
        <>
          <LoaderCircleIcon size={16} className="animate-spin" />
          {enableText}
        </>
      )}
      {showError && text}
      {showAble && enableText}
    </Button>
  );
};

export default FormBtn;
