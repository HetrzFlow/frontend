import { FC, useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import {
  useCancelOrder,
  PAGE_LIMIT,
  useOpenOrders,
  useInstStore,
} from '@/common';

import EditOrderPriceDialog from '@/components/EditOrderPriceDialog';
import { useOnEditOrderPrice } from '@/components/EditOrderPriceDialog/hooks';

import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import { useGlobalStore } from '@/stores/trade/global';

import Operations from '../components/Operations';
import { useOrdersStore } from '../store';
import OpenOrdersMd from './md';
import OpenOrdersSm from './sm';

interface OpenOrdersProps {
  refetchMark: number;
}

const OpenOrders: FC<OpenOrdersProps> = ({ refetchMark }) => {
  const [onlyShowCurrentInst, sortingState, orderFilterState] = useOrdersStore(
    useShallow((state) => [
      state.onlyShowCurrentInst,
      state.orderSortingState,
      state.orderFilterState,
    ]),
  );
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const {
    data: orders,
    isLoading,
    refetch,
  } = useOpenOrders({
    coinType: onlyShowCurrentInst ? inst?.baseCoin : '',
    // 5s refetch
    refetchInterval: 5000,
  });
  const [showLoading, setShowLoading] = useState(false);
  useUpdateEffect(() => {
    setShowLoading(true);
    refetch().finally(() => {
      setShowLoading(false);
    });
  }, [refetchMark]);

  const [currentPage, setCurrentPage] = useState(1);

  const [curOrderId, setCurOrderId] = useState<string>();
  const {
    onEditOrderPrice,
    dialogOpen: editPriceDialogOpen,
    setDialogOpen: setEditPriceDialogOpen,
  } = useOnEditOrderPrice({ setCurOrderId });

  const total = orders?.length || 0;
  // filter
  const filteredOrders = useMemo(() => {
    const sortDesc = sortingState[0]?.desc;
    const filterValues = Object.fromEntries(
      orderFilterState.map((v) => [v.id, v.value]),
    );
    const sideFilterValue = filterValues['side'];
    const result = (orders || [])
      .slice()
      .filter(({ isBuy, isLong }) => {
        if (sideFilterValue === 'openLong') {
          return isBuy && isLong;
        }
        if (sideFilterValue === 'openShort') {
          return !isBuy && !isLong;
        }
        if (sideFilterValue === 'closeLong') {
          return !isBuy && isLong;
        }
        if (sideFilterValue === 'closeShort') {
          return isBuy && !isLong;
        }
        return true;
      })
      .sort((a, b) => {
        return sortDesc ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      });

    return result.slice(0, currentPage * PAGE_LIMIT) || [];
  }, [orders, currentPage, orderFilterState, sortingState]);

  const { mutate: onCancel } = useCancelOrder({ refetchOrders: refetch });

  const tableIsLoading = isLoading || showLoading;
  const mediaSz = useMediaQuery();
  return (
    <div className="h-full" id="openOrders">
      {mediaSz === MEDIA_SIZES.SM ? (
        <div className="pb-[124px]">
          <Operations
            count={filteredOrders.length}
            onCancelAll={() => onCancel(filteredOrders)}
          />
          <OpenOrdersSm
            data={filteredOrders}
            isLoading={tableIsLoading}
            total={total}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onCancel={onCancel}
            onEditPrice={onEditOrderPrice}
          />
        </div>
      ) : (
        <OpenOrdersMd
          data={filteredOrders}
          isLoading={tableIsLoading}
          total={total}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onCancel={onCancel}
          onEditPrice={onEditOrderPrice}
        />
      )}

      {/* edit order price dialog */}
      {curOrderId && (
        <EditOrderPriceDialog
          orderId={curOrderId}
          open={editPriceDialogOpen}
          onOpenChange={setEditPriceDialogOpen}
        />
      )}
    </div>
  );
};

export default OpenOrders;
