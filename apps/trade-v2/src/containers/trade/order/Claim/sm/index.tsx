import { Dispatch, FC, SetStateAction, useEffect, useRef } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { Loading } from '@repo/ui';

import { scrollWithinContainer } from '../../scroll';
import ClaimAllButton from '../components/ClaimAllButton';
import ClaimTabs from '../components/ClaimTabs';
import { useClaimStore } from '../store';
import ClaimItem from './ClaimItem';
import ClaimSummary from './ClaimSummary';
import type { ClaimTableDataType } from '../type';

interface ClaimSmProps {
  isLoading: boolean;
  pendingData: ClaimTableDataType[];
  historyData: ClaimTableDataType[];
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalPages: number;
  totalClaimed: string;
  hasClaimable: boolean;
  focusedClaimId: string | null;
}

const ClaimSm: FC<ClaimSmProps> = ({
  isLoading,
  pendingData,
  historyData,
  totalClaimed,
  hasClaimable,
  focusedClaimId,
}) => {
  const { t } = useLingui();
  const scrolledClaimIdRef = useRef<string | null>(null);
  const [activeTab, setState, claimableFundingFeeUsd, claimablePriceImpactUsd] =
    useClaimStore(
      useShallow((state) => [
        state.activeTab,
        state.setState,
        state.claimableFundingFeeUsd,
        state.claimablePriceImpactUsd,
      ]),
    );

  const data = activeTab === 'pending' ? pendingData : historyData;
  const totalClaimableUsd = calc(claimableFundingFeeUsd)
    .plus(claimablePriceImpactUsd)
    .toFixed();

  useEffect(() => {
    if (
      isLoading ||
      activeTab !== 'pending' ||
      !focusedClaimId ||
      scrolledClaimIdRef.current === focusedClaimId
    ) {
      return;
    }

    const claimItem = document.getElementById(`claim-item-${focusedClaimId}`);
    const scrollContainer = document.getElementById('historyRecords');
    if (!claimItem || !scrollContainer) return;

    scrolledClaimIdRef.current = focusedClaimId;
    scrollWithinContainer({
      container: scrollContainer,
      target: claimItem,
      align: 'center',
    });
  }, [activeTab, focusedClaimId, isLoading, pendingData]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <ClaimSummary totalClaimed={totalClaimed} />
      <div className="flex items-center justify-between gap-3">
        <ClaimTabs
          activeTab={activeTab}
          onTabChange={(tab) => setState({ activeTab: tab })}
        />
        {activeTab === 'pending' ? (
          <ClaimAllButton
            count={hasClaimable ? pendingData.length : 0}
            hasTxHash={false}
            claimedUsd={totalClaimableUsd}
          />
        ) : null}
      </div>
      {isLoading ? (
        <Loading className="h-20 rounded-xl bg-transparent" />
      ) : !data.length ? (
        <div className="text-t-350 mt-6 h-20 text-center text-sm">
          {activeTab === 'pending'
            ? t`No claimable fee refunds found.`
            : t`No claiming activities found.`}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {data.map((item) => {
            return (
              <div id={`claim-item-${item.id}`} key={item.id}>
                <ClaimItem data={item} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClaimSm;
