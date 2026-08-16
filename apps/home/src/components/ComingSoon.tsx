'use client';

import { ReactNode, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { cn, toast } from '@repo/ui';

const ComingSoon = ({
  children,
  className,
  popupClassName,
}: {
  children: ReactNode;
  className?: string;
  popupClassName?: string;
}) => {
  const { t } = useLingui();
  const [hover, setHover] = useState(false);
  return (
    <>
      <div
        className={cn('relative flex cursor-not-allowed lg:hidden', className)}
        onClick={() => {
          toast(t`Coming Soon`);
        }}
      >
        {children}
      </div>
      <div
        className={cn('relative hidden cursor-not-allowed lg:flex', className)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
        {hover && (
          <span
            className={cn(
              'bg-bg-4 absolute top-1/2 left-21 -translate-y-1/2 rounded-sm px-2 py-1 text-xs whitespace-nowrap',
              popupClassName,
            )}
          >{t`Coming Soon`}</span>
        )}
      </div>
    </>
  );
};

export default ComingSoon;
