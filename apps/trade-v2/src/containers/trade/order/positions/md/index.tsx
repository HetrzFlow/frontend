import { FC, useCallback } from 'react';

import { usePathname, useRouter } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { SortingState, Updater } from '@tanstack/react-table';
import { useShallow } from 'zustand/react/shallow';
import { useInstStore, type Position } from '@/common';
import Table from '@/components/Table';
import { ORDER_TAB_VALUE } from '@/constants/enum';
import { buildTradeRouteInstIdByCategory } from '@/lib/credit/creditMarkets';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { useOrdersStore } from '../../store';

import { useColumns } from './useColumns';

interface PositionsProps {
  isLoading: boolean;
  data: Position[];
  onClose: (positionId: string) => void;
  onCloseAll: () => void;
  onEditCollateral: (positionId: string) => void;
  onShowOrders: (positionId: string) => void;
  onOpenShareDialog: (positionId: string) => void;
  onOpenTpSlOrdersDialog: (position: Position) => void;
  focusedPositionId: string | null;
}

const PositionsMd: FC<PositionsProps> = ({
  isLoading,
  data,
  onClose,
  onCloseAll,
  onEditCollateral,
  onShowOrders,
  onOpenShareDialog,
  onOpenTpSlOrdersDialog,
  focusedPositionId,
}) => {
  const { t } = useLingui();
  const insts = useInstStore((state) => state.getInsts());
  const [sortingState, setSortingState] = useOrdersStore(
    useShallow((state) => [state.positionSortingState, state.setSortingState]),
  );

  const columns = useColumns({
    onClose,
    onCloseAll,
    onEditCollateral,
    onShowOrders,
    onOpenShareDialog,
    onOpenTpSlOrdersDialog,
  });

  const setSorting = useCallback(
    (_sortingState: Updater<SortingState>) =>
      setSortingState(ORDER_TAB_VALUE.POSITION, _sortingState),
    [setSortingState],
  );

  const router = useRouter();
  const pathname = usePathname();
  const [curInstId, persistedRouteInstId] = useTradeGlobalStore(
    useShallow((state) => [state.instId, state.routeInstId]),
  );
  const setInst = useTradeGlobalStore((state) => state.setInst);

  return (
    <Table
      data={data}
      getRowId={(row) => row.id}
      focusedRowId={focusedPositionId}
      onRowClick={(data) => {
        const inst = insts[data.marketAddress];
        if (inst) {
          setInst(inst);
          const curInst = insts[curInstId];
          const curRouteInstId = curInst
            ? buildTradeRouteInstIdByCategory(curInst.name, curInst.category)
            : persistedRouteInstId;
          const nextRouteInstId = buildTradeRouteInstIdByCategory(
            inst.name,
            inst.category,
          );
          router.replace(
            pathname.replace(`/${curRouteInstId}`, `/${nextRouteInstId}`),
          );
        }
      }}
      columns={columns}
      sorting={sortingState}
      setSorting={setSorting}
      isLoading={isLoading}
      emptyMessage={t`No open positions found.`}
    />
  );
};

export default PositionsMd;
