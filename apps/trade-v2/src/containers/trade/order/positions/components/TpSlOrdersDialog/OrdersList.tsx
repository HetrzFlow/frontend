import { FC, useMemo } from 'react';

import type { Order, Position } from '@/common';

import OrderCard from './OrderCard';
import OrdersContainer from './OrdersContainer';

interface OrdersListProps {
  orders: Order[];
  position: Position;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

const OrdersList: FC<OrdersListProps> = ({
  orders,
  position,
  onEdit,
  onDelete,
}) => {
  const listContent = useMemo(
    () => (
      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    ),
    [onDelete, onEdit, orders],
  );

  return (
    <OrdersContainer position={position} isEmpty={orders.length === 0}>
      {listContent}
    </OrdersContainer>
  );
};

export default OrdersList;
