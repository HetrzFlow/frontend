import { FC, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { thoFormat } from '@repo/lib/format';

import { SHOW_LP_PENDING_ORDERS } from '@/constants/common';
import PendingOrdersList, {
  usePendingLiquidityOrders,
} from '@/containers/pools/PoolsDetail/components/ActivityPanel/PendingOrdersList';
import {
  ActionFilter,
  ActivityTabType,
} from '@/containers/pools/PoolsDetail/components/ActivityPanel/types';
import { useStore } from '../../store';
import ListLayout from '../components/ListLayout';

interface PendingLiquidityOrdersProps {
  type: ActivityTabType;
  ordersQuery: ReturnType<typeof usePendingLiquidityOrders>;
}

const PendingLiquidityOrders: FC<PendingLiquidityOrdersProps> = ({
  type,
  ordersQuery,
}) => {
  const { t } = useLingui();
  const [actionFilter, setActionFilter] = useState(ActionFilter.ALL);
  const isPool = type === ActivityTabType.POOL;
  const { open, setOpen } = useStore(
    useShallow((state) =>
      isPool
        ? {
            open: state.pendingPoolOrdersOpen,
            setOpen: state.setPendingPoolOrdersOpen,
          }
        : {
            open: state.pendingVaultOrdersOpen,
            setOpen: state.setPendingVaultOrdersOpen,
          },
    ),
  );

  if (!SHOW_LP_PENDING_ORDERS || !ordersQuery.data?.length) {
    return null;
  }

  const title = isPool ? t`Pending Pool Orders` : t`Pending Vault Orders`;

  return (
    <ListLayout
      open={open}
      onOpenChange={setOpen}
      title={
        <div className="text-t-1100 flex items-center gap-1 font-medium">
          {title}
          <span className="bg-t-1100/10 inline-block min-w-5 rounded-sm p-0.5 align-middle text-xs">
            {thoFormat(ordersQuery.data.length)}
          </span>
        </div>
      }
      listContent={
        <PendingOrdersList
          ordersQuery={ordersQuery}
          layout="card"
          actionFilter={actionFilter}
          onActionFilterChange={setActionFilter}
          portfolioStyle
        />
      }
    />
  );
};

export default PendingLiquidityOrders;
