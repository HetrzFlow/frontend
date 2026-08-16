import React from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { calc } from '@repo/lib/calc';
import { Button, cn, LoaderCircleIcon } from '@repo/ui';
import { useInstStore } from '@/common';

import { ORDER_TYPE } from '@/constants/enum';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';

import { usePosition } from '../../context';
import AlertBanner from './AlertBanner';
import { useValidate } from './hooks/useValidate';

interface FormBtnProps {
  orderType: ORDER_TYPE;
  isPending?: boolean;
  /** When 'tpsl-only', shows "Add Take Profit Order" / "Add Stop Loss Order" */
  mode?: 'default' | 'tpsl-only';
}

const FormBtn: React.FC<FormBtnProps> = ({ orderType, isPending, mode }) => {
  const { t } = useLingui();
  const position = usePosition();
  const inst = useInstStore(
    (state) => state.getInsts()[position?.marketAddress],
  );
  const px = useWatch({ name: 'px' });
  const marketPx = usePriceTickerExecutionPrice({
    symbol: inst?.symbol,
    isIncrease: false,
    isLong: position.isLong,
  });

  const text = useValidate({ orderType });
  const hasError = !!text;
  const showError = !isPending && hasError;
  const showAble = !isPending && !hasError;
  const isMarket = orderType === ORDER_TYPE.market;

  let enableText: string;
  if (mode === 'tpsl-only' && px && marketPx) {
    // Determine TP vs SL based on price comparison
    const isGtMarkPx = calc(px).gt(marketPx);
    const isTp =
      (position?.isLong && isGtMarkPx) || (!position?.isLong && !isGtMarkPx);
    enableText = isTp ? t`Add Take Profit Order` : t`Add Stop Loss Order`;
  } else {
    enableText = isMarket ? t`Close` : t`Create Order`;
  }

  return (
    <>
      <AlertBanner />
      <Button
        type="submit"
        disabled={hasError || isPending}
        onClick={() => {}}
        className={cn(
          'bg-accent text-accent-foreground hover:bg-accent/70 disabled:bg-bg-4 disabled:hover:bg-bg-4 w-full text-xs',
        )}
      >
        {isPending && (
          <>
            <LoaderCircleIcon size={16} className="animate-spin" />
            {enableText}
          </>
        )}
        {showError && text}
        {showAble && enableText}
      </Button>
    </>
  );
};

export default FormBtn;
