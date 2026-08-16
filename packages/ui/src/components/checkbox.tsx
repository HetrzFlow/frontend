import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import CheckIcon from '../icons/Check';
import { cn } from '../lib/utils';

function Checkbox({
  className,
  checked,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  indicatorClassName?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer border-border-2 data-[state=indeterminate]:border-accent data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-[18px] shrink-0 rounded-xs border-2 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      checked={checked}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          'text-accent-foreground flex size-full scale-200 items-center justify-center transition-none',
          indicatorClassName,
        )}
      >
        {checked === 'indeterminate' ? (
          <span className="bg-accent-foreground inline-block h-px w-1"></span>
        ) : (
          <CheckIcon size={10} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
