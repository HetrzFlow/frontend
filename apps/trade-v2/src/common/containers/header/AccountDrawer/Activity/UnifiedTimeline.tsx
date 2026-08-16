'use client';

import { memo, useEffect, useRef } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  cn,
  Loading,
  MEDIA_SIZES,
  PaginationNoMore,
  ScrollBox,
  useMediaQuery,
} from '@repo/ui';
import { ConnectBtn } from '@/common';
import SwapActivityList from '@/components/SwapHistory/SwapActivityList';
import { useSwapHistory } from '@/components/SwapHistory/useSwapHistory';
import { ENABLE_SWAP } from '@/constants/common';
import TimelineItem from './TimelineItem';
import { useUnifiedActivityTimeline } from './useUnifiedActivity';
import type { ActivityView } from './types';

interface UnifiedTimelineProps {
  view: ActivityView;
  vaultAddresses?: readonly string[];
  isPredeposit?: boolean;
  fillAvailableHeight?: boolean;
}

const UnifiedTimeline = ({
  view,
  vaultAddresses,
  isPredeposit = false,
  fillAvailableHeight = false,
}: UnifiedTimelineProps) => {
  const { t } = useLingui();
  const mediaSz = useMediaQuery();
  const isMobile = mediaSz === MEDIA_SIZES.SM;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const tradeHistory = useUnifiedActivityTimeline({
    vaultAddresses,
    isPredeposit,
  });
  const swapHistory = useSwapHistory(ENABLE_SWAP && view === 'swap');
  const {
    hasAddress,
    isWalletPending,
    items,
  } = tradeHistory;
  const activeHistory =
    view === 'swap'
      ? swapHistory
      : {
          records: items,
          isInitialLoading: tradeHistory.isInitialLoading,
          isFetchingNextPage: tradeHistory.isFetchingNextPage,
          hasNextPage: tradeHistory.hasNextPage,
          fetchNextPage: tradeHistory.fetchNextPage,
        };
  const {
    records,
    isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = activeHistory;

  useEffect(() => {
    if (
      view !== 'trade' ||
      !vaultAddresses?.length ||
      records.length ||
      !hasNextPage ||
      isFetchingNextPage
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    records.length,
    vaultAddresses?.length,
    view,
  ]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          void fetchNextPage();
        }
      },
      {
        root: isMobile ? null : root,
        rootMargin: '0px 0px 160px 0px',
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isMobile,
    records.length,
    view,
  ]);

  if (isWalletPending || isInitialLoading) {
    return <Loading className="mt-20 bg-transparent" />;
  }

  if (!hasAddress) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        <div className="text-t-1100 text-sm font-medium">
          <Trans>Please connect your wallet to continue.</Trans>
        </div>
        <ConnectBtn className="max-md:!text-accent w-[220px] max-w-[60vw] text-xs underline-offset-2 max-md:size-auto max-md:!bg-transparent max-md:p-0 max-md:text-sm max-md:underline" />
      </div>
    );
  }

  if (view === 'swap' && swapHistory.isInitialError) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm">
        <p className="text-t-430">{t`Failed to load swap history.`}</p>
        <button
          type="button"
          className="text-accent underline underline-offset-2"
          onClick={() => void swapHistory.refetch()}
        >
          {t`Retry`}
        </button>
      </div>
    );
  }

  if (!records.length) {
    return (
      <p className="text-t-430 mt-2 text-center text-sm">
        {view === 'swap'
          ? t`No swapping activities found.`
          : t`No trading activities found.`}
      </p>
    );
  }

  return (
    <ScrollBox
      ref={scrollRef}
      className={cn(fillAvailableHeight && 'min-h-0')}
      scrollClassName={cn(
        'scrollbar-none flex max-md:h-auto max-md:!overflow-y-visible flex-col gap-3 overflow-y-auto px-4',
        fillAvailableHeight
          ? 'h-full'
          : 'h-[calc(100dvh-380px)]',
      )}
      shadowClassName="to-bg-drawer-shadow max-md:to-popover max-md:hidden absolute bottom-0 mx-4 h-12 w-[calc(100%-calc(var(--spacing)*8))] bg-gradient-to-b from-transparent"
    >
      <div className="flex flex-col gap-3 pb-2">
        {view === 'swap' ? (
          <SwapActivityList records={swapHistory.records} />
        ) : (
          items.map((item) => <TimelineItem key={item.id} item={item} />)
        )}

        {hasNextPage ? (
          <div ref={sentinelRef} className="h-1 w-full" />
        ) : null}

        {isFetchingNextPage ? (
          <div className="text-t-270 py-2 text-center text-xs">
            {t`Loading...`}
          </div>
        ) : null}

        {!hasNextPage ? (
          <PaginationNoMore className="my-2">
            {t`End of list`}
          </PaginationNoMore>
        ) : null}
      </div>
    </ScrollBox>
  );
};

export default memo(UnifiedTimeline);
