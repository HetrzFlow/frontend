import { forwardRef, ReactNode } from 'react';

import { cn } from '../../lib/utils';

interface GradientBorderProps {
  outerClassName?: string;
  innerClassName?: string;
  children?: ReactNode;
}

const GradientBorder = forwardRef<HTMLDivElement, GradientBorderProps>(
  ({ outerClassName, innerClassName, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flow-root border-0 before:absolute before:inset-0 before:z-[-1] before:rounded-[16px] before:border before:border-transparent before:bg-[linear-gradient(var(--border-color-gradient),transparent)] before:bg-origin-border before:content-[\'\'] before:[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] before:[mask-composite:exclude]',
          outerClassName,
        )}
      >
        <div
          className={cn(
            'm-[1px] h-[calc(100%-2px)] bg-transparent',
            innerClassName,
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);

GradientBorder.displayName = 'GradientBorder';

export { GradientBorder };
