import { Dispatch, FC, SetStateAction, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  ColumnFiltersState,
  SortingState,
  Updater,
} from '@tanstack/react-table';
import { useShallow } from 'zustand/react/shallow';
import { PaginationLoadMore, PaginationNoMore } from '@repo/ui';
import { PAGE_LIMIT } from '@/common';
import type { Order } from '@/common';

import { ORDER_TAB_VALUE } from '@/constants/enum';
import Table from '../../components/Table';
import { useOrdersStore } from '../../store';
import { useColumns } from './useColumns';

interface OpenOrdersProps {
  data: Order[];
  isLoading: boolean;
  onCancel: (order: Order[]) => void;
  onEditPrice: (id: string) => void;
  total: number;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

const OpenOrdersMd: FC<OpenOrdersProps> = ({
  data,
  isLoading,
  total,
  currentPage,
  setCurrentPage,
  onCancel,
  onEditPrice,
}) => {
  const { t } = useLingui();
  const [sortingState, setSortingState, orderFilterState, setFilterState] =
    useOrdersStore(
      useShallow((state) => [
        state.orderSortingState,
        state.setSortingState,
        state.orderFilterState,
        state.setFilterState,
      ]),
    );

  const columns = useColumns({ onCancel, onEditPrice });

  const setSorting = useCallback(
    (_sortingState: Updater<SortingState>) =>
      setSortingState(ORDER_TAB_VALUE.ORDER, _sortingState),
    [setSortingState],
  );

  const setColumnFilters = useCallback(
    (_filterState: Updater<ColumnFiltersState>) =>
      setFilterState(ORDER_TAB_VALUE.ORDER, _filterState),
    [setFilterState],
  );

  return (
    <Table
      columns={columns}
      data={data}
      getRowId={(row) => row.orderId}
      sorting={sortingState}
      setSorting={setSorting}
      columnFilters={orderFilterState}
      setColumnFilters={setColumnFilters}
      isLoading={isLoading}
      extra={
        data.length ? (
          <>
            {/* pagination load */}
            {!isLoading && currentPage * PAGE_LIMIT < total && (
              <PaginationLoadMore
                className="my-4"
                isFetching={false}
                onClick={() => {
                  setCurrentPage((prev) => prev + 1);
                }}
              >
                {t`Click to load more`}
              </PaginationLoadMore>
            )}
            {/* no data */}
            {currentPage * PAGE_LIMIT >= total && (
              <PaginationNoMore className="my-4">{t`End of list`}</PaginationNoMore>
            )}
          </>
        ) : null
      }
    />
  );
};

export default OpenOrdersMd;
