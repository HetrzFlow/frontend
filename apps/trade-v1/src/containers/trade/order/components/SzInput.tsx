import { FC, useCallback, useRef, useState } from 'react';

import { useLingui } from '@lingui/react/macro';


import { calc, ROUND_MODE, truncate } from '@repo/lib/calc';
import { percentFormat, thoFormat, truncateFormat } from '@repo/lib/format';
import { cn, NumberInput, toast } from '@repo/ui';
import {
  CoinIcon,
  MIN_REMAINING_SUI,
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
            className="bg-primary font-plex hover:text-primary-foreground cursor-pointer rounded-sm px-2 py-1 text-xs"
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
  label?: string;
  maxSize: string;
  max: string;
  value: string;
  px?: string;
  coin?: Coin;
  inst?: Inst;
  inputSzIsCoin: boolean;
  onChange: (value: string) => void;
}> = ({
  className,
  value,
  label,
  px,
  max,
  maxSize,
  coin,
  inst,
  inputSzIsCoin,
  onChange,
}) => {
    const { t } = useLingui();
    const usdAmountDisplayDecimal = useGlobalStore(
      (state) => state.usdAmountDisplayDecimal,
    );
    const [showQuickActions, setShowQuickActions] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const coinMarketPx = usePriceTickerStream(coin ? `${coin.symbol}/USD` : '', {
      throttleWait: 5000,
    }).data[0]?.p;
    const coinPx = px || coinMarketPx;

    const sizeUnit = inputSzIsCoin ? coin?.symbol || '' : 'USD';
    const handlePercentClick = useCallback(
      (value: string) => {
        if (inputSzIsCoin && calc(maxSize).lte(0)) {
          const minSUI = thoFormat(MIN_REMAINING_SUI);
          toast.error(
            t`Wallet balance must contain at least ${minSUI} SUI for gas fee`,
          );
          onChange(value);
          return;
        }

        onChange(calc(maxSize).lt(value) ? maxSize : value);
      },
      [maxSize, inputSzIsCoin, onChange, t],
    );

    const decimal = inputSzIsCoin ? coin?.decimal : usdAmountDisplayDecimal;

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <NumberInput
          className="p-4"
          variant="ghost"
          label={
            <div className="text-secondary-foreground flex w-full items-center text-sm">
              <span>{label || t`Close`}</span>
              <span className="ml-auto">
                {t`Max`}:{' '}
                <span className="text-t-1100">
                  {inputSzIsCoin
                    ? truncateFormat(max, coin?.szDispDecimal, {
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
                className="bg-primary font-plex hover:text-primary-foreground ml-1.5 cursor-pointer rounded-sm px-2 py-1 text-xs"
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
          inputWrapClassName="h-[58px]"
          inputClassName="font-plex text-2xl h-[28px]"
          labelClassName="text-muted-foreground text-sm font-normal"
          suffix={
            <div className="flex items-center gap-2 text-2xl font-medium">
              {inputSzIsCoin && (
                <CoinIcon
                  src={inputSzIsCoin ? coin?.icon : inst?.icon}
                  alt={inputSzIsCoin ? coin?.symbol : inst?.name}
                  size={32}
                />
              )}
              {sizeUnit}
            </div>
          }
          max={Math.min(+max, 10 ** 10)}
          value={value}
          innerExtraClassName={showQuickActions || value ? 'mt-1' : 'mt-0'}
          innerExtra={
            <>
              <QuickActions
                className={cn(
                  'overflow-hidden transition-[height] duration-300',
                  showQuickActions ? 'visible h-6' : 'invisible h-0',
                )}
                onValueClick={(v) => {
                  const result = truncate(calc(max).times(v), decimal);

                  if (+result) {
                    handlePercentClick(result);
                  }
                }}
              />

              <p
                className={cn(
                  'font-plex flex items-center overflow-hidden transition-[height] duration-300',
                  !showQuickActions && value ? 'visible h-6' : 'invisible h-0',
                )}
              >
                {inputSzIsCoin
                  ? truncateFormat(
                    coin?.coinType && coinPx ? calc(value).times(coinPx) : '',
                    usdAmountDisplayDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      showMinDecimalValue: true,
                    },
                  )
                  : `${truncateFormat(
                    coin?.coinType && coinPx ? calc(value).div(coinPx) : '',
                    coin?.szDispDecimal,
                    {
                      showMinDecimalValue: true,
                    },
                  )} ${coin?.symbol}`}
              </p>
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
          placeholder={'0.00'}
        />
      </div>
    );
  };

export default SzInput;
