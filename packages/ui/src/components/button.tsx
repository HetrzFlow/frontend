import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-none hover:transition-[background,color] disabled:cursor-not-allowed disabled:bg-bg-3 disabled:text-t-430 disabled:opacity-100 disabled:hover:bg-bg-3 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer duration-300',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/70',
        destructive:
          'bg-destructive text-white hover:bg-destructive/70 focus-visible:ring-destructive/40',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-bg-3 text-primary-foreground hover:bg-bg-3/70',
        accent:
          'bg-accent text-accent-foreground hover:bg-accent/70',
        accentLight:
          'bg-accent/15 text-accent hover:text-accent/70',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-accent underline-offset-4 hover:underline font-normal',
      },
      size: {
        default: 'h-[32px] text-xs rounded-xl px-3 py-2 has-[>svg]:px-3',
        xs: 'h-[22px] rounded-sm gap-1.5 px-2 py-0.5 has-[>svg]:px-2.5 text-xs',
        sm: 'rounded-lg gap-1.5 px-3 py-0.5 has-[>svg]:px-2.5 text-xs',
        lg: 'h-[32px] text-sm rounded-xl px-4 has-[>svg]:px-2',
        icon: 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      type={type}
      {...props}
    />
  );
}

Button.displayName = 'Button';

export { Button, buttonVariants };
