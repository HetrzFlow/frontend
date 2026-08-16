import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';

import { cn } from '@repo/ui';
import { TradeTabs } from '@/common';

import { ORDER_TYPE } from '@/constants/enum';
import OrderTypeTabsContent from './OrderTypeTabsContent';

interface OrderTypeTabsProps {
  className?: string;
  value: string;
  onChange: (v: string) => void;
}

const OrderTypeTabs: FC<OrderTypeTabsProps> = ({ value, onChange }) => {
  const { t } = useLingui();

  const options = useMemo(() => {
    return [
      {
        value: ORDER_TYPE.market,
        label: t`Market Price`,
        activeBarClassName: 'bg-accent',
        content: <OrderTypeTabsContent orderType={ORDER_TYPE.market} />,
      },
      {
        value: ORDER_TYPE['tp/sl'],
        label: t`TP/SL`,
        activeBarClassName: 'bg-accent',
        content: <OrderTypeTabsContent orderType={ORDER_TYPE['tp/sl']} />,
      },
    ];
  }, [t]);

  return (
    <TradeTabs
      className="gap-4"
      listClassName="grid-cols-2"
      contentWrapClassName={cn(
        'transition-[min-height] duration-300',
        value === ORDER_TYPE.market ? 'min-h-[512px]' : 'min-h-[595px]',
      )}
      value={value}
      onValueChange={onChange}
      options={options}
    />
  );
};

export default OrderTypeTabs;
