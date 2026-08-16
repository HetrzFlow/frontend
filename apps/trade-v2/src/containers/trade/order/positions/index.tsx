import { FC, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

import { useShallow } from 'zustand/react/shallow';

import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import { usePositions, useInstStore, useMarketsConfigs } from '@/common';
import { marketIsOpen } from '@/hooks/useMarketsStats';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import { scheduleIdleTask } from '@/lib/runtime/scheduleIdleTask';
import { getPositionModeKey } from '@/lib/trade/position';
import { useTradeGlobalStore } from '@/stores/trade/global';

import Operations from '../components/Operations';
import { scrollWithinContainer } from '../scroll';
import { useOrdersStore } from '../store';
import CloseAllDialog from './components/CloseAllDialog';
import CloseDialog from './components/CloseDialog';
import EditCollateralDialog from './components/EditCollateralDialog';
import OrdersDialog from './components/OrdersDialog';
import TpSlOrdersDialog from './components/TpSlOrdersDialog';
import {
  useOnClose,
  useOnCloseAll,
  useOnEditCollateral,
  useOnOpenShareDialog,
  useOnOpenTpSlOrdersDialog,
  useOnShowOrders,
} from './hooks';
import PositionsMd from './md';
import PositionsSm from './sm';

const ShareDialog = dynamic(() => import('./components/ShareDialog'), {
  ssr: false,
});

const SHARE_BG_IMAGES = [
  '/trade-static/share-bg-up.webp',
  '/trade-static/share-bg-down.webp',
];

const preloadShareDialogAssets = () => {
  void import('./components/ShareDialog');

  SHARE_BG_IMAGES.forEach((src) => {
    const image = new Image();
    image.src = src;
  });
};

interface PositionsProps {
  refetchMark: number;
}

const Positions: FC<PositionsProps> = ({ refetchMark }) => {
  const focusedPositionId = useSearchParams().get('positionFocus');
  const scrolledPositionIdRef = useRef<string | null>(null);
  const { data: positions, isLoading, refetch } = usePositions();
  const instId = useTradeGlobalStore((state) => state.instId);
  const insts = useInstStore((state) => state.getInsts());
  const { data: marketsConfigs } = useMarketsConfigs({
    markets: positions?.map((position) => insts[position.marketAddress]),
  });
  const [onlyShowCurrentInst, openingPositions] = useOrdersStore(
    useShallow((state) => [state.onlyShowCurrentInst, state.openingPositions]),
  );

  const positionKeys =
    positions?.map((v) =>
      getPositionModeKey({
        marketAddress: v.marketAddress,
        isLong: v.isLong,
        isZFP: v.isZFP,
      }),
    ) || [];
  const filteredOpeningPositions = openingPositions.filter(
    (v) =>
      !positionKeys.includes(
        getPositionModeKey({
          marketAddress: v.marketAddress,
          isLong: v.isLong,
          isZFP: v.isZFP,
        }),
      ),
  );

  const mergedPositions = filteredOpeningPositions.concat(positions || []);
  const filteredPositions = onlyShowCurrentInst
    ? mergedPositions?.filter(
        (position) =>
          position.marketAddress === insts[instId]?.marketTokenAddress,
      )
    : mergedPositions;
  const [curPositionId, setCurPositionId] = useState<string>();
  const curPosition = filteredPositions.find((v) => v.id === curPositionId);
  const {
    onClose,
    dialogOpen: closeDialogOpen,
    setDialogOpen: setCloseDialogOpen,
    defaultValues: defaultValuesForCloseDialog,
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
  const {
    selectedPosition: tpSlSelectedPosition,
    onOpenTpSlOrdersDialog,
    dialogOpen: tpSlOrdersDialogOpen,
    setDialogOpen: setTpSlOrdersDialogOpen,
  } = useOnOpenTpSlOrdersDialog();

  const [showLoading, setShowLoading] = useState(false);

  useUpdateEffect(() => {
    setShowLoading(true);
    void refetch().finally(() => setShowLoading(false));
  }, [refetchMark]);

  useEffect(() => {
    return scheduleIdleTask(preloadShareDialogAssets);
  }, []);

  const mediaSz = useMediaQuery();
  const tableIsLoading = isLoading || showLoading;

  useEffect(() => {
    if (
      tableIsLoading ||
      !focusedPositionId ||
      scrolledPositionIdRef.current === focusedPositionId ||
      !filteredPositions.some((position) => position.id === focusedPositionId)
    ) {
      return;
    }

    const positionRow = document.getElementById(
      mediaSz === MEDIA_SIZES.SM
        ? `position-item-${focusedPositionId}`
        : `order-table-row-${focusedPositionId}`,
    );
    if (!positionRow) return;

    if (mediaSz === MEDIA_SIZES.SM) {
      const scrollContainer = document.getElementById('positions');
      if (!scrollContainer) return;
      scrollWithinContainer({
        container: scrollContainer,
        target: positionRow,
        offset: 48,
      });
    } else {
      positionRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    scrolledPositionIdRef.current = focusedPositionId;
  }, [filteredPositions, focusedPositionId, mediaSz, tableIsLoading]);

  return (
    <>
      <>
        {mediaSz === MEDIA_SIZES.SM ? (
          <Operations
            count={
              filteredPositions?.filter(
                (v) =>
                  marketIsOpen(insts[v.marketAddress]) &&
                  !marketsConfigs?.[v.marketAddress]?.isDisabled,
              )?.length
            }
            onCloseAll={onCloseAll}
          />
        ) : null}
      </>
      <div className="scrollbar-none h-full overflow-y-auto" id="positions">
        {mediaSz === MEDIA_SIZES.SM ? (
          <div className="pb-[160px]">
            <PositionsSm
              data={filteredPositions || []}
              isLoading={tableIsLoading}
              focusedPositionId={focusedPositionId}
              onClose={onClose}
              onCloseAll={onCloseAll}
              onEditCollateral={onEditCollateral}
              onShowOrders={onShowOrders}
              onOpenShareDialog={onOpenShareDialog}
              onOpenTpSlOrdersDialog={onOpenTpSlOrdersDialog}
            />
          </div>
        ) : (
          <PositionsMd
            data={filteredPositions || []}
            isLoading={tableIsLoading}
            focusedPositionId={focusedPositionId}
            onClose={onClose}
            onCloseAll={onCloseAll}
            onEditCollateral={onEditCollateral}
            onShowOrders={onShowOrders}
            onOpenShareDialog={onOpenShareDialog}
            onOpenTpSlOrdersDialog={onOpenTpSlOrdersDialog}
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
            position={curPosition}
            open={collateralDialogOpen}
            onOpenChange={setCollateralDialogOpen}
          />
        )}

        {/* close position dialog */}
        {curPositionId && (
          <CloseDialog
            positionId={curPositionId}
            open={closeDialogOpen}
            defaultValues={defaultValuesForCloseDialog}
            onOpenChange={setCloseDialogOpen}
          />
        )}

        {/* share dialog */}
        {curPositionId && shareDialogOpen && (
          <ShareDialog
            positionId={curPositionId}
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
          />
        )}

        {/* tp/sl orders overview dialog */}
        {tpSlSelectedPosition?.id && (
          <TpSlOrdersDialog
            open={tpSlOrdersDialogOpen}
            onOpenChange={setTpSlOrdersDialogOpen}
            position={tpSlSelectedPosition}
          />
        )}
      </div>
    </>
  );
};

export default Positions;
