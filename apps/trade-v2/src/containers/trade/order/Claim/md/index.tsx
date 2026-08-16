import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import { useLingui } from '@lingui/react/macro';

import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import {
  Loading,
  PaginationLoadMore,
  PaginationNoMore,
  Separator,
} from '@repo/ui';

import ClaimAllButton from '../components/ClaimAllButton';
import ClaimTabs from '../components/ClaimTabs';
import { useClaimStore } from '../store';
import { ClaimTableDataType } from '../type';
import { CLAIM_MD_COLUMNS } from './columns';
import HistoryList from './HistoryList';
import Summary from './Summary';

interface ClaimMdProps {
  isLoading: boolean;
  pendingData: ClaimTableDataType[];
  historyData: ClaimTableDataType[];
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalPages: number;
  claimableCount: number;
  totalClaimed: string;
  focusedClaimId: string | null;
}

const ClaimMd: FC<ClaimMdProps> = ({
  isLoading,
  pendingData,
  historyData,
  currentPage,
  setCurrentPage,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  totalPages,
  claimableCount,
  totalClaimed,
  focusedClaimId,
}) => {
  const { t } = useLingui();
  const [activeTab, setState, claimableFundingFeeUsd, claimablePriceImpactUsd] =
    useClaimStore(
      useShallow((state) => [
        state.activeTab,
        state.setState,
        state.claimableFundingFeeUsd,
        state.claimablePriceImpactUsd,
      ]),
    );

  const activeData = activeTab === 'pending' ? pendingData : historyData;
  const totalClaimableUsd = calc(claimableFundingFeeUsd)
    .plus(claimablePriceImpactUsd)
    .toFixed();
  const claimAllCount = claimableCount > 0 ? pendingData.length : 0;

  const showLoadMore =
    activeTab === 'history' &&
    !isLoading &&
    (hasNextPage || currentPage < totalPages);
  const showNoMore =
    activeTab === 'history' &&
    !hasNextPage &&
    currentPage >= totalPages &&
    currentPage > 1;

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
    setCurrentPage((prev) => prev + 1);
  }, [fetchNextPage, setCurrentPage]);

  const paginationNode = showLoadMore ? (
    <PaginationLoadMore
      className="my-4"
      isFetching={isFetchingNextPage}
      onClick={handleLoadMore}
    >
      {t`Click to load more`}
    </PaginationLoadMore>
  ) : showNoMore ? (
    <PaginationNoMore className="my-4">{t`End of list`}</PaginationNoMore>
  ) : null;

  return (
    <div className="flex min-h-full flex-col">
      {/* Summary bar */}
      <Summary claimableCount={claimableCount} totalClaimed={totalClaimed} />

      {/* Tabs */}
      <ClaimTabs
        activeTab={activeTab}
        onTabChange={(tab) => setState({ activeTab: tab })}
      />

      {/* Desktop header */}
      <div className="bg-bg-card-mix sticky top-0 z-10 mt-2">
        <div
          className={`text-t-350 grid h-6 items-center px-2 text-xs font-normal select-none ${CLAIM_MD_COLUMNS}`}
        >
          <span>{t`Symbol`}</span>
          <span>{t`Type`}</span>
          <span>{t`Value`}</span>
          <div className="flex justify-end">
            {activeTab === 'pending' ? (
              <ClaimAllButton
                count={claimAllCount}
                hasTxHash={false}
                claimedUsd={totalClaimableUsd}
              />
            ) : (
              <span className="text-right">{t`Time / Hash`}</span>
            )}
          </div>
        </div>
        <Separator className="mt-1 mb-1" />
      </div>

      {/* List content */}
      <div className="flex flex-col">
        {isLoading ? (
          <Loading className="h-20 rounded-xl bg-transparent" />
        ) : activeData.length === 0 ? (
          <div className="text-t-350 mt-6 h-20 text-center text-sm">
            {activeTab === 'pending'
              ? t`No claimable fee refunds found.`
              : t`No claiming activities found.`}
          </div>
        ) : (
          <HistoryList
            listItems={activeData}
            footer={paginationNode}
            focusedClaimId={activeTab === 'pending' ? focusedClaimId : null}
          />
        )}
      </div>
    </div>
  );
};

export default ClaimMd;
