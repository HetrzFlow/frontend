'use client';

import {
  FocusEventHandler,
  forwardRef,
  MouseEventHandler,
  ReactNode,
  useEffect,
  useState,
} from 'react';

import { useLingui } from '@lingui/react/macro';
import { CoinIcon } from '@repo/common/components';
import { cn, NumberInput } from '@repo/ui';
import { useInstStore } from '../stores/instStore';

const PriceInput = forwardRef<
  HTMLInputElement,
  {
    className?: string;
    value?: string;
    instId: string;
    disabled?: boolean;
    decimal?: number;
    suffix?: ReactNode;
    onValueChange?: (value: string) => void;
    onBlur?: FocusEventHandler<HTMLInputElement>;
    onFocus?: FocusEventHandler<HTMLInputElement>;
    onMouseEnter?: MouseEventHandler<HTMLInputElement>;
    onMouseLeave?: MouseEventHandler<HTMLInputElement>;
  }
>(
  (
    {
      className,
      value,
      disabled,
      instId,
      decimal,
      suffix,
      onValueChange,
      onBlur,
      onFocus,
      onMouseEnter,
      onMouseLeave,
    },
    ref,
  ) => {
    const [mounted, setMounted] = useState(false);
    const {
      i18n: { locale },
    } = useLingui();

    useEffect(() => {
      setMounted(true);
    }, []);
    const inst = useInstStore((state) => state.getInst(state, instId));

    return (
      <NumberInput
        ref={ref}
        variant="ghost"
        className={cn('px-4', className)}
        value={value}
        disabled={disabled}
        prefix={
          <div className="flex items-center gap-2">
            <CoinIcon src={inst?.icon} size={20} />
            <span className="text-t-1100 text-sm font-medium">
              {mounted ? inst?.name : null}
            </span>
          </div>
        }
        suffix={suffix || 'USD'}
        suffixClassName="text-t-1100 font-plex pl-2 text-sm font-medium"
        inputClassName="text-right text-sm font-plex"
        onValueChange={onValueChange}
        max={10 ** 10}
        placeholder={'0.00'}
        decimal={decimal}
        locale={locale}
        onBlur={onBlur}
        onFocus={onFocus}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  },
);

PriceInput.displayName = 'PriceInput';

export default PriceInput;
