import React, { FC, useEffect, useMemo } from 'react';

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

import { MARKET_PX } from '@/constants/common';
import { ORDER_TYPE } from '@/constants/enum';
import { usePosition } from '../context';

const PriceInput: FC<{
  className?: string;
  orderType: ORDER_TYPE;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, orderType, value, onChange }) => {
  const { t } = useLingui();
  const { targetCoin, isLong } = usePosition();
  const [inst, baseCoin] = useInstStore(
    useShallow((state) => [
      state.getInstsArr().find((v) => v.coinType === targetCoin),
      state.getCoins()[targetCoin],
    ]),
  );
  const { data: priceData } = usePriceTickerStream(inst?.id);

  const isMarket = orderType === ORDER_TYPE.market;
  const marketPx = priceData[0]?.p ?? '';

  // handle orderType and px
  useEffect(() => {
    // delay to run, because react form hook is async exec
    if (isMarket && value !== MARKET_PX) {
      setTimeout(() => {
        onChange(MARKET_PX);
      }, 0);
    }

    if (!isMarket && value === MARKET_PX && marketPx) {
      setTimeout(() => {
        onChange(marketPx);
      }, 0);
    }
  }, [isMarket, value, onChange, marketPx]);

  const [hasError, limitPx, dispLimitPx] = useMemo((): [
    boolean,
    string,
    string,
  ] => {
    if (!value || value === MARKET_PX || !marketPx) return [false, '', ''];
    // close short
    if (!isLong) {
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
      // close long
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
  }, [value, marketPx, isLong, baseCoin]);

  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 overflow-hidden transition-[height]',
        className,
        isMarket ? 'h-0' : 'h-[112px]',
      )}
    >
      <Tooltip open={hasError}>
        <TooltipTrigger asChild>
          <div className="font-plex invisible absolute top-13 left-5 text-2xl font-medium">
            {value}
          </div>
        </TooltipTrigger>
        <TooltipContent
          inDialog
          side="top"
          sideOffset={0}
          className="bg-destructive text-destructive-foreground pointer-events-auto mx-2 flex cursor-pointer items-center"
          arrowClassName="bg-destructive fill-destructive"
          onClick={() => onChange(limitPx)}
        >
          {!isLong
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
        disabled={isMarket}
        value={isMarket ? marketPx : value === MARKET_PX ? '' : value}
        onValueChange={onChange}
        decimal={baseCoin?.pxDispDecimal}
        max={10 ** 10}
        placeholder={'0.00'}
      />
    </div>
  );
};

export default PriceInput;
