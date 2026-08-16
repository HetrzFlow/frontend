'use client';

import { FC, useEffect, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc, ROUND_MODE, truncate } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import { cn, NumberInput, Slider, WalletIcon } from '@repo/ui';
import { CoinSzInputProps } from './types';

const InputWIthSlider: FC<CoinSzInputProps> = ({
  label,
  value,
  className,
  disabled,
  showBalance = true,
  decimal,
  dispDecimal,
  calcDecimal,
  usdPx,
  usdDecimal,
  balance,
  balanceUnit,
  inputSuffix,
  isLoading,
  keepInputOnLoading,
  isLong,
  allowInputWhenBalanceZero,
  onValueChange,
  onPercentChange,
}) => {
  const {
    i18n: { locale },
  } = useLingui();
  const [mounted, setMounted] = useState(false);
  const displayDecimal = dispDecimal ?? decimal;
  const percentDecimal = calcDecimal ?? decimal;

  const maxValue = Math.min(
    +(!showBalance || balance === undefined || balance === ''
      ? Infinity
      : allowInputWhenBalanceZero && +balance <= 0
        ? Infinity
        : balance),
    10 ** 10,
  );
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <NumberInput
      label={
        <div className="flex w-full items-center justify-between font-normal">
          <span className="text-muted-foreground text-sm">{label}</span>
          <div className="text-muted-foreground flex items-center gap-2 text-center">
            {showBalance && (
              <>
                {/* wallet balance */}
                <span className="inline-flex items-center gap-1 text-sm">
                  <WalletIcon size={16} />
                  <span className="font-plex">
                    {truncateFormat(balance, displayDecimal, {
                      round: ROUND_MODE.DOWN,
                      stripTrailingZeros: true,
                      showMinDecimalValue: true,
                    })}{' '}
                    {mounted ? balanceUnit : null}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      }
      className={cn('p-4', className)}
      value={value}
      disabled={disabled}
      isLoading={isLoading}
      keepInputOnLoading={keepInputOnLoading}
      variant="ghost"
      inputWrapClassName="h-[50px]"
      inputClassName="text-2xl h-[28px] font-plex"
      onValueChange={onValueChange}
      placeholder={'0.00'}
      decimal={decimal}
      locale={locale}
      max={maxValue}
      suffix={inputSuffix}
      innerExtra={
        value && (
          <span className="font-plex">
            {truncateFormat(usdPx ? calc(value).times(usdPx) : '', usdDecimal, {
              style: 'currency',
              currency: 'USD',
              showMinDecimalValue: true,
              round: ROUND_MODE.ROUND,
            })}
          </span>
        )
      }
      extra={
        showBalance && (
          <Slider
            className="h-8"
            disabled={!(balance && +balance)}
            value={[
              +value && balance && +balance
                ? Math.round((+value / +balance) * 100)
                : 0,
            ]}
            showStick={false}
            min={0}
            max={100}
            step={1}
            thumbClassName="border-bg-3"
            rangeColorClassName={
              isLong === undefined ? '' : isLong ? 'to-up' : 'to-down'
            }
            innerThumbClassName={
              isLong === undefined ? '' : isLong ? 'bg-up' : 'bg-down'
            }
            animatoinClassName={
              isLong === undefined ? '' : isLong ? 'bg-up/50' : 'bg-down/50'
            }
            tooltipContentProps={{
              className:
                isLong === undefined
                  ? 'bg-accent text-accent-foreground'
                  : isLong
                    ? 'bg-up text-accent-foreground'
                    : 'bg-down text-accent-foreground',
              arrowClassName:
                isLong === undefined
                  ? 'bg-accent fill-accent'
                  : isLong
                    ? 'bg-up fill-up'
                    : 'bg-down fill-down',
            }}
            scalePositions={[
              {
                value: 0,
                label: percentFormat(0, 0),
                className: '-translate-x-0',
              },
              {
                value: 25,
                label: percentFormat(0.25, 0),
                className: '-translate-x-1/4',
              },
              {
                value: 50,
                label: percentFormat(0.5, 0),
                className: '-translate-x-5/12',
              },
              {
                value: 75,
                label: percentFormat(0.75, 0),
                className: '-translate-x-1/2',
              },
              {
                value: 100,
                label: percentFormat(1, 0),
                className: '-translate-x-1/1',
              },
            ]}
            formatValue={(value) =>
              percentFormat(value !== undefined ? value / 100 : 0, 0)
            }
            onValueChange={(value, action) =>
              value[0] !== undefined &&
              balance &&
              +balance &&
              onPercentChange &&
              onPercentChange(
                truncate(
                  calc(balance).times(value[0]).div(100),
                  percentDecimal,
                ),
                action,
              )
            }
          />
        )
      }
      extraClassName="overflow-visible"
    />
  );
};

export default InputWIthSlider;
