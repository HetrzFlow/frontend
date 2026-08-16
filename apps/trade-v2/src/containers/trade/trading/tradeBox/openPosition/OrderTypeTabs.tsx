import { FC, useMemo, useEffect } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@repo/ui';
import { OrderTypeTabs as BasicOrderTypeTabs } from '@/common';
import { ORDER_TYPE } from '@/constants/enum';
import { useTradeStore } from '../../store';
import { useIsZFP } from './hooks/useIsZFP';

interface OrderTypeTabsProps {
  className?: string;
}

const OrderTypeTabs: FC<OrderTypeTabsProps> = ({ className }) => {
  const { t } = useLingui();
  const [orderType, setOrderType] = useTradeStore(
    useShallow((state) => [
      state.orderType as ORDER_TYPE.limit | ORDER_TYPE.market,
      state.setOrderType,
    ]),
  );
  const isZFP = useIsZFP();

  // When switching to hyper mode while on limit, force back to market
  useEffect(() => {
    if (isZFP && orderType === ORDER_TYPE.limit) {
      setOrderType(ORDER_TYPE.market);
    }
  }, [isZFP, orderType, setOrderType]);

  const shapes = useMemo(() => {
    return {
      [ORDER_TYPE.market]: {
        className: 'h-0.5 bg-white bottom-0',
        widthCompensation: 0,
        xOffset: 0,
        yOffset: 26,
      },
      [ORDER_TYPE.limit]: {
        className: 'h-0.5 bg-white',
        widthCompensation: 0,
        xOffset: 0,
        yOffset: 26,
      },
    };
  }, []);

  const options = useMemo(() => {
    const itemClassName = 'text-t-270 hover:text-t-1100';
    return [
      {
        value: ORDER_TYPE.market,
        label: t`Market Price`,
        activeBarProps: shapes[ORDER_TYPE.market],
        className: itemClassName,
      },
      {
        value: ORDER_TYPE.limit,
        label: t`Limit`,
        activeBarProps: shapes[ORDER_TYPE.limit],
        className: itemClassName,
        disabled: isZFP,
      },
    ];
  }, [t, shapes, isZFP]);

  return (
    <BasicOrderTypeTabs
      className={cn('border-border w-full border-b-1', className)}
      value={orderType}
      onValueChange={setOrderType as (value: string) => void}
      options={options}
    />
  );
};

export default OrderTypeTabs;
