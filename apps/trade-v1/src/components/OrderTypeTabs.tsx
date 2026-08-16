import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';

import { cn } from '@repo/ui';
import { OrderTypeTabs as BasicOrderTypeTabs } from '@/common';

import { ORDER_TYPE } from '@/constants/enum';

interface OrderTypeTabsProps {
  value: ORDER_TYPE;
  onValueChange: (value: ORDER_TYPE) => void;
  className?: string;
  activeBarClassName?: string;
  itemClassName?: string;
  marketLabel?: string;
}

const OrderTypeTabs: FC<OrderTypeTabsProps> = ({
  value,
  onValueChange,
  className,
  activeBarClassName,
  itemClassName,
  marketLabel,
}) => {
  const { t } = useLingui();

  const shapes = useMemo(() => {
    return {
      [ORDER_TYPE.market]: {
        className: cn(`h-0.5 bg-black dark:bg-white`, activeBarClassName),
        widthCompensation: 0,
        xOffset: 0,
        yOffset: 26,
      },
      [ORDER_TYPE.limit]: {
        className: cn('h-0.5 bg-black dark:bg-white', activeBarClassName),
        widthCompensation: 0,
        xOffset: 0,
        yOffset: 26,
      },
    };
  }, [activeBarClassName]);

  const options = useMemo(() => {
    return [
      {
        value: ORDER_TYPE.market,
        label: marketLabel || t`Market`,
        activeBarProps: shapes[ORDER_TYPE.market],
        className: itemClassName,
      },
      {
        value: ORDER_TYPE.limit,
        label: t`Limit`,
        activeBarProps: shapes[ORDER_TYPE.limit],
        className: itemClassName,
      },
    ];
  }, [t, shapes, marketLabel, itemClassName]);

  return (
    <BasicOrderTypeTabs
      className={cn('border-border w-full border-b-1', className)}
      value={value}
      onValueChange={onValueChange as (value: string) => void}
      options={options}
    />
  );
};

export default OrderTypeTabs;
