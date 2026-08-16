import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import InfoCircleIcon from '../icons/InfoCircle';
import XIcon from '../icons/X';
import { cn } from '../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl items-center px-4 py-1.5 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr_calc(var(--spacing)*5)] grid-cols-[0_1fr_0] has-[>svg]:gap-x-2 gap-y-0.5 [&>svg]:size-4 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-warning/10 text-warning',
        destructive:
          'text-destructive bg-destructive/10 [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({
  className,
  variant,
  icon,
  showClose = true,
  open = true,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof alertVariants> & {
    icon?: React.ReactNode;
    showClose?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) {
  return (
    open && (
      <div
        data-slot="alert"
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {icon ?? <InfoCircleIcon />}
        {children}
        {showClose ? (
          <XIcon
            onClick={() => onOpenChange && onOpenChange(false)}
            className="!text-warning hover:!text-warning/70 col-start-3 row-start-1 cursor-pointer"
          />
        ) : null}
      </div>
    )
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 flex flex-col justify-center justify-items-start gap-1 text-sm text-xs [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
