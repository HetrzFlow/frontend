import { FC, useEffect, useMemo, useRef, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { PriceInput as BasicPriceInput, useInstStore } from '@/common';
import { useHydrated } from '@/common/hooks';
import { ORDER_TYPE } from '@/constants/enum';
import { MARKET_PX } from '@/constants/trade';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { useTradeStore } from '../../store';

const PriceInput: FC<{
  className?: string;
  isLong: boolean;
  isPending?: boolean;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, isLong, isPending, value, onChange }) => {
  const hydrated = useHydrated();
  const { t } = useLingui();
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const pxDispDecimal = inst?.pxDispDecimal;

  const orderType = useTradeStore((state) => state.orderType);
  const last = usePriceTickerExecutionPrice({
    symbol: inst?.symbol,
    isIncrease: true,
    isLong,
  });

  const isMarket = orderType === ORDER_TYPE.market;

  const inputRef = useRef<HTMLInputElement>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const focusInputRef = useRef(false);
  const hoverInputRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useTradeStore((state) => state.setFormEleRefs)({
    priceInput: inputRef,
  });

  // handle price
  useEffect(() => {
    if (isMarket && value !== MARKET_PX) {
      setTimeout(() => {
        onChangeRef.current(MARKET_PX);
      }, 0);
    }
    if (!isMarket && value === MARKET_PX) {
      setTimeout(() => {
        onChangeRef.current(last || '');
      }, 0);
    }
  }, [isMarket, value, last]);

  const [hasError, limitPx, dispLimitPx] = useMemo((): [
    boolean,
    string,
    string,
  ] => {
    if (!value || value === MARKET_PX || !last) return [false, '', ''];

    const _limitPx = last;
    return [
      isLong ? calc(value).gt(_limitPx) : calc(value).lt(_limitPx),
      _limitPx,
      truncateFormat(_limitPx, inst?.pxDispDecimal, {
        style: 'currency',
        currency: 'USD',
      }),
    ];
  }, [value, last, inst, isLong]);

  useEffect(() => {
    if (hydrated && orderType === ORDER_TYPE.limit) {
      setTimeout(() => {
        const inputEle = inputRef.current;
        inputEle?.focus();
        inputEle?.setSelectionRange(
          inputEle.value.length,
          inputEle.value.length,
        );
      }, 300);
    }
  }, [orderType, hydrated]);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        setTooltipOpen(true);
        hoverInputRef.current = true;
      }}
      onMouseLeave={() => {
        hoverInputRef.current = false;
        setTimeout(() => {
          if (!focusInputRef.current && !hoverInputRef.current) {
            setTooltipOpen(false);
          }
        }, 300);
      }}
    >
      <Tooltip open={hasError && tooltipOpen}>
        <TooltipTrigger asChild>
          <div className="font-plex invisible absolute top-2 right-15 text-base font-medium">
            {truncateFormat(value, inst?.pxDispDecimal, {
              stripTrailingZeros: true,
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={4}
          className={cn(
            'mx-2 flex cursor-pointer items-center',
            !isPending && hasError ? '' : 'hidden',
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onClick={() => onChange(limitPx)}
          onMouseEnter={() => (hoverInputRef.current = true)}
          onMouseLeave={() => {
            hoverInputRef.current = false;
            setTimeout(() => {
              if (!focusInputRef.current && !hoverInputRef.current) {
                setTooltipOpen(false);
              }
            }, 300);
          }}
        >
          {isLong ? t`Max Price: ${dispLimitPx}` : t`Min Price: ${dispLimitPx}`}
        </TooltipContent>
      </Tooltip>
      {hydrated && (
        <BasicPriceInput
          ref={inputRef}
          className={cn(
            className,
            hasError
              ? 'border-destructive focus-within:border-destructive'
              : '',
          )}
          instId={instId}
          disabled={isMarket}
          value={isMarket ? last : value === MARKET_PX ? '' : value}
          onValueChange={onChange}
          decimal={pxDispDecimal}
          onBlur={() => {
            setTooltipOpen(false);
            focusInputRef.current = false;
          }}
          onFocus={() => {
            setTooltipOpen(true);
            focusInputRef.current = true;
          }}
          // suffix={
          //   <div className="flex h-4 items-center gap-2">
          //     USD
          //     <Separator orientation="vertical" className="!h-5" />
          //     <span
          //       className="text-accent cursor-pointer"
          //       onClick={() => {
          //         onChange(last || '');
          //       }}
          //     >{t`Mark`}</span>
          //   </div>
          // }
        />
      )}
    </div>
  );
};

export default PriceInput;
