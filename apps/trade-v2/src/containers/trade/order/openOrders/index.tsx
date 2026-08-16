import { FC, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';
import { OrderType } from '@hertzflow/sdk-v2/types/orders';
import { useShallow } from 'zustand/react/shallow';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import {
  useCancelOrder,
  useOpenOrders,
  useInstStore,
  usePositions,
} from '@/common';

import EditOrderPriceDialog from '@/components/EditOrderPriceDialog';
import { useOnEditOrderPrice } from '@/components/EditOrderPriceDialog/hooks';

import { ORDER_TAB_VALUE, ORDER_TYPE } from '@/constants/enum';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import { getInactiveTpSlOrderIds } from '@/lib/trade/order';
import { useTradeGlobalStore } from '@/stores/trade/global';

import Operations from '../components/Operations';
import { scrollWithinContainer } from '../scroll';
import { useOrdersStore } from '../store';
import OpenOrdersMd from './md';
import OrderTypeFilter from './OrderTypeFilter';
import OpenOrdersSm from './sm';

interface OpenOrdersProps {
  refetchMark: number;
}

const OpenOrders: FC<OpenOrdersProps> = ({ refetchMark }) => {
  const focusedOrderId = useSearchParams().get('orderFocus');
  const scrolledOrderIdRef = useRef<string | null>(null);
  const [onlyShowCurrentInst, sortingState, orderFilterState, setFilterState] =
    useOrdersStore(
      useShallow((state) => [
        state.onlyShowCurrentInst,
        state.orderSortingState,
        state.orderFilterState,
        state.setFilterState,
      ]),
    );
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const {
    data: orders,
    isLoading,
    refetch,
  } = useOpenOrders({
    instId: onlyShowCurrentInst ? inst?.id : '',
  });
  const { data: positions } = usePositions();
  const [showLoading, setShowLoading] = useState(false);

  useUpdateEffect(() => {
    setShowLoading(true);
    void refetch().finally(() => setShowLoading(false));
  }, [refetchMark]);

  const [curOrderId, setCurOrderId] = useState<string>();
  const {
    onEditOrderPrice,
    dialogOpen: editPriceDialogOpen,
    setDialogOpen: setEditPriceDialogOpen,
  } = useOnEditOrderPrice({ setCurOrderId });

  const inactiveOrderIds = useMemo(
    () => getInactiveTpSlOrderIds(orders, positions),
    [orders, positions],
  );

  const filteredOrders = useMemo(() => {
    const sortDesc = sortingState[0]?.desc;
    const filterValues = Object.fromEntries(
      orderFilterState.map((v) => [v.id, v.value]),
    );
    const orderTypeFilterValue = filterValues['orderType'];
    const result = (orders || [])
      .slice()
      .filter(({ orderType }) => {
        if (orderTypeFilterValue === ORDER_TYPE.limit) {
          return orderType === OrderType.LimitIncrease;
        }
        if (orderTypeFilterValue === ORDER_TYPE.take_profit) {
          return orderType === OrderType.LimitDecrease;
        }
        if (orderTypeFilterValue === ORDER_TYPE.stop_loss) {
          return orderType === OrderType.StopLossDecrease;
        }

        return true;
      })
      .sort((a, b) => {
        return sortDesc ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      });

    return result;
  }, [orders, orderFilterState, sortingState]);

  const { mutateAsync: onCancel } = useCancelOrder({
    refetchOrders: refetch,
  });
  const tableIsLoading = isLoading || showLoading;
  const mediaSz = useMediaQuery();

  useEffect(() => {
    if (
      !focusedOrderId ||
      !orders?.some((order) => order.id === focusedOrderId) ||
      filteredOrders.some((order) => order.id === focusedOrderId)
    ) {
      return;
    }

    setFilterState(ORDER_TAB_VALUE.ORDER, [
      {
        id: 'orderType',
        value: 'all',
      },
    ]);
  }, [filteredOrders, focusedOrderId, orders, setFilterState]);

  useEffect(() => {
    if (
      tableIsLoading ||
      !focusedOrderId ||
      scrolledOrderIdRef.current === focusedOrderId ||
      !filteredOrders.some((order) => order.id === focusedOrderId)
    ) {
      return;
    }

    const orderRow = document.getElementById(
      mediaSz === MEDIA_SIZES.SM
        ? `open-order-item-${focusedOrderId}`
        : `order-table-row-${focusedOrderId}`,
    );
    if (!orderRow) return;

    if (mediaSz === MEDIA_SIZES.SM) {
      const scrollContainer = document.getElementById('openOrders');
      if (!scrollContainer) return;
      scrollWithinContainer({
        container: scrollContainer,
        target: orderRow,
        offset: 48,
      });
    } else {
      orderRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    scrolledOrderIdRef.current = focusedOrderId;
  }, [filteredOrders, focusedOrderId, mediaSz, tableIsLoading]);

  return (
    <>
      <>
        {mediaSz === MEDIA_SIZES.SM ? (
          <Operations
            count={filteredOrders.length}
            onCancelAll={() => onCancel(filteredOrders)}
            extra={<OrderTypeFilter showLabel={false} />}
          />
        ) : null}
      </>
      <div className="scrollbar-none h-full overflow-y-auto" id="openOrders">
        {mediaSz === MEDIA_SIZES.SM ? (
          <div className="pb-[160px]">
            <OpenOrdersSm
              data={filteredOrders}
              focusedOrderId={focusedOrderId}
              inactiveOrderIds={inactiveOrderIds}
              isLoading={tableIsLoading}
              onCancel={onCancel}
              onEditPrice={onEditOrderPrice}
            />
          </div>
        ) : (
          <OpenOrdersMd
            data={filteredOrders}
            focusedOrderId={focusedOrderId}
            inactiveOrderIds={inactiveOrderIds}
            isLoading={tableIsLoading}
            onCancel={onCancel}
            onEditPrice={onEditOrderPrice}
          />
        )}

        {/* edit order price dialog */}
        {curOrderId && (
          <EditOrderPriceDialog
            order={filteredOrders.find((v) => v.id === curOrderId)}
            open={editPriceDialogOpen}
            onOpenChange={setEditPriceDialogOpen}
          />
        )}
      </div>
    </>
  );
};

export default OpenOrders;
