import { FC, useState, useRef, useEffect, useMemo } from 'react';

import { useParams, useSearchParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { MEDIA_SIZES, ScrollBox, useMediaQuery } from '@repo/ui';
import {
  CONTRACT_USD_MULTIPLIER,
  useCurrentAccountAddress,
  useHzSdk,
  useInstStore,
} from '@/common';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import { buildTradeRouteInstIdByCategory } from '@/lib/credit/creditMarkets';
import {
  useClaimableFundingFees,
  useClaimHistory,
  useClaimStats,
} from '@/services/rest/claim';

import { mapClaimHistoryItems } from './historyMapper';
import { useFormatClaimDetails } from './hooks';
import ClaimMd from './md';
import {
  ClaimOptimisticProvider,
  useClaimOptimistic,
} from './optimistic';
import HistoryRecordsSm from './sm';
import { useClaimStore } from './store';
import type { ClaimDetailType, ClaimPendingTableDataType } from './type';

interface ClaimProps {
  refetchMark: number;
}

const ClaimContent: FC<ClaimProps> = ({ refetchMark }) => {
  const searchParams = useSearchParams();
  const claimTab = searchParams.get('claimTab');
  const shouldFocusClaim = searchParams.get('claimFocus') === '1';
  const { instId: routeInstId } = useParams<{ instId?: string }>();
  const insts = useInstStore((state) => state.getInsts());
  const [activeTab, setState] = useClaimStore(
    useShallow((state) => [state.activeTab, state.setState]),
  );
  const {
    claimedPriceImpactKeys,
    optimisticTotalClaimedUsd,
    optimisticStartedAt,
    reconcileClaimOptimistic,
  } = useClaimOptimistic();
  const shouldPollClaimStats = optimisticStartedAt !== null;

  useEffect(() => {
    if (claimTab === 'pending' || claimTab === 'history') {
      setState({ activeTab: claimTab });
    }
  }, [claimTab, setState]);

  const activeTabLatestRef = useRef(activeTab);
  activeTabLatestRef.current = activeTab;
  const {
    data: claimableFundingFees,
    isLoading: isClaimableFundingFeesLoading,
    refetch: refetchFundingFees,
  } = useClaimableFundingFees();
  const {
    data: claimStats,
    rawTotalClaimedUsd,
    rawPriceImpactKeys,
    isLoading: isClaimStatsLoading,
    dataUpdatedAt: claimStatsDataUpdatedAt,
    refetch: refetchClaimStats,
  } = useClaimStats(
    {
      claimedPriceImpactKeys,
      optimisticTotalClaimedUsd,
    },
    {
      refetchInterval: shouldPollClaimStats ? 2_000 : false,
    },
  );
  const {
    query: {
      data: claimHistoryData,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
      isLoading: isHistoryLoading,
    },
    refetchFirstPage: refetchFirstClaimHistoryPage,
  } = useClaimHistory();
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    reconcileClaimOptimistic({
      rawTotalClaimedUsd,
      rawPriceImpactKeys,
    });
  }, [
    rawPriceImpactKeys,
    rawTotalClaimedUsd,
    claimStatsDataUpdatedAt,
    reconcileClaimOptimistic,
  ]);

  useUpdateEffect(() => {
    setCurrentPage(1);
    setShowLoading(true);
    if (activeTabLatestRef.current === 'pending') {
      void Promise.all([refetchClaimStats(), refetchFundingFees()]).finally(
        () => setShowLoading(false),
      );
    } else {
      void Promise.all([
        refetchFundingFees(),
        refetchClaimStats(),
        refetchFirstClaimHistoryPage(),
      ]).finally(() => setShowLoading(false));
    }
  }, [
    refetchFirstClaimHistoryPage,
    refetchMark,
    refetchClaimStats,
    refetchFundingFees,
  ]);

  const totalPages = claimHistoryData?.pages.length || 0;

  const claimableFundingFeesData = claimableFundingFees
    ?.map((v) => {
      if (v.longTokenAddress === v.shortTokenAddress) {
        return [
          {
            id: `claimable_funding_fees_${v.marketAddress}`,
            claim_type: 'funding_fees',
            marketAddress: v.marketAddress,
            amount: calc(v.claimableFundingAmountLong)
              .plus(v.claimableFundingAmountShort)
              .toFixed(),
            tokenAddress: v.longTokenAddress,
          },
        ];
      } else {
        return [
          {
            id: `claimable_funding_fees_${v.marketAddress}_${v.longTokenAddress}`,
            claim_type: 'funding_fees',
            marketAddress: v.marketAddress,
            amount: v.claimableFundingAmountLong,
            tokenAddress: v.longTokenAddress,
          },
          {
            id: `claimable_funding_fees_${v.marketAddress}_${v.shortTokenAddress}`,
            claim_type: 'funding_fees',
            marketAddress: v.marketAddress,
            amount: v.claimableFundingAmountShort,
            tokenAddress: v.shortTokenAddress,
          },
        ];
      }
    })
    .flatMap((v) => v);

  const claimablePriceImpactData = claimStats?.claimablePriceImpact?.map(
    (v) => {
      return {
        id: `claimable_price_impact_${v.market_address}_${v.token_address}_${v.time_key}`,
        claim_type: 'collateral',
        marketAddress: v.market_address,
        amount: v.amount,
        tokenAddress: v.token_address,
        timeKey: v.time_key,
      };
    },
  );

  // Group pending data by market address for USD calculation
  const fundingFeesByMarket = useMemo(
    () =>
      (claimableFundingFeesData || []).reduce<
        Record<string, ClaimDetailType[]>
      >((acc, v) => {
        const key = v.marketAddress || '';
        if (!acc[key]) acc[key] = [];
        acc[key].push(v as ClaimDetailType);
        return acc;
      }, {}),
    [claimableFundingFeesData],
  );

  const priceImpactByMarket = useMemo(
    () =>
      (claimablePriceImpactData || []).reduce<
        Record<string, ClaimDetailType[]>
      >((acc, v) => {
        const key = v.marketAddress || '';
        if (!acc[key]) acc[key] = [];
        acc[key].push(v as ClaimDetailType);
        return acc;
      }, {}),
    [claimablePriceImpactData],
  );

  const fundingFeesFormatted = useFormatClaimDetails(fundingFeesByMarket);
  const priceImpactFormatted = useFormatClaimDetails(priceImpactByMarket);

  // Sync total claimable USD values to store
  const claimableFundingFeeUsd = fundingFeesFormatted
    .reduce((acc, cur) => acc.plus(cur.usd), calc(0))
    .toFixed();
  const claimablePriceImpactUsd = priceImpactFormatted
    .reduce((acc, cur) => acc.plus(cur.usd), calc(0))
    .toFixed();

  useEffect(() => {
    setState({
      claimableFundingFeeUsd,
      claimablePriceImpactUsd,
    });
  }, [claimableFundingFeeUsd, claimablePriceImpactUsd, setState]);

  const historyData = mapClaimHistoryItems(
    claimHistoryData?.pages.slice(0, currentPage).flatMap((v) => v.items) || [],
  );

  const tableIsLoading =
    (activeTab === 'pending'
      ? isClaimableFundingFeesLoading || isClaimStatsLoading
      : isHistoryLoading) || showLoading;
  const mediaSz = useMediaQuery();

  const hasClaimableFundingFees = claimableFundingFeesData?.length;
  const hasClaimablePriceImpactData = claimablePriceImpactData?.length;

  const pendingData = [
    ...(hasClaimableFundingFees ? claimableFundingFeesData : []),
    ...(hasClaimablePriceImpactData ? claimablePriceImpactData : []),
  ].map((item) => ({
    ...item,
    kind: 'pending' as const,
  })) as ClaimPendingTableDataType[];
  const focusedClaimId =
    shouldFocusClaim && routeInstId
      ? pendingData.find((item) => {
          const inst = item.marketAddress
            ? insts[item.marketAddress]
            : undefined;
          return (
            inst &&
            buildTradeRouteInstIdByCategory(inst.name, inst.category) ===
              routeInstId
          );
        })?.id || null
      : null;

  const claimableCount =
    (hasClaimableFundingFees ? 1 : 0) + (hasClaimablePriceImpactData ? 1 : 0);

  // Calculate total claimed from history - sum all usd values from details
  const totalClaimed = claimStats?.totalClaimedUsd
    ? calc(claimStats.totalClaimedUsd).div(CONTRACT_USD_MULTIPLIER)
    : calc(0);

  const totalClaimedStr = totalClaimed.toFixed();

  return mediaSz === MEDIA_SIZES.SM ? (
    <div className="scrollbar-none h-full overflow-y-auto" id="historyRecords">
      <div className="pb-[160px]">
        <HistoryRecordsSm
          pendingData={pendingData}
          historyData={historyData}
          isLoading={tableIsLoading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          totalClaimed={totalClaimedStr}
          hasClaimable={claimableCount > 0}
          focusedClaimId={focusedClaimId}
        />
      </div>
    </div>
  ) : (
    <ScrollBox
      scrollClassName="scrollbar-none relative h-full overflow-y-auto"
      shadowClassName="to-bg-card-mix pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-b from-transparent"
    >
      <div id="historyRecords">
        <ClaimMd
          pendingData={pendingData}
          historyData={historyData}
          isLoading={tableIsLoading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          claimableCount={claimableCount}
          totalClaimed={totalClaimedStr}
          focusedClaimId={focusedClaimId}
        />
      </div>
    </ScrollBox>
  );
};

const Claim: FC<ClaimProps> = (props) => {
  const hzSdk = useHzSdk();
  const userAddress = useCurrentAccountAddress();
  const optimisticScope = `${hzSdk?.chainId ?? 'unknown'}-${userAddress.toLowerCase()}`;

  return (
    <ClaimOptimisticProvider key={optimisticScope}>
      <ClaimContent {...props} />
    </ClaimOptimisticProvider>
  );
};

export default Claim;
