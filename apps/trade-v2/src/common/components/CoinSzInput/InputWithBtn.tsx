'use client';

import { FC, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc, ROUND_MODE, truncate } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import { Button, cn, NumberInput, SkeletonLayout, WalletIcon } from '@repo/ui';
import { CoinSzInputProps } from './types';

const InputWIthBtn: FC<CoinSzInputProps> = ({
  label,
  value,
  disabled,
  className,
  labelClassName,
  inputWrapClassName,
  inputClassName,
  showBalance = true,
  showPercentActionsOnFocus,
  decimal,
  dispDecimal,
  calcDecimal,
  usdPx,
  usdDecimal,
  usdPosition = 'inner',
  allowInputWhenBalanceZero,
  balance,
  balanceUnit,
  inputSuffix,
  suffixClassName,
  percentActionsClassName,
  percentButtonClassName,
  showBalanceIcon = true,
  showBalanceMaxAction,
  isLoading,
  keepInputOnLoading,
  extraClassName,
  extraTextClassName,
  onValueChange,
  onPercentChange,
}) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const [inputFocused, setInputFocused] = useState(false);
  const displayDecimal = dispDecimal ?? decimal;
  const percentDecimal = calcDecimal ?? decimal;
  const percentButtonClasses = cn(
    'bg-primary font-plex hover:text-primary-foreground inline-flex cursor-pointer items-center justify-center rounded-sm px-2 py-1 text-xs',
    percentButtonClassName,
  );
  const showPercentActions = !showPercentActionsOnFocus || inputFocused;
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
        <div className="flex w-full items-center justify-between font-normal">
          <span className={cn('text-muted-foreground text-sm', labelClassName)}>
            {label}
          </span>
          <div
            className={cn(
              'text-secondary-foreground flex items-center gap-2 text-center transition-opacity duration-300',
              showPercentActions
                ? 'opacity-100'
                : 'pointer-events-none opacity-0',
              percentActionsClassName,
            )}
          >
            {showBalance ? (
              <>
                <span
                  className={percentButtonClasses}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() =>
                    balance &&
                    +balance &&
                    onPercentChange &&
                    onPercentChange(
                      truncate(calc(balance).times(0.25), percentDecimal),
                      'click',
                    )
                  }
                >
                  {percentFormat(0.25, 0)}
                </span>
                <span
                  className={percentButtonClasses}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() =>
                    balance &&
                    +balance &&
                    onPercentChange &&
                    onPercentChange(
                      truncate(calc(balance).times(0.5), percentDecimal),
                      'click',
                    )
                  }
                >
                  {percentFormat(0.5, 0)}
                </span>
                <span
                  className={percentButtonClasses}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() =>
                    balance &&
                    +balance &&
                    onPercentChange &&
                    onPercentChange(
                      truncate(calc(balance).times(0.75), percentDecimal),
                      'click',
                    )
                  }
                >
                  {percentFormat(0.75, 0)}
                </span>
                <span
                  className={percentButtonClasses}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() =>
                    balance &&
                    +balance &&
                    onPercentChange &&
                    onPercentChange(balance, 'click')
                  }
                >
                  {t`MAX`}
                </span>
              </>
            ) : null}
          </div>
        </div>
      }
      className={cn('p-4', className)}
      value={value}
      disabled={disabled}
      isLoading={isLoading}
      keepInputOnLoading={keepInputOnLoading}
      variant="ghost"
      inputWrapClassName={cn('h-[50px]', inputWrapClassName)}
      inputClassName={cn('text-2xl h-[28px] font-plex', inputClassName)}
      onValueChange={onValueChange}
      placeholder={'0.00'}
      decimal={decimal}
      locale={locale}
      max={maxValue}
      suffix={inputSuffix}
      suffixClassName={suffixClassName}
      onFocus={
        showPercentActionsOnFocus ? () => setInputFocused(true) : undefined
      }
      onBlur={
        showPercentActionsOnFocus ? () => setInputFocused(false) : undefined
      }
      extraClassName={
        cn(
          usdPosition === 'extra' || showBalance
            ? 'flex items-center justify-between gap-2'
            : undefined,
          extraClassName,
        ) || undefined
      }
      extra={
        (usdPosition === 'extra' || showBalance) && (
          <>
            {usdPosition === 'extra' ? (
              <span
                className={cn(
                  'text-t-270 font-plex inline-flex min-h-[20px] items-center text-sm',
                  extraTextClassName,
                )}
              >
                {value ? (
                  truncateFormat(
                    usdPx ? calc(value).times(usdPx) : '',
                    usdDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      showMinDecimalValue: true,
                      round: ROUND_MODE.ROUND,
                    },
                  )
                ) : (
                  <span className="invisible">$0.00</span>
                )}
              </span>
            ) : (
              <span />
            )}
            {showBalance && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-sm',
                  extraTextClassName,
                )}
              >
                {showBalanceIcon ? <WalletIcon size={16} /> : null}
                <span className="font-plex inline-flex items-center gap-1">
                  {isLoading ? (
                    <SkeletonLayout isLoading className="h-[16.8px] w-[60px]">
                      <span />
                    </SkeletonLayout>
                  ) : (
                    <span>
                      {truncateFormat(balance, displayDecimal, {
                        round: ROUND_MODE.DOWN,
                        stripTrailingZeros: true,
                        showMinDecimalValue: true,
                      })}
                    </span>
                  )}{' '}
                  {balanceUnit}
                </span>
                {showBalanceMaxAction && !disabled ? (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-t-1100 hover:text-t-270 h-auto p-0 hover:bg-transparent"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (balance && +balance && onPercentChange) {
                        onPercentChange(balance, 'click');
                      }
                    }}
                  >
                    {t`MAX`}
                  </Button>
                ) : null}
              </span>
            )}
          </>
        )
      }
      innerExtra={
        usdPosition === 'inner' &&
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
    />
  );
};

export default InputWIthBtn;
