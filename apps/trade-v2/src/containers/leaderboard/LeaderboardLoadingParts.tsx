import { Trans } from '@lingui/react/macro';
import { Skeleton } from '@repo/ui';

const metricTabs = ['pnl', 'volume', 'winRate', 'referee'];

export const PeriodTabsLoadingShell = () => (
  <div
    className="relative isolate flex w-fit items-center rounded-xl bg-white/10"
    role="tablist"
  >
    {metricTabs.map((label, index) => (
      <button
        key={label}
        type="button"
        role="tab"
        aria-selected={index === 0}
        className={`relative z-1 h-8 rounded-xl px-3 py-2 text-[13px] leading-none font-medium tracking-[-0.52px] ${
          index === 0 ? 'text-black' : 'text-white'
        }`}
      >
        {label === 'volume' ? (
          <Trans>Volume</Trans>
        ) : label === 'winRate' ? (
          <Trans>Win Rate</Trans>
        ) : label === 'referee' ? (
          <Trans id="leaderboard.referee">Referee</Trans>
        ) : (
          <Trans>PnL</Trans>
        )}
      </button>
    ))}
    <div className="bg-accent absolute top-0 left-0 z-0 h-8 rounded-xl">
      <span className="invisible block px-3 py-2 text-[13px] leading-none font-medium tracking-[-0.52px]">
        <Trans>PnL</Trans>
      </span>
    </div>
  </div>
);

export const PeriodSelectLoadingShell = () => (
  <div className="bg-bg-2 h-8 w-[120px] animate-pulse rounded-xl" />
);

export const SummaryCardsSkeleton = () => (
  <div className="flex w-full gap-2 md:w-[722px]">
    <div className="flex h-[59px] min-w-0 flex-1 flex-col items-start justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.01] p-2 backdrop-blur-[10px] md:h-auto">
      <span className="w-full text-center text-[13px] leading-[normal] tracking-[-0.52px] text-white/70">
        <Trans>Degens</Trans>
      </span>
      <Skeleton className="mx-auto h-5 w-20 md:h-6" />
    </div>
    <div className="flex h-[59px] min-w-0 flex-1 flex-col items-start justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.01] p-2 backdrop-blur-[10px] md:h-auto">
      <span className="w-full text-center text-[13px] leading-[normal] tracking-[-0.52px] text-white/70">
        <Trans>Aped</Trans>
      </span>
      <Skeleton className="mx-auto h-5 w-24 md:h-6" />
    </div>
  </div>
);

const CardSkeleton = ({ className }: { className: string }) => (
  <div
    className={`border-border rounded-xl border bg-white/[0.01] p-3 ${className}`}
  >
    <Skeleton className="h-full w-full" />
  </div>
);

export const MyRankCardSkeleton = () => (
  <section className="flex w-full flex-col gap-4">
    <div className="flex items-center gap-2">
      <span className="text-sm leading-normal font-medium tracking-[-0.56px] text-white">
        <Trans>Your Performance</Trans>
      </span>
      <Skeleton className="size-4 rounded-full" />
    </div>
    <div className="flex w-full flex-col gap-2 md:flex-row">
      <CardSkeleton className="h-[354px] w-full md:h-[280px] md:w-[712px]" />
      <div className="flex w-full flex-col gap-2 md:w-[360px]">
        <div className="flex w-full gap-2">
          <CardSkeleton className="h-[114px] min-w-0 flex-1 md:h-[136px]" />
          <CardSkeleton className="h-[114px] min-w-0 flex-1 md:h-[136px]" />
        </div>
        <CardSkeleton className="h-[114px] md:h-[136px]" />
      </div>
    </div>
  </section>
);
