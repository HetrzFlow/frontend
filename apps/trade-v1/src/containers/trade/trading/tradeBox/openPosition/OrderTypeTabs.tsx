import { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';
import BasicOrderTypeTabs from '@/components/OrderTypeTabs';
import { ORDER_TYPE } from '@/constants/enum';
import { useTradeStore } from '../../store';

interface OrderTypeTabsProps {
  className?: string;
}

const OrderTypeTabs: FC<OrderTypeTabsProps> = ({ className }) => {
  const [orderType, setOrderType] = useTradeStore(
    useShallow((state) => [
      state.orderType as ORDER_TYPE.limit | ORDER_TYPE.market,
      state.setOrderType,
    ]),
  );

  return (
    <BasicOrderTypeTabs
      value={orderType}
      onValueChange={setOrderType}
      className={className}
      itemClassName="text-t-1100 hover:text-secondary-foreground"
    />
  );
};

export default OrderTypeTabs;
