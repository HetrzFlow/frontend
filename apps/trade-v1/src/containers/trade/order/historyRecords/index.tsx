import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import { useHistoryRecords, useInstStore } from '@/common';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import { OrderResType, subOrder } from '@/services/ws/order';

import { useGlobalStore } from '@/stores/trade/global';
import Operations from '../components/Operations';
import { useOrdersStore } from '../store';
import HistoryRecordsMd from './md';
import HistoryRecordsSm from './sm';

interface HistoryRecordsProps {
  refetchMark: number;
}

const HistoryRecords: FC<HistoryRecordsProps> = ({ refetchMark }) => {
  const [onlyShowCurrentInst, sortingState, historyFilterState] =
    useOrdersStore(
      useShallow((state) => [
        state.onlyShowCurrentInst,
        state.historySortingState,
        state.historyFilterState,
      ]),
    );
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));

  const {
    data: records,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    refetch,
  } = useHistoryRecords({
    indexCoinType: onlyShowCurrentInst ? inst?.coinType : undefined,
    sortBy: 'timestamp',
    sort: sortingState[0]?.desc ? 'DESC' : 'ASC',
    positionType:
      historyFilterState[0]?.value === 'all'
        ? undefined
        : (historyFilterState[0]?.value as string),
    action:
      historyFilterState[1]?.value === 'all'
        ? undefined
        : (historyFilterState[1]?.value as string),
  });

  const subCallbackRef = useRef<(data: OrderResType[]) => void>(null);
  subCallbackRef.current = useCallback(
    (data: OrderResType[]) => {
      const shouldRefetchOrder = data.some(({ a }) => {
        return a === 'exec';
      });

      if (shouldRefetchOrder) {
        refetch();
      }
    },
    [refetch],
  );
  useEffect(() => {
    const unsubOrder = subOrder({
      callback: ({ data }) => {
        subCallbackRef.current?.(data);
      },
    });

    return unsubOrder;
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [showLoading, setShowLoading] = useState(false);

  useUpdateEffect(() => {
    setCurrentPage(1);
    setShowLoading(true);
    refetch().finally(() => {
      setShowLoading(false);
    });
  }, [refetchMark, refetch]);

  const totalPages = records?.pages.length || 0;

  const filteredData =
    records?.pages.slice(0, currentPage).flatMap((v) => v!.items) || [];

  const tableIsLoading = isLoading || showLoading;
  const mediaSz = useMediaQuery();
  return (
    <div className="h-full" id="historyRecords">
      {mediaSz === MEDIA_SIZES.SM ? (
        <div className="pb-[124px]">
          <Operations />
          <HistoryRecordsSm
            data={filteredData}
            isLoading={tableIsLoading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      ) : (
        <HistoryRecordsMd
          data={filteredData}
          isLoading={tableIsLoading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
    </div>
  );
};

export default HistoryRecords;
