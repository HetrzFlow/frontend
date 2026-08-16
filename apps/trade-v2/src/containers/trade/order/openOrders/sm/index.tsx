import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Loading } from '@repo/ui';
import type { Order } from '@/common';

import OrderItem from './OrderItem';

import type { UseMutateAsyncFunction } from '@tanstack/react-query';

interface OpenOrdersProps {
  data: Order[];
  inactiveOrderIds: Set<string>;
  isLoading: boolean;
  onCancel: UseMutateAsyncFunction<void, Error, Order[], unknown>;
  onEditPrice: (id: string) => void;
  focusedOrderId: string | null;
}
const OpenOrdersSm: FC<OpenOrdersProps> = ({
  isLoading,
  data,
  inactiveOrderIds,
  onCancel,
  onEditPrice,
  focusedOrderId,
}) => {
  const { t } = useLingui();

  if (isLoading) {
    return <Loading className="h-20 rounded-xl bg-transparent" />;
  }

  if (!data.length) {
    return (
      <div className={'text-t-350 mt-6 h-20 text-center text-sm'}>
        {t`No pending orders found.`}
      </div>
    );
  }

  return data.map((itemData) => {
    return (
      <div
        id={
          itemData.id === focusedOrderId
            ? `open-order-item-${itemData.id}`
            : undefined
        }
        key={itemData.id}
        style={{
          scrollMarginTop: itemData.id === focusedOrderId ? 48 : undefined,
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 196px',
        }}
      >
        <OrderItem
          order={itemData}
          isInactive={inactiveOrderIds.has(itemData.id)}
          onCancelOrders={onCancel}
          onEditPrice={onEditPrice}
        />
      </div>
    );
  });
};

export default OpenOrdersSm;
