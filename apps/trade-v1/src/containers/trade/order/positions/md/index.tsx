import { FC, useCallback } from 'react';

import { SortingState, Updater } from '@tanstack/react-table';
import { useShallow } from 'zustand/react/shallow';
import type { Position } from '@/common';
import { ORDER_TAB_VALUE } from '@/constants/enum';
import Table from '../../components/Table';
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
}

const PositionsMd: FC<PositionsProps> = ({
  isLoading,
  data,
  onClose,
  onCloseAll,
  onEditCollateral,
  onShowOrders,
  onOpenShareDialog,
}) => {
  const [sortingState, setSortingState] = useOrdersStore(
    useShallow((state) => [state.positionSortingState, state.setSortingState]),
  );

  const columns = useColumns({
    onClose,
    onCloseAll,
    onEditCollateral,
    onShowOrders,
    onOpenShareDialog,
  });

  const setSorting = useCallback(
    (_sortingState: Updater<SortingState>) =>
      setSortingState(ORDER_TAB_VALUE.POSITION, _sortingState),
    [setSortingState],
  );

  return (
    <Table
      data={data}
      columns={columns}
      sorting={sortingState}
      setSorting={setSorting}
      isLoading={isLoading}
    />
  );
};

export default PositionsMd;
