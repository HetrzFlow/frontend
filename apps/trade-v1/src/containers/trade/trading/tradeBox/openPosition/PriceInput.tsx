import { FC, useEffect, useMemo, useRef } from 'react';

import { useLingui } from '@lingui/react/macro';


import { calc, ROUND_MODE, truncate } from '@repo/lib/calc';
import { thoFormat } from '@repo/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import {
  PriceInput as BasicPriceInput,
  usePriceTickerStream,
  useInstStore,
} from '@/common';
import { MARKET_PX } from '@/constants/common';
import { ORDER_TYPE } from '@/constants/enum';
import { useHydrated } from '@/hooks/useHydrated';
import { useGlobalStore } from '@/stores/trade/global';
import { useTradeStore } from '../../store';

const PriceInput: FC<{
  className?: string;
  isLong: boolean;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, isLong, value, onChange }) => {
  const hydrated = useHydrated();
  const { t } = useLingui();
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const coins = useInstStore((state) => state.getCoins());
  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;

  const orderType = useTradeStore((state) => state.orderType);
  const { data } = usePriceTickerStream(inst?.id);
  const { p: last } = data[0] || {};
  const isMarket = orderType === ORDER_TYPE.market;

  const inputRef = useRef<HTMLInputElement>(null);

  useTradeStore((state) => state.setFormEleRefs)({
    priceInput: inputRef,
  });

  // handle price
  useEffect(() => {
    if (isMarket && value !== MARKET_PX) {
      setTimeout(() => {
        onChange(MARKET_PX);
      }, 0);
    }
    if (!isMarket && value === MARKET_PX) {
      onChange(last || MARKET_PX);
      setTimeout(() => {
        onChange(last || MARKET_PX);
      }, 0);
    }
  }, [isMarket, value, onChange, last]);

  const [hasError, limitPx, dispLimitPx] = useMemo((): [
    boolean,
    string,
    string,
  ] => {
    if (!value || value === MARKET_PX || !last) return [false, '', ''];

    if (isLong) {
      const _limitPx = truncate(calc(last).times(1.1), pxDispDecimal, {
        round: ROUND_MODE.DOWN,
      });
      return [
        calc(value).gt(_limitPx),
        _limitPx,
        thoFormat(_limitPx, {
          style: 'currency',
          currency: 'USD',
        }),
      ];
    } else {
      const _limitPx = truncate(calc(last).times(0.9), pxDispDecimal, {
        round: ROUND_MODE.UP,
      });
      return [
        calc(value).lt(_limitPx),
        _limitPx,
        thoFormat(_limitPx, {
          style: 'currency',
          currency: 'USD',
        }),
      ];
    }
  }, [value, last, isLong, pxDispDecimal]);

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
    <div className="relative">
      <Tooltip open={hasError}>
        <TooltipTrigger asChild>
          <div className="font-plex invisible absolute top-2 right-15 text-base font-medium">
            {value}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={0}
          className="bg-destructive text-destructive-foreground mx-2 flex cursor-pointer items-center"
          arrowClassName="bg-destructive fill-destructive"
          onPointerDownOutside={(e) => e.preventDefault()}
          onClick={() => onChange(limitPx)}
        >
          {isLong ? t`Max Price: ${dispLimitPx}` : t`Min Price: ${dispLimitPx}`}
        </TooltipContent>
      </Tooltip>
      {hydrated && (
        <BasicPriceInput
          ref={inputRef}
          className={className}
          instId={instId}
          disabled={isMarket}
          value={isMarket ? last : value === MARKET_PX ? '' : value}
          onValueChange={onChange}
          decimal={pxDispDecimal}
        />
      )}
    </div>
  );
};

export default PriceInput;
