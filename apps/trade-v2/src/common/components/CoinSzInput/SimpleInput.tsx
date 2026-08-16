'use client';

import { FC, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc, ROUND_MODE, truncate } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import { cn, NumberInput } from '@repo/ui';
import { CoinSzInputProps } from './types';

const SimpleInput: FC<CoinSzInputProps> = ({
  label,
  value,
  disabled,
  className,
  labelClassName,
  inputWrapClassName,
  inputClassName,
  suffixClassName,
  extraClassName,
  showBalance = true,
  showPercentActionsOnFocus,
  decimal,
  dispDecimal,
  usdPx,
  usdDecimal,
  balance,
  balanceDisplay,
  balanceUnit,
  inputSuffix,
  percentButtonClassName,
  placeholder = '0.00',
  readOnly,
  extra,
  isLoading,
  keepInputOnLoading,
  preservePrecision,
  maxLength,
  allowInputWhenBalanceZero,
  onValueChange,
  onPercentChange,
}) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const [hoveredPercent, setHoveredPercent] = useState<number>();
  const [inputFocused, setInputFocused] = useState(false);
  const displayDecimal = dispDecimal ?? decimal;
  const maxValue = Math.min(
    +(!showBalance || balance === undefined || balance === ''
      ? Infinity
      : allowInputWhenBalanceZero && +balance <= 0
        ? Infinity
        : balance),
    10 ** 10,
  );
  return (
    <NumberInput
      label={
        <div className="relative flex w-full items-center justify-between font-normal">
          <span className={cn('text-muted-foreground text-xs', labelClassName)}>
            {label}
          </span>
          {showPercentActionsOnFocus && inputFocused ? (
            <div className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1">
              {[0.25, 0.5, 0.75, 1].map((percent) => {
                const label =
                  percent === 1 ? t`MAX` : percentFormat(percent, 0);

                return (
                  <button
                    type="button"
                    key={percent}
                    aria-label={label}
                    className={cn(
                      'bg-bg-4 text-t-350 flex h-4 cursor-pointer items-center justify-center rounded px-1 text-xs',
                      hoveredPercent === percent && 'text-primary-foreground',
                      percentButtonClassName,
                    )}
                    onPointerEnter={() => setHoveredPercent(percent)}
                    onPointerLeave={() => setHoveredPercent(undefined)}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() =>
                      balance !== undefined &&
                      balance !== '' &&
                      Number.isFinite(+balance) &&
                      onPercentChange?.(
                        truncate(calc(balance).times(percent), decimal),
                        'click',
                      )
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      }
      className={cn('group gap-2 p-3', className)}
      value={value}
      disabled={disabled}
      isLoading={isLoading}
      keepInputOnLoading={keepInputOnLoading}
      preservePrecision={preservePrecision}
      variant="ghost"
      inputWrapClassName={cn('h-[36px]', inputWrapClassName)}
      inputClassName={cn('text-2xl h-[28px] font-plex', inputClassName)}
      suffixClassName={suffixClassName}
      extraClassName={cn('mt-2 text-xs', extraClassName)}
      onValueChange={onValueChange}
      placeholder={placeholder}
      readOnly={readOnly}
      decimal={decimal}
      locale={locale}
      maxLength={maxLength}
      max={maxValue}
      suffix={inputSuffix}
      onFocus={() => setInputFocused(true)}
      onBlur={() => setInputFocused(false)}
      extra={
        extra ?? (
          <div className="flex items-center justify-between">
            {
              <span className="font-plex">
                {truncateFormat(
                  usdPx ? calc(value || 0).times(usdPx) : '',
                  usdDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                    showMinDecimalValue: true,
                    round: ROUND_MODE.ROUND,
                  },
                )}
              </span>
            }
            {showBalance && (
              <>
                {/* wallet balance */}
                <span className="ml-auto inline-flex items-center gap-2">
                  {/* <WalletIcon size={16} /> */}
                  <span className="font-plex">
                    {balanceDisplay ??
                      truncateFormat(balance, displayDecimal, {
                        round: ROUND_MODE.DOWN,
                        stripTrailingZeros: true,
                        showMinDecimalValue: true,
                      })}{' '}
                    {balanceUnit}
                  </span>
                  {!disabled && (
                    <button
                      type="button"
                      className="bg-primary font-plex hover:text-primary-foreground cursor-pointer rounded-sm px-2 py-1 text-xs"
                      onClick={() =>
                        balance &&
                        +balance &&
                        onPercentChange &&
                        onPercentChange(balance, 'click')
                      }
                    >
                      {t`MAX`}
                    </button>
                  )}
                </span>
              </>
            )}
          </div>
        )
      }
    />
  );
};

export default SimpleInput;
