import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc, ROUND_MODE, truncate } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import { cn, NumberInput, WalletIcon } from '@repo/ui';
import { CoinSzInputProps } from './types';

const InputWIthBtn: FC<CoinSzInputProps> = ({
  label,
  value,
  disabled,
  className,
  showBalance = true,
  decimal,
  usdPx,
  usdDecimal,
  balance,
  balanceUnit,
  inputSuffix,
  isLoading,
  onValueChange,
  onPercentChange,
}) => {
  const { t } = useLingui();
  return (
    <NumberInput
      label={
        <div className="flex w-full items-center justify-between font-normal">
          <span className="text-muted-foreground text-sm">{label}</span>
          <div className="text-secondary-foreground flex items-center gap-2 text-center">
            {showBalance && (
              <>
                <span
                  className="bg-primary font-plex hover:text-primary-foreground cursor-pointer rounded-sm px-2 py-1 text-xs"
                  onClick={() =>
                    balance &&
                    +balance &&
                    onPercentChange &&
                    onPercentChange(
                      truncate(calc(balance).times(0.25), decimal),
                      'click',
                    )
                  }
                >
                  {percentFormat(0.25, 0)}
                </span>
                <span
                  className="bg-primary font-plex hover:text-primary-foreground cursor-pointer rounded-sm px-2 py-1 text-xs"
                  onClick={() =>
                    balance &&
                    +balance &&
                    onPercentChange &&
                    onPercentChange(
                      truncate(calc(balance).times(0.5), decimal),
                      'click',
                    )
                  }
                >
                  {percentFormat(0.5, 0)}
                </span>
                <span
                  className="bg-primary font-plex hover:text-primary-foreground cursor-pointer rounded-sm px-2 py-1 text-xs"
                  onClick={() =>
                    balance &&
                    +balance &&
                    onPercentChange &&
                    onPercentChange(
                      truncate(calc(balance).times(0.75), decimal),
                      'click',
                    )
                  }
                >
                  {percentFormat(0.75, 0)}
                </span>
                <span
                  className="bg-primary font-plex hover:text-primary-foreground cursor-pointer rounded-sm px-2 py-1 text-xs"
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
            )}
          </div>
        </div>
      }
      className={cn('p-4', className)}
      value={value}
      disabled={disabled}
      isLoading={isLoading}
      variant="ghost"
      inputWrapClassName="h-[50px]"
      inputClassName="text-2xl h-[28px] font-plex"
      onValueChange={onValueChange}
      placeholder={'0.00'}
      decimal={decimal}
      max={Math.min(
        +(!showBalance || balance === undefined || balance === ''
          ? Infinity
          : balance),
        10 ** 10,
      )}
      suffix={inputSuffix}
      innerExtra={
        value && (
          <span className="font-plex">
            {truncateFormat(usdPx ? calc(value).times(usdPx) : '', usdDecimal, {
              style: 'currency',
              currency: 'USD',
              showMinDecimalValue: true,
            })}
          </span>
        )
      }
      extra={
        showBalance && (
          <>
            {/* wallet balance */}
            <span className="inline-flex items-center gap-1 text-sm">
              <WalletIcon size={16} />
              <span className="font-plex">
                {truncateFormat(balance, decimal, {
                  round: ROUND_MODE.DOWN,
                  stripTrailingZeros: true,
                })}{' '}
                {balanceUnit}
              </span>
            </span>
          </>
        )
      }
    />
  );
};

export default InputWIthBtn;
