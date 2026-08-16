import { FC, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import { usePositions, useInstStore } from '@/common';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import { useGlobalStore } from '@/stores/trade/global';

import Operations from '../components/Operations';
import { useOrdersStore } from '../store';
import CloseAllDialog from './CloseAllDialog';
import CloseDialog from './CloseDialog';
import EditCollateralDialog from './EditCollateralDialog';
import PositionsMd from './md';
import OrdersDialog from './OrdersDialog';
import ShareDialog from './ShareDialog';
import PositionsSm from './sm';
import {
  useOnClose,
  useOnCloseAll,
  useOnEditCollateral,
  useOnOpenShareDialog,
  useOnShowOrders,
} from './useActions';

interface PositionsProps {
  refetchMark: number;
}

const Positions: FC<PositionsProps> = ({ refetchMark }) => {
  const { data: positions, isLoading, refetch } = usePositions(5000); // 5s refetch
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const [onlyShowCurrentInst] = useOrdersStore(
    useShallow((state) => [
      state.onlyShowCurrentInst,
      state.positionSortingState,
      state.setSortingState,
    ]),
  );
  const filteredPositions = onlyShowCurrentInst
    ? positions?.filter((position) => position.targetCoin === inst?.coinType)
    : positions;
  const [curPositionId, setCurPositionId] = useState<string>();
  const {
    onClose,
    dialogOpen: closeDialogOpen,
    setDialogOpen: setCloseDialogOpen,
  } = useOnClose({ setCurPositionId });
  const {
    onCloseAll,
    dialogOpen: closeAllDialogOpen,
    setDialogOpen: setCloseAllDialogOpen,
  } = useOnCloseAll();
  const {
    onEditCollateral,
    dialogOpen: collateralDialogOpen,
    setDialogOpen: setCollateralDialogOpen,
  } = useOnEditCollateral({ setCurPositionId });
  const {
    onShowOrders,
    dialogOpen: ordersDialogOpen,
    setDialogOpen: setOrdersDialogOpen,
  } = useOnShowOrders({ setCurPositionId });
  const {
    onOpenShareDialog,
    dialogOpen: shareDialogOpen,
    setDialogOpen: setShareDialogOpen,
  } = useOnOpenShareDialog({ setCurPositionId });

  const [showLoading, setShowLoading] = useState(false);
  useUpdateEffect(() => {
    setShowLoading(true);
    refetch().finally(() => {
      setShowLoading(false);
    });
  }, [refetchMark]);

  const mediaSz = useMediaQuery();

  return (
    <div className="scrollbar-none h-full overflow-y-auto" id="positions">
      {mediaSz === MEDIA_SIZES.SM ? (
        <div className="pb-[124px]">
          <Operations
            count={filteredPositions?.length}
            onCloseAll={onCloseAll}
          />
          <PositionsSm
            data={filteredPositions || []}
            isLoading={isLoading || showLoading}
            onClose={onClose}
            onCloseAll={onCloseAll}
            onEditCollateral={onEditCollateral}
            onShowOrders={onShowOrders}
            onOpenShareDialog={onOpenShareDialog}
          />
        </div>
      ) : (
        <PositionsMd
          data={filteredPositions || []}
          isLoading={isLoading || showLoading}
          onClose={onClose}
          onCloseAll={onCloseAll}
          onEditCollateral={onEditCollateral}
          onShowOrders={onShowOrders}
          onOpenShareDialog={onOpenShareDialog}
        />
      )}

      {/* orders dialog */}
      {curPositionId && (
        <OrdersDialog
          positionId={curPositionId}
          open={ordersDialogOpen}
          onOpenChange={setOrdersDialogOpen}
        />
      )}

      {/*( close all positions dialog */}
      <CloseAllDialog
        open={closeAllDialogOpen}
        onOpenChange={setCloseAllDialogOpen}
      />

      {/* edit collateral dialog */}
      {curPositionId && (
        <EditCollateralDialog
          positionId={curPositionId}
          open={collateralDialogOpen}
          onOpenChange={setCollateralDialogOpen}
        />
      )}

      {/* close position dialog */}
      {curPositionId && (
        <CloseDialog
          positionId={curPositionId}
          open={closeDialogOpen}
          onOpenChange={setCloseDialogOpen}
        />
      )}

      {/* share dialog */}
      {curPositionId && (
        <ShareDialog
          positionId={curPositionId}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </div>
  );
};

export default Positions;
