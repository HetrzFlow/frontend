'use client';

import { type ReactNode, useCallback } from 'react';
import { parseUnits } from 'viem';
import { calc, truncate } from '@repo/lib/calc';
import { cn } from '@repo/ui';
import { ZERO_STR } from '@/common/constants';
import InputValidationTooltip from '@/components/InputValidationTooltip';
import CoinSzInput from './CoinSzInput';

const MAX_INPUT_LENGTH = 30;

export interface VaultTradeInputValue {
  value?: string;
  coin?: string;
}

export interface VaultTradeInputProps {
  label: string;
  value: VaultTradeInputValue;
  showBalance: boolean;
  isDeposit: boolean;
  variant?: 'vault' | 'genesis';
  emphasized?: boolean;
  inputSuffix: ReactNode;
  onChange: (value: VaultTradeInputValue, rawAmount?: bigint) => void;
  usdPx?: string;
  disabled?: boolean;
  isLoading?: boolean;
  keepInputOnLoading?: boolean;
  balance?: string;
  balanceUnit?: string;
  decimal?: number;
  displayDecimal?: number;
  calcDecimal?: number;
  errorMessage?: ReactNode;
  onErrorMessageClick?: () => void;
}

const VaultTradeInput = ({
  label,
  value,
  showBalance,
  isDeposit,
  variant = 'vault',
  emphasized = false,
  inputSuffix,
  onChange,
  usdPx,
  disabled,
  isLoading,
  keepInputOnLoading,
  balance = ZERO_STR,
  balanceUnit,
  decimal,
  displayDecimal = 6,
  calcDecimal,
  errorMessage,
  onErrorMessageClick,
}: VaultTradeInputProps) => {
  const isGenesis = variant === 'genesis';

  const handleValueChange = useCallback(
    (nextValue: string) => {
      if (balance && nextValue && !isNaN(Number(nextValue))) {
        const maxValue = calc(balance);
        if (maxValue.gt(0) && calc(nextValue).gt(maxValue)) {
          const displayValue = truncate(balance, displayDecimal, {
            stripTrailingZeros: false,
          });
          let rawAmount: bigint | undefined;
          if (calcDecimal !== undefined) {
            try {
              rawAmount = parseUnits(balance, calcDecimal);
            } catch {
              rawAmount = undefined;
            }
          }
          onChange({ value: displayValue, coin: value.coin }, rawAmount);
          return;
        }
      }

      onChange({ value: nextValue, coin: value.coin });
    },
    [balance, calcDecimal, displayDecimal, onChange, value.coin],
  );

  const handlePercentChange = useCallback(
    (percentValue: string) => {
      const sanitizedValue = percentValue || ZERO_STR;
      let rawAmount: bigint | undefined;
      if (calcDecimal !== undefined) {
        try {
          rawAmount = parseUnits(sanitizedValue, calcDecimal);
        } catch {
          rawAmount = undefined;
        }
      }
      const displayValue = truncate(sanitizedValue, displayDecimal, {
        stripTrailingZeros: false,
      });
      onChange({ value: displayValue, coin: value.coin }, rawAmount);
    },
    [calcDecimal, displayDecimal, onChange, value.coin],
  );

  return (
    <InputValidationTooltip
      triggerClassName="font-plex invisible absolute top-13 left-5 text-2xl font-medium"
      triggerValue={value.value}
      hasError={!!errorMessage}
      message={errorMessage}
      onMessageClick={onErrorMessageClick}
      tooltipContentClassName={cn(
        'pointer-events-auto mx-2',
        isGenesis && 'bg-bg-5',
      )}
      tooltipContentProps={{
        side: 'top',
        sideOffset: 0,
        ...(isGenesis
          ? {
              arrowClassName: 'bg-bg-5 fill-bg-5',
            }
          : {}),
      }}
    >
      {({ onBlur, onFocus }) => (
        <div onFocusCapture={onFocus} onBlurCapture={onBlur}>
          <CoinSzInput
            disabled={disabled}
            label={label}
            labelClassName="text-t-350 text-xs"
            className={cn(
              'gap-2 p-3',
              isGenesis && emphasized && 'bg-bg-4',
              variant === 'vault' &&
                showBalance &&
                !errorMessage &&
                'max-md:border-border',
              errorMessage
                ? 'border-destructive focus-within:border-destructive'
                : '',
            )}
            balance={balance}
            usdPx={usdPx}
            isLoading={!!isLoading}
            keepInputOnLoading={keepInputOnLoading}
            showBalance={showBalance}
            allowInputWhenBalanceZero
            balanceUnit={balanceUnit ?? (isDeposit ? '' : 'HzV')}
            value={value.value ?? ''}
            decimal={decimal}
            dispDecimal={2}
            calcDecimal={calcDecimal}
            maxLength={MAX_INPUT_LENGTH}
            onValueChange={handleValueChange}
            onPercentChange={handlePercentChange}
            inputWrapClassName="h-[36px]"
            suffixClassName="self-center pl-3"
            showPercentActionsOnFocus
            percentActionsClassName="gap-1.5"
            percentButtonClassName="border-border text-t-350 h-6 rounded-md border bg-transparent px-2 py-0 text-xs hover:text-t-1100"
            showBalanceIcon={false}
            showBalanceMaxAction={isGenesis}
            extraClassName={cn(
              'mt-2 flex items-center justify-between gap-2',
              isGenesis ? 'h-[14px] min-h-0' : 'min-h-[20px]',
            )}
            extraTextClassName="text-xs"
            inputSuffix={inputSuffix}
            usdPosition="extra"
          />
        </div>
      )}
    </InputValidationTooltip>
  );
};

export default VaultTradeInput;
