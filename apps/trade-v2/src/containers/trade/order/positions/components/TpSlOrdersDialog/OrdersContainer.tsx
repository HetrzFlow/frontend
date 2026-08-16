import { FC, ReactNode, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import type { Position } from '@/common';

import { TpSlTableProvider } from './context';

interface OrdersContainerProps {
  position: Position;
  emptyClassName?: string;
  children: ReactNode;
  isEmpty?: boolean;
}

const OrdersContainer: FC<OrdersContainerProps> = ({
  position,
  emptyClassName = 'flex min-h-40 items-center justify-center',
  children,
  isEmpty,
}) => {
  const { t } = useLingui();

  const emptyMessage = useMemo(
    () => (
      <div className={emptyClassName}>
        <span className="text-t-350 text-sm">{t`No orders`}</span>
      </div>
    ),
    [emptyClassName, t],
  );

  if (isEmpty) return emptyMessage;

  return <TpSlTableProvider value={position}>{children}</TpSlTableProvider>;
};

export default OrdersContainer;
