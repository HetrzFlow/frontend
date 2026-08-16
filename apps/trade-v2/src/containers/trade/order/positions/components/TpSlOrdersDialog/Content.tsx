'use client';

import { FC, useCallback, useMemo } from 'react';

import { calc } from '@repo/lib/calc';
import { MEDIA_SIZES, useMediaQuery } from '@repo/ui';
import { type Position, type Order } from '@/common/services';

import EditOrderPriceDialog from '@/components/EditOrderPriceDialog';

import AddTpSlDialog from '../AddTpSlDialog';
import ActionButtons from './ActionButtons';
import { useCancelAllTpSl } from './hooks/useCancelAll';
import { useTpSlOrdersDialogState } from './hooks/useDialogState';
import { usePositionOrders } from './hooks/usePositionOrders';
import OrdersList from './OrdersList';
import OrdersTable from './OrdersTable';
import PositionInfoCard from './PositionInfoCard';
import TabFilter from './TabFilter';

interface ContentProps {
  position: Position;
}

const Content: FC<ContentProps> = ({ position }) => {
  const mediaSize = useMediaQuery();
  const isSm = mediaSize === MEDIA_SIZES.SM;
  const {
    activeTab,
    setActiveTab,
    sizeFilter,
    setSizeFilter,
    sizeDisplayUnit,
    editOrder,
    editDialogOpen,
    addDialogOpen,
    setAddDialogOpen,
    handleEdit,
    handleEditDialogOpenChange,
    handleAddTpSl,
    toggleSizeDisplayUnit,
  } = useTpSlOrdersDialogState();

  const { tpSlOrders, tpOrders, slOrders, refetch } =
    usePositionOrders(position);
  const { mutateAsync: cancelAll } = useCancelAllTpSl();

  const tabFilteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'tp':
        return tpOrders;
      case 'sl':
      default:
        return slOrders;
    }
  }, [activeTab, tpOrders, slOrders]);

  const filteredOrders = useMemo(() => {
    const orders = [...tabFilteredOrders];
    const isLong = position.isLong;
    const isTp = activeTab === 'tp';
    // Sort by first-to-trigger price:
    // Long+TP / Short+SL: ascending; Long+SL / Short+TP: descending
    const asc = isLong ? isTp : !isTp;
    orders.sort((a, b) => {
      const aGtB = calc(a.triggerPrice).gt(b.triggerPrice);
      return asc ? (aGtB ? 1 : -1) : aGtB ? -1 : 1;
    });
    return orders;
  }, [tabFilteredOrders, position.isLong, activeTab]);

  const cancelTargetOrders = filteredOrders;

  const handleDelete = useCallback(
    (order: Order) => cancelAll({ orders: [order] }),
    [cancelAll],
  );

  const handleCancelOrders = useCallback(
    async (orders: Order[]) => {
      await cancelAll({ orders });
    },
    [cancelAll],
  );

  return (
    <div className="flex flex-col gap-1">
      <PositionInfoCard position={position} />

      <div className="flex items-center justify-between pt-3">
        <TabFilter
          tpCount={tpOrders.length}
          slCount={slOrders.length}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sizeFilter={isSm ? sizeFilter : undefined}
          onSizeFilterChange={isSm ? setSizeFilter : undefined}
        />
        {!isSm && (
          <ActionButtons
            isSm={false}
            orders={cancelTargetOrders}
            onAddTpSl={handleAddTpSl}
            onCancel={handleCancelOrders}
          />
        )}
      </div>

      {isSm ? (
        <div className="mt-2 max-h-100 min-h-40">
          <OrdersList
            orders={filteredOrders}
            position={position}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      ) : (
        <div className="max-h-100 min-h-40">
          <OrdersTable
            orders={filteredOrders}
            position={position}
            sizeDisplayUnit={sizeDisplayUnit}
            onToggleSizeDisplayUnit={toggleSizeDisplayUnit}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {isSm && (
        <ActionButtons
          isSm
          orders={cancelTargetOrders}
          onAddTpSl={handleAddTpSl}
          onCancel={handleCancelOrders}
        />
      )}

      <AddTpSlDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        position={position}
      />

      {editOrder && (
        <EditOrderPriceDialog
          open={editDialogOpen}
          onOpenChange={(open, modified) => {
            handleEditDialogOpenChange(open);
            if (!open && modified) {
              refetch();
            }
          }}
          order={editOrder}
          sizeEditable
          allOrders={tpSlOrders}
        />
      )}
    </div>
  );
};

export default Content;
