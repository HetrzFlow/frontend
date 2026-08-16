import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useInstStore, type Order, type Position } from '@/common';
import Table from '@/components/Table';

import { useColumns } from './columns';
import { TpSlTableProvider } from './context';

interface OrdersTableProps {
  orders: Order[];
  position: Position;
  sizeDisplayUnit: '%' | '$';
  onToggleSizeDisplayUnit: () => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  isLoading?: boolean;
}

const OrdersTable: FC<OrdersTableProps> = ({
  orders,
  position,
  sizeDisplayUnit,
  onToggleSizeDisplayUnit,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const { t } = useLingui();
  const inst = useInstStore(
    (state) => state.getInsts()[position.marketAddress || ''],
  );

  const columns = useColumns({
    sizeDisplayUnit,
    pxDispDecimal: inst?.pxDispDecimal,
    onToggleSizeDisplayUnit,
    onEdit,
    onDelete,
  });

  return (
    <TpSlTableProvider value={position}>
      <Table
        columns={columns}
        data={orders}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        emptyMessage={
          <span className="text-t-350 text-sm">{t`No orders`}</span>
        }
        wrapClassName="pb-0"
        headerClassName="bg-transparent"
        headCellClassName="bg-transparent first:bg-transparent last:bg-transparent"
        bodyCellClassName="bg-transparent first:bg-transparent last:bg-transparent group-hover:bg-bg-3!"
      />
    </TpSlTableProvider>
  );
};

export default OrdersTable;
