'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import {
  ArrowRightLeftIcon,
  Loading,
  MEDIA_SIZES,
  useMediaQuery,
} from '@repo/ui';
import Table from '@/components/Table';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import type { SwapHistoryRecord } from '@/services/rest/swap';

import { getSwapHistoryAmounts, getSwapHistoryPair } from './model';
import SwapHistoryExplorerLink from './SwapHistoryExplorerLink';
import { useSwapHistory } from './useSwapHistory';
import type { ColumnDef } from '@tanstack/react-table';

export default function SwapHistoryTable({
  refetchMark,
}: {
  refetchMark: number;
}) {
  const { t } = useLingui();
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const {
    records,
    isInitialLoading,
    isInitialError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useSwapHistory();
  const columns = useMemo<ColumnDef<SwapHistoryRecord>[]>(
    () => [
      {
        id: 'pair',
        header: t`Pair`,
        accessorFn: (record) => getSwapHistoryPair(record),
        cell: ({ getValue }) => (
          <div className="border-accent text-t-1100 flex h-4 items-center border-l-2 pl-2 text-sm/tight font-medium">
            {getValue<string>()}
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[120px] w-[25%]',
        },
      },
      {
        id: 'type',
        header: t`Type`,
        accessorFn: (record) => record,
        cell: () => <span className="text-accent">{t`Swap Succeeded`}</span>,
        meta: {
          headerClassName: 'min-w-[150px] w-[27.5%]',
        },
      },
      {
        id: 'amount',
        header: t({ message: 'Amount', context: 'Swap history' }),
        accessorFn: (record) => record,
        cell: ({ getValue }) => (
          <span className="text-t-1100">
            {getSwapHistoryAmounts(getValue<SwapHistoryRecord>())}
          </span>
        ),
        meta: {
          headerClassName: 'min-w-[100px] w-[20%]',
        },
      },
      {
        id: 'timeHash',
        header: t`Time / Hash`,
        accessorFn: (record) => record,
        cell: ({ getValue }) => {
          const record = getValue<SwapHistoryRecord>();

          return (
            <SwapHistoryExplorerLink
              txHash={record.txHash}
              timestampMs={record.timestampMs}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-[180px] w-[27.5%]',
        },
      },
    ],
    [t],
  );

  useUpdateEffect(() => {
    setShowLoading(true);
    void refetch().finally(() => setShowLoading(false));
  }, [refetch, refetchMark]);

  useEffect(() => {
    const root = isMobile
      ? null
      : rootRef.current?.querySelector('[data-slot="table-container"]');
    const target = sentinelRef.current;
    if (
      !target ||
      !hasNextPage ||
      isFetchingNextPage ||
      (!isMobile && !root) ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage();
      },
      { root, rootMargin: '0px 0px 160px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isMobile,
    records.length,
  ]);

  return (
    <div ref={rootRef} className="h-full">
      {isInitialError ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm">
          <p className="text-t-430">{t`Failed to load swap history.`}</p>
          <button
            type="button"
            className="text-accent underline underline-offset-2"
            onClick={() => void refetch()}
          >
            {t`Retry`}
          </button>
        </div>
      ) : isMobile ? (
        isInitialLoading || showLoading ? (
          <Loading className="mt-20 bg-transparent" />
        ) : records.length ? (
          <>
            {records.map((record) => (
              <div key={record.id} className="flex h-[99px] flex-col gap-3 p-4">
                <div className="flex h-5 min-w-0 items-center gap-1.5">
                  <span className="bg-accent flex size-5 shrink-0 items-center justify-center rounded-sm text-black">
                    <ArrowRightLeftIcon size={14} />
                  </span>
                  <span className="font-borna text-t-1100 min-w-0 flex-1 truncate text-[15px]/[1.2] font-medium">
                    {getSwapHistoryPair(record)}
                  </span>
                  <SwapHistoryExplorerLink
                    txHash={record.txHash}
                    timestampMs={record.timestampMs}
                    className="shrink-0 text-xs"
                    timestampClassName="w-[120px] text-right"
                  />
                </div>

                <div className="font-borna flex gap-6 text-left">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-t-270 text-xs">{t`Type`}</span>
                    <span className="text-accent truncate text-sm/[1.2]">
                      {t`Swap Succeeded`}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 text-right">
                    <span className="text-t-270 text-xs">
                      {t({ message: 'Amount', context: 'Swap history' })}
                    </span>
                    <span className="text-t-1100 truncate text-sm/[1.2]">
                      {getSwapHistoryAmounts(record)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {hasNextPage ? (
              <div ref={sentinelRef} className="h-1 w-full" />
            ) : null}
            {isFetchingNextPage ? (
              <div className="text-t-270 py-2 text-center text-xs">
                {t`Loading...`}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-t-430 py-8 text-center text-sm">
            {t`No swapping activities found.`}
          </p>
        )
      ) : (
        <Table
          columns={columns}
          data={records}
          isLoading={isInitialLoading || showLoading}
          getRowId={(record) => record.id}
          emptyMessage={t`No swapping activities found.`}
          wrapClassName="[&_table]:min-w-[680px]"
          extra={
            records.length && (hasNextPage || isFetchingNextPage) ? (
              <>
                {hasNextPage ? (
                  <div ref={sentinelRef} className="h-1 w-full" />
                ) : null}
                {isFetchingNextPage ? (
                  <div className="text-t-270 py-2 text-center text-xs">
                    {t`Loading...`}
                  </div>
                ) : null}
              </>
            ) : null
          }
        />
      )}
    </div>
  );
}
