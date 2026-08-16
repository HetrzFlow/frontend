import React, { FC, useMemo, useRef } from 'react';

import { useLingui } from '@lingui/react/macro';

import { useShallow } from 'zustand/react/shallow';
import { calc, ROUND_MODE, truncate } from '@repo/lib/calc';
import { thoFormat, truncateFormat } from '@repo/lib/format';
import {
  cn,
  NumberInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { usePriceTickerStream, useInstStore } from '@/common';

import { useOrder } from './context';

const PriceInput: FC<{
  className?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, value, onChange }) => {
  const { t } = useLingui();
  const { targetCoin, isLong, isOpen } = useOrder();
  const [inst, baseCoin] = useInstStore(
    useShallow((state) => [
      state.getInstsArr().find((v) => v.coinType === targetCoin),
      state.getCoins()[targetCoin],
    ]),
  );
  const { data: priceData } = usePriceTickerStream(inst?.id);

  const marketPx = priceData[0]?.p ?? '';

  const [hasError, limitPx, dispLimitPx] = useMemo((): [
    boolean,
    string,
    string,
  ] => {
    if (!value || !marketPx) return [false, '', ''];
    // open long or close short
    if ((isLong && isOpen) || (!isLong && !isOpen)) {
      const _limitPx = truncate(
        calc(marketPx).times(1.1),
        baseCoin?.pxDispDecimal,
        {
          round: ROUND_MODE.DOWN,
        },
      );
      return [
        calc(value).gt(_limitPx),
        _limitPx,
        thoFormat(_limitPx, {
          style: 'currency',
          currency: 'USD',
        }),
      ];
    } else {
      // open short or close long
      const _limitPx = truncate(
        calc(marketPx).times(0.9),
        baseCoin?.pxDispDecimal,
        {
          round: ROUND_MODE.UP,
        },
      );
      return [
        calc(value).lt(_limitPx),
        _limitPx,
        thoFormat(_limitPx, {
          style: 'currency',
          currency: 'USD',
        }),
      ];
    }
  }, [value, marketPx, isLong, baseCoin, isOpen]);
  const containerRef = useRef(null);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <Tooltip open={hasError}>
        <TooltipTrigger asChild>
          <div className="font-plex invisible absolute top-13 left-5 text-2xl font-medium">
            {value}
          </div>
        </TooltipTrigger>
        <TooltipContent
          container={containerRef.current}
          inDialog
          side="top"
          sideOffset={0}
          className="bg-destructive text-destructive-foreground mx-2 flex cursor-pointer items-center"
          arrowClassName="bg-destructive fill-destructive"
          onPointerDownOutside={(e) => e.preventDefault()}
          onClick={() => onChange(limitPx)}
        >
          {(isLong && isOpen) || (!isLong && !isOpen)
            ? t`Max Price: ${dispLimitPx}`
            : t`Min Price: ${dispLimitPx}`}
        </TooltipContent>
      </Tooltip>
      <NumberInput
        className="mt-2 p-4"
        variant="ghost"
        label={
          <div className="text-secondary-foreground flex w-full items-center text-sm">
            <span>{t`Price`}</span>
            <span className="ml-auto">
              {t`Mark`}:{' '}
              <span
                className="text-t-1100 cursor-pointer"
                onClick={() => onChange(marketPx ?? '')}
              >
                {truncateFormat(marketPx ?? '', baseCoin?.pxDispDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
              </span>
            </span>
          </div>
        }
        inputWrapClassName="h-[40px]"
        inputClassName="font-plex text-2xl h-[28px]"
        labelClassName="text-muted-foreground text-sm font-normal"
        suffix={
          <div className="flex items-center gap-2 text-2xl font-medium">
            {'USD'}
          </div>
        }
        value={value}
        onValueChange={onChange}
        decimal={baseCoin?.pxDispDecimal}
        max={10 ** 10}
        placeholder={'0.00'}
      />
    </div>
  );
};

export default PriceInput;
