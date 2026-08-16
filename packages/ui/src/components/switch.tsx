import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '../lib/utils';

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      aria-label=""
      className={cn(
        'peer data-[state=checked]:bg-accent/10 data-[state=unchecked]:bg-bg-3 data-[state=unchecked]:bg-bg-3-h5 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-4 w-7.5 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'data-[state=unchecked]:bg-t-430 data-[state=checked]:bg-accent pointer-events-none block size-3 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%+2px)] data-[state=unchecked]:translate-x-[2px]',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
