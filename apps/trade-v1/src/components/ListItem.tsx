import React, { FC, ReactNode } from 'react';

import { cn } from '@repo/ui';

const ListItem: FC<{
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  label: ReactNode;
  value: ReactNode;
}> = ({ className, labelClassName, valueClassName, label, value }) => {
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <span className={cn('text-t-270', labelClassName)}>{label}</span>
      <span className={cn('font-plex text-right break-all', valueClassName)}>
        {value}
      </span>
    </div>
  );
};

export default ListItem;
