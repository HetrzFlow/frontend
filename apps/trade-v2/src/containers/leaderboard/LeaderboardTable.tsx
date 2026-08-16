'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { useLingui } from '@lingui/react/macro';
import { cn } from '@repo/ui';
import { useHzSdk } from '@/common/chainClient/hooks';
import type {
  LeaderboardRow,
  LeaderboardSortBy,
} from '@/services/rest/leaderboard';
import { EMPTY_VALUE, getPnlTextClassName, withUsdPrefix } from './display';
import { LeaderboardTableFallback } from './LeaderboardTableFallback';
import { MetricInfo } from './MetricInfo';
import { RankBadge } from './RankBadge';

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  sortBy: LeaderboardSortBy;
  hasNextPage: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

const desktopColumnClassNames = {
  rank: 'w-7 text-center',
  trader: 'w-[200px]',
  pnl: 'w-20',
  volume: 'w-20',
  trades: 'w-20',
  winRate: 'w-20',
  referee: 'w-20 text-left',
  referralVolume: 'w-24 text-right',
};

const topRowClassName =
  'bg-gradient-to-r from-[rgba(0,223,235,0.15)] to-[rgba(0,223,235,0)]';

const desktopTableContainerClassName =
  'w-full flex-col gap-2 rounded-2xl border border-border p-3';
const mobileTableContainerClassName = 'w-full flex-col gap-2';

const getRowClassName = (row: LeaderboardRow) =>
  cn('transition-colors', row.rank <= 3 ? topRowClassName : '');

const getMetricValue = (row: LeaderboardRow, sortBy: LeaderboardSortBy) => {
  if (sortBy === 'volume') {
    return withUsdPrefix(row.volume30d);
  }

  if (sortBy === 'winRate') {
    return row.winRate || EMPTY_VALUE;
  }

  if (sortBy === 'referee') {
    return row.refereeAllTime || EMPTY_VALUE;
  }

  return withUsdPrefix(row.mobilePnl, true);
};

const getMetricClassName = (row: LeaderboardRow, sortBy: LeaderboardSortBy) =>
  sortBy === 'pnl' ? getPnlTextClassName(row.mobilePnl) : 'text-white';

const TraderCell = ({ row }: { row: LeaderboardRow }) => {
  const hzSdk = useHzSdk();
  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : undefined;

  return (
    <div className="flex min-w-0 items-center gap-1 text-white">
      {explorerHost ? (
        <a
          href={`${explorerHost}/address/${row.traderAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${row.trader} on BscScan`}
          className="group flex min-w-0 items-center gap-1 transition-colors hover:text-white hover:underline"
        >
          <span className="truncate">{row.trader}</span>
        </a>
      ) : (
        <span className="truncate">{row.trader}</span>
      )}
    </div>
  );
};

const DesktopLeaderboardRow = ({ row }: { row: LeaderboardRow }) => {
  return (
    <div
      className={cn(
        'flex h-[31px] w-full items-center justify-between rounded-lg p-2 text-[13px] leading-normal tracking-[-0.52px]',
        getRowClassName(row),
      )}
    >
      <div className={desktopColumnClassNames.rank}>
        <RankBadge rank={row.rank} />
      </div>
      <div className={cn(desktopColumnClassNames.trader, 'min-w-0')}>
        <TraderCell row={row} />
      </div>
      <div
        className={cn(
          desktopColumnClassNames.pnl,
          getPnlTextClassName(row.pnl30d),
        )}
      >
        {withUsdPrefix(row.pnl30d, true)}
      </div>
      <div className={cn(desktopColumnClassNames.volume, 'text-white')}>
        {withUsdPrefix(row.volume30d)}
      </div>
      <div className={cn(desktopColumnClassNames.trades, 'text-white')}>
        {row.trades || EMPTY_VALUE}
      </div>
      <div className={cn(desktopColumnClassNames.winRate, 'text-white')}>
        {row.winRate || EMPTY_VALUE}
      </div>
      <div className={cn(desktopColumnClassNames.referee, 'text-white')}>
        {row.refereeAllTime}
      </div>
      <div className={cn(desktopColumnClassNames.referralVolume, 'text-white')}>
        {withUsdPrefix(row.referralVolume)}
      </div>
    </div>
  );
};

const MobileLeaderboardRow = ({
  row,
  sortBy,
}: {
  row: LeaderboardRow;
  sortBy: LeaderboardSortBy;
}) => {
  return (
    <div
      className={cn(
        'flex h-[31px] w-full items-center gap-4 rounded-lg px-3 py-2 text-[13px] leading-normal tracking-[-0.52px]',
        getRowClassName(row),
      )}
    >
      <div className="flex w-10 shrink-0 items-center">
        <RankBadge rank={row.rank} />
      </div>
      <div className="min-w-0 flex-1">
        <TraderCell row={{ ...row, trader: row.mobileTrader || row.trader }} />
      </div>
      <div
        className={cn(
          'w-20 shrink-0 text-right',
          getMetricClassName(row, sortBy),
        )}
      >
        {getMetricValue(row, sortBy)}
      </div>
    </div>
  );
};

const DesktopMetricHeader = ({
  label,
  className,
  tooltip,
}: {
  label: string;
  className: string;
  tooltip?: string;
}) => (
  <div className={className}>
    <MetricInfo
      label={label}
      title={label}
      description={tooltip}
      triggerClassName="inline-flex w-fit text-left text-white/70"
    />
  </div>
);

export const LeaderboardTable = ({
  rows,
  sortBy,
  hasNextPage,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
}: LeaderboardTableProps) => {
  const { t } = useLingui();
  const mobileSentinelRef = useRef<HTMLDivElement>(null);
  const desktopSentinelRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const refereeLabel = t({
    id: 'leaderboard.referee',
    message: 'Referee',
  });
  const referralVolumeLabel = t`Referral Vol`;
  const metricLabels: Record<LeaderboardSortBy, string> = {
    pnl: t`PnL`,
    volume: t`Volume`,
    winRate: t`Win Rate`,
    referee: refereeLabel,
  };
  const metricDescriptions: Partial<
    Record<LeaderboardSortBy | 'trades' | 'referralVolume', string>
  > = {
    pnl: t`Realized profit and loss from all closed positions, net of fees in the selected period.`,
    volume: t`Total notional trading volume across all positions in the selected period.`,
    trades: t`Number of position-reducing events (partial/full close, liquidation, ADL) in the selected period.`,
    winRate: t`Win rate ranking is weighted by trade count, so a high win rate% from very few trades won't rank first.`,
    referee: t`Number of referred active traders (monthly txn ≥ 1 & notional size ≥$10) who have completed at least one trade in the selected period.`,
    referralVolume: t`Total notional trading volume of your referred traders (direct and indirect referrals) in the selected period. Your own trading volume is not included.`,
  };
  const mobileMetricLabel = metricLabels[sortBy];
  const mobileMetricDescription = metricDescriptions[sortBy];

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    onLoadMore();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observers: IntersectionObserver[] = [];
    const observeLoadMoreTarget = (
      target: HTMLDivElement | null,
      options?: IntersectionObserverInit,
    ) => {
      if (!target) return;

      const observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
          loadMore();
        }
      }, options);

      observer.observe(target);
      observers.push(observer);
    };

    observeLoadMoreTarget(mobileSentinelRef.current, {
      rootMargin: '160px 0px',
      threshold: 0,
    });
    observeLoadMoreTarget(desktopSentinelRef.current, {
      root: desktopScrollRef.current,
      rootMargin: '80px 0px',
      threshold: 0,
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [hasNextPage, isFetchingNextPage, loadMore, rows.length]);

  if (isLoading) {
    return <LeaderboardTableFallback />;
  }

  return (
    <>
      <section
        className={cn('hidden md:flex', desktopTableContainerClassName)}
        aria-label={t`Leaderboard rankings`}
      >
        <div className="flex w-full items-start justify-between px-2 text-[13px] leading-normal tracking-[-0.52px] text-white/70">
          <span className={desktopColumnClassNames.rank}>{t`Rank`}</span>
          <span className={desktopColumnClassNames.trader}>{t`Trader`}</span>
          <DesktopMetricHeader
            label={metricLabels.pnl}
            className={desktopColumnClassNames.pnl}
            tooltip={metricDescriptions.pnl}
          />
          <DesktopMetricHeader
            label={metricLabels.volume}
            className={desktopColumnClassNames.volume}
            tooltip={metricDescriptions.volume}
          />
          <div className={desktopColumnClassNames.trades}>
            <MetricInfo
              label={t`Trades`}
              title={t`Trades`}
              description={metricDescriptions.trades}
              triggerClassName="inline-flex w-fit text-white/70"
            />
          </div>
          <DesktopMetricHeader
            label={metricLabels.winRate}
            className={desktopColumnClassNames.winRate}
            tooltip={metricDescriptions.winRate}
          />
          <div className={desktopColumnClassNames.referee}>
            <MetricInfo
              label={refereeLabel}
              title={refereeLabel}
              description={metricDescriptions.referee}
              triggerClassName="inline-flex w-fit text-white/70"
            />
          </div>
          <div className={desktopColumnClassNames.referralVolume}>
            <MetricInfo
              label={referralVolumeLabel}
              title={referralVolumeLabel}
              description={metricDescriptions.referralVolume}
              triggerClassName="inline-flex w-fit text-white/70"
            />
          </div>
        </div>
        <div
          ref={desktopScrollRef}
          className="scrollbar-none flex max-h-[346px] w-full flex-col gap-1 overflow-y-auto overscroll-contain"
        >
          {rows.map((row) => (
            <DesktopLeaderboardRow
              key={`${row.rank}-${row.traderAddress}`}
              row={row}
            />
          ))}
          {hasNextPage ? (
            <div ref={desktopSentinelRef} className="h-1 w-full shrink-0" />
          ) : null}
        </div>
      </section>

      <section
        className={cn('flex md:hidden', mobileTableContainerClassName)}
        aria-label={t`Leaderboard rankings`}
      >
        <div className="flex w-full items-center gap-4 px-3 text-[13px] leading-normal tracking-[-0.52px] text-white/70">
          <span className="w-10">{t`RANK`}</span>
          <span className="min-w-0 flex-1">{t`Trader`}</span>
          <div className="w-20 text-right">
            {mobileMetricDescription ? (
              <MetricInfo
                label={mobileMetricLabel}
                title={mobileMetricLabel}
                description={mobileMetricDescription}
                triggerClassName="inline-flex w-fit text-right text-white/70"
              />
            ) : (
              <span className="underline decoration-dotted underline-offset-3">
                {mobileMetricLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex w-full flex-col gap-1">
          {rows.map((row) => (
            <MobileLeaderboardRow
              key={`${row.rank}-${row.traderAddress}`}
              row={row}
              sortBy={sortBy}
            />
          ))}
          {hasNextPage ? (
            <div ref={mobileSentinelRef} className="h-1 w-full shrink-0" />
          ) : null}
        </div>
      </section>
    </>
  );
};
