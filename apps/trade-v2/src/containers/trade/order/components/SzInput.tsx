'use client';

import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import { CoinIcon } from '@repo/common/components';
import { calc, ROUND_MODE, truncate } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import { cn, NumberInput } from '@repo/ui';
import {
  getUsdPriceSymbol,
  usePriceTickerStream,
  useGlobalStore,
} from '@/common';
import type { Coin, Inst } from '@/common';

const QuickActions = ({
  className,
  onValueClick,
}: {
  className?: string;
  onValueClick: (value: number) => void;
}) => {
  return (
    <div className={cn('flex gap-1', className)}>
      {[0.1, 0.25, 0.5, 0.75].map((value) => {
        return (
          <span
            key={value}
            className="bg-t-1100/10 font-plex hover:text-primary-foreground cursor-pointer rounded-sm px-2 py-1 text-xs"
            onClick={() => {
              onValueClick(value);
            }}
          >
            {percentFormat(value, 0)}
          </span>
        );
      })}
    </div>
  );
};

const SzInput: FC<{
  className?: string;
  numberInputClassName?: string;
  label?: string;
  maxSize: string;
  max: string;
  value: string;
  px?: string;
  priceSymbol?: string;
  displaySymbol?: string;
  displayIcon?: ReactNode;
  decimal?: number;
  dispDecimal?: number;
  coin?: Coin;
  inst?: Inst;
  inputSzIsCoin: boolean;
  showEstimatedValue?: boolean;
  onChange: (value: string) => void;
}> = ({
  className,
  numberInputClassName,
  value,
  label,
  px,
  priceSymbol,
  displaySymbol,
  displayIcon,
  decimal: decimalOverride,
  dispDecimal: dispDecimalOverride,
  max,
  maxSize,
  coin,
  inst,
  inputSzIsCoin,
  showEstimatedValue = true,
  onChange,
}) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const coinMarketPx = usePriceTickerStream(
    priceSymbol ?? getUsdPriceSymbol(coin?.symbol),
    {
      throttleWait: 5000,
    },
  ).data[0]?.p;
  const coinPx = px || coinMarketPx;
  const coinSymbol = displaySymbol || coin?.symbol;

  const sizeUnit = inputSzIsCoin ? coinSymbol || '' : 'USD';
  const handlePercentClick = useCallback(
    (value: string) => {
      if (inputSzIsCoin && calc(maxSize).lte(0)) {
        onChange(value);
        return;
      }

      onChange(calc(maxSize).lt(value) ? maxSize : value);
    },
    [maxSize, inputSzIsCoin, onChange],
  );

  const decimal = inputSzIsCoin
    ? (decimalOverride ?? coin?.szInputDecimal)
    : usdAmountDisplayDecimal;
  const displayDecimal = dispDecimalOverride ?? coin?.szDispDecimal;
  const canEstimateUsdValue = Boolean(
    (coin?.address || displaySymbol) && coinPx,
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <NumberInput
        className={cn('p-3', numberInputClassName)}
        variant="ghost"
        label={
          <div className="text-secondary-foreground flex w-full items-center text-sm">
            <span>{label || t`Close`}</span>
            <span className="ml-auto">
              {t`Max`}:{' '}
              <span className="text-t-1100">
                {inputSzIsCoin
                  ? truncateFormat(max, displayDecimal, {
                      round: ROUND_MODE.DOWN,
                      stripTrailingZeros: true,
                      showMinDecimalValue: true,
                    })
                  : truncateFormat(max, usdAmountDisplayDecimal, {
                      style: 'currency',
                      currency: 'USD',
                      showMinDecimalValue: true,
                    })}
              </span>
            </span>
            <span
              className="bg-bg-5 font-plex hover:text-primary-foreground ml-1.5 cursor-pointer rounded-sm px-2 py-1 text-xs"
              onClick={(e) => {
                e.preventDefault();
                if (+max) {
                  handlePercentClick(max);
                }
              }}
            >
              {t`Max`}
            </span>
          </div>
        }
        inputWrapClassName="h-[52px]"
        inputClassName="font-plex text-2xl h-[28px]"
        labelClassName="text-muted-foreground text-sm font-normal"
        suffix={
          <div className="flex items-center gap-2 text-2xl font-medium">
            {inputSzIsCoin &&
              (displayIcon ?? (
                <CoinIcon
                  src={inputSzIsCoin ? coin?.icon : inst?.icon}
                  alt={inputSzIsCoin ? coin?.symbol : inst?.name}
                  size={32}
                />
              ))}
            {mounted ? sizeUnit : null}
          </div>
        }
        max={calc(max).gt(10 ** 10) ? 10 ** 10 : max}
        value={value}
        innerExtraClassName={
          showQuickActions || (showEstimatedValue && value) ? 'mt-1' : 'mt-0'
        }
        innerExtra={
          <>
            <QuickActions
              className={cn(
                'overflow-hidden transition-[height] duration-300',
                showQuickActions ? 'visible h-5' : 'invisible h-0',
              )}
              onValueClick={(v) => {
                const result = truncate(calc(max).times(v), decimal);

                if (+result) {
                  handlePercentClick(result);
                }
              }}
            />

            {showEstimatedValue && (
              <p
                className={cn(
                  'flex items-center overflow-hidden text-xs transition-[height] duration-300',
                  !showQuickActions && value ? 'visible h-5' : 'invisible h-0',
                )}
              >
                {inputSzIsCoin
                  ? truncateFormat(
                      canEstimateUsdValue
                        ? calc(value).times(coinPx || '')
                        : '',
                      usdAmountDisplayDecimal,
                      {
                        style: 'currency',
                        currency: 'USD',
                        showMinDecimalValue: true,
                      },
                    )
                  : `${truncateFormat(
                      canEstimateUsdValue ? calc(value).div(coinPx || '') : '',
                      displayDecimal,
                      {
                        showMinDecimalValue: true,
                      },
                    )} ${mounted ? coinSymbol : ''}`}
              </p>
            )}
          </>
        }
        onValueChange={onChange}
        onFocus={() => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          setShowQuickActions(true);
        }}
        onBlur={() => {
          timerRef.current = setTimeout(() => {
            setShowQuickActions(false);
          }, 200);
        }}
        decimal={decimal}
        locale={locale}
        placeholder={'0.00'}
      />
    </div>
  );
};

export default SzInput;
