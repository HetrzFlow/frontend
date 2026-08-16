import { forwardRef } from 'react';

import { cn, NumberInput } from '@repo/ui';
import { useInstStore } from '../stores/instStore';
import CoinIcon from './CoinIcon';

const PriceInput = forwardRef<
  HTMLInputElement,
  {
    className?: string;
    value?: string;
    instId: string;
    disabled?: boolean;
    decimal?: number;
    onValueChange?: (value: string) => void;
  }
>(({ className, value, disabled, instId, decimal, onValueChange }, ref) => {
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
          <CoinIcon src={inst?.icon} size={24} />
          <span className="text-t-1100 text-sm font-medium">{inst?.name}</span>
        </div>
      }
      suffix="USD"
      suffixClassName="text-t-1100 font-plex text-sm pl-2 font-medium"
      inputClassName="text-right font-plex"
      onValueChange={onValueChange}
      max={10 ** 10}
      placeholder={'0.00'}
      decimal={decimal}
    />
  );
});

PriceInput.displayName = 'PriceInput';

export default PriceInput;
