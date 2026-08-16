import { FC, useCallback, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import { useHistoryRecords, useInstStore } from '@/common';
import { useOrderExecutedEvent } from '@/hooks/useContractEvents';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';

import { useTradeGlobalStore } from '@/stores/trade/global';
import Operations from '../components/Operations';
import { useOrdersStore } from '../store';
import HistoryRecordsMd from './md';
import HistoryShareDialog from './ShareDialog';
import HistoryRecordsSm from './sm';
import HistoryActionFilterDialog from './sm/HistoryActionFilterDialog';
import type { HistorySharePayload } from './types';

interface HistoryRecordsProps {
  refetchMark: number;
}

const HistoryRecords: FC<HistoryRecordsProps> = ({ refetchMark }) => {
  const [onlyShowCurrentInst, historyFilterState] = useOrdersStore(
    useShallow((state) => [
      state.onlyShowCurrentInst,
      state.historyFilterState,
    ]),
  );
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));

  // TreeFilter stores selected action_types as comma-separated string
  const actionFilterValue = historyFilterState.find(
    (f) => f.id === 'action',
  )?.value as string | undefined;

  const {
    query: {
      data: records,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
      isLoading,
      refetch,
    },
    refetchFirstPage,
  } = useHistoryRecords({
    instId: onlyShowCurrentInst ? instId : undefined,
    marketAddress: onlyShowCurrentInst ? inst?.marketTokenAddress : undefined,
    action: actionFilterValue || undefined,
  });

  // when listen order executed event, refetch history data
  useOrderExecutedEvent(() => {
    refetch();
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showLoading, setShowLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState<HistorySharePayload | null>(null);

  const handleOpenShareDialog = useCallback((payload: HistorySharePayload) => {
    setSharePayload(payload);
    setShareDialogOpen(true);
  }, []);

  useUpdateEffect(() => {
    setCurrentPage(1);
    setShowLoading(true);
    void refetchFirstPage().finally(() => setShowLoading(false));
  }, [refetchFirstPage, refetchMark]);

  const totalPages = records?.pages.length || 0;

  const filteredData =
    records?.pages.slice(0, currentPage).flatMap((v) => v!.items) || [];

  const tableIsLoading = isLoading || showLoading;
  const mediaSz = useMediaQuery();
  return (
    <>
      <>
        {mediaSz === MEDIA_SIZES.SM ? (
          <Operations extra={<HistoryActionFilterDialog />} />
        ) : null}
      </>
      <div
        className="scrollbar-none h-full overflow-y-auto"
        id="historyRecords"
      >
        {mediaSz === MEDIA_SIZES.SM ? (
          <div className="pb-[160px]">
            <HistoryRecordsSm
              data={filteredData}
              isLoading={tableIsLoading}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onOpenShareDialog={handleOpenShareDialog}
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
            onOpenShareDialog={handleOpenShareDialog}
          />
        )}
      </div>
      {sharePayload && (
        <HistoryShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          {...sharePayload}
        />
      )}
    </>
  );
};

export default HistoryRecords;
