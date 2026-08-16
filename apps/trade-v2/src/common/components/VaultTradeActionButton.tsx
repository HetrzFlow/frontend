import type { ComponentProps } from 'react';
import { Button, cn } from '@repo/ui';

interface VaultTradeActionButtonProps
  extends Omit<ComponentProps<typeof Button>, 'variant'> {
  action: 'deposit' | 'withdraw';
  emphasized?: boolean;
  variant?: 'vault' | 'genesis';
}

const VaultTradeActionButton = ({
  action,
  emphasized = true,
  variant = 'vault',
  className,
  ...props
}: VaultTradeActionButtonProps) => (
  <Button
    className={cn(
      'h-auto min-h-8 w-full px-3 py-2 text-center text-sm/tight whitespace-normal',
      variant === 'genesis'
        ? 'bg-accent hover:bg-accent/90 disabled:bg-bg-5 disabled:text-t-430 disabled:hover:bg-bg-5 text-black disabled:opacity-100'
        : 'text-accent-foreground max-md:disabled:bg-bg-4 max-md:disabled:hover:bg-bg-4',
      emphasized
        ? variant === 'genesis'
          ? ''
          : action === 'deposit'
            ? 'bg-up hover:bg-up/90'
            : 'bg-down hover:bg-down/90'
        : '',
      className,
    )}
    {...props}
  />
);

export default VaultTradeActionButton;
