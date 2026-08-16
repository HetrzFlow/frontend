import { Dispatch, FC, SetStateAction, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  ColumnFiltersState,
  SortingState,
  Updater,
} from '@tanstack/react-table';
import { useShallow } from 'zustand/react/shallow';
import { PaginationLoadMore, PaginationNoMore } from '@repo/ui';
import type { HistoryRecord } from '@/common';
import { ORDER_TAB_VALUE } from '@/constants/enum';

import Table from '../../components/Table';
import { useOrdersStore } from '../../store';
import { useColumns } from './useColumns';

interface HistoryRecordsProps {
  isLoading: boolean;
  data: HistoryRecord[];
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalPages: number;
}

const HistoryRecordsMd: FC<HistoryRecordsProps> = ({
  isLoading,
  data,
  currentPage,
  setCurrentPage,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  totalPages,
}) => {
  const { t } = useLingui();
  const [sortingState, setSortingState, historyFilterState, setFilterState] =
    useOrdersStore(
      useShallow((state) => [
        state.historySortingState,
        state.setSortingState,
        state.historyFilterState,
        state.setFilterState,
      ]),
    );

  const setSorting = useCallback(
    (_sortingState: Updater<SortingState>) =>
      setSortingState(ORDER_TAB_VALUE.HISTORY, _sortingState),
    [setSortingState],
  );
  const setColumnFilters = useCallback(
    (_filterState: Updater<ColumnFiltersState>) =>
      setFilterState(ORDER_TAB_VALUE.HISTORY, _filterState),
    [setFilterState],
  );

  const columns = useColumns();

  return (
    <Table
      columns={columns}
      data={data}
      isLoading={isLoading}
      getRowId={(row) => row.id}
      sorting={sortingState}
      setSorting={setSorting}
      columnFilters={historyFilterState}
      setColumnFilters={setColumnFilters}
      extra={
        data.length ? (
          <>
            {/* pagination load */}
            {!isLoading && (hasNextPage || currentPage < totalPages) && (
              <PaginationLoadMore
                className="my-4"
                isFetching={isFetchingNextPage}
                onClick={() => {
                  fetchNextPage();
                  setCurrentPage((prev) => prev + 1);
                }}
              >
                {t`Click to load more`}
              </PaginationLoadMore>
            )}
            {/* no data */}
            {!hasNextPage && currentPage >= totalPages && currentPage > 1 && (
              <PaginationNoMore className="my-4">{t`End of list`}</PaginationNoMore>
            )}
          </>
        ) : null
      }
    />
  );
};

export default HistoryRecordsMd;
