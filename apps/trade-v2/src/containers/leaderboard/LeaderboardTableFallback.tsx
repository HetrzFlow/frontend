import { Trans } from '@lingui/react/macro';
import { SkeletonLayout, cn } from '@repo/ui';

const SKELETON_ROW_COUNT = 10;
const SKELETON_ROW_IDS = Array.from(
  { length: SKELETON_ROW_COUNT },
  (_, index) => `leaderboard-skeleton-${index}`,
);

const desktopColumnClassNames = {
  rank: 'w-7 text-center',
  trader: 'w-[200px]',
  pnl: 'w-20',
  volume: 'w-20',
  trades: 'w-20',
  winRate: 'w-20',
  referee: 'w-20 text-right',
  referralVolume: 'w-24 text-right',
};

const desktopTableContainerClassName =
  'w-full flex-col gap-2 rounded-2xl border border-border p-3';
const mobileTableContainerClassName = 'w-full flex-col gap-2';

const DesktopSkeletonRow = () => (
  <div className="flex h-[31px] w-full items-center justify-between rounded-lg p-2">
    <div className={desktopColumnClassNames.rank}>
      <SkeletonLayout isLoading className="h-4 w-7" />
    </div>
    <div className={desktopColumnClassNames.trader}>
      <SkeletonLayout isLoading className="h-4 w-[120px]" />
    </div>
    <div className={desktopColumnClassNames.pnl}>
      <SkeletonLayout isLoading className="h-4 w-14" />
    </div>
    <div className={desktopColumnClassNames.volume}>
      <SkeletonLayout isLoading className="h-4 w-16" />
    </div>
    <div className={desktopColumnClassNames.trades}>
      <SkeletonLayout isLoading className="h-4 w-10" />
    </div>
    <div className={desktopColumnClassNames.winRate}>
      <SkeletonLayout isLoading className="h-4 w-12" />
    </div>
    <div className={desktopColumnClassNames.referee}>
      <SkeletonLayout isLoading className="ml-auto h-4 w-10" />
    </div>
    <div className={desktopColumnClassNames.referralVolume}>
      <SkeletonLayout isLoading className="ml-auto h-4 w-14" />
    </div>
  </div>
);

const MobileSkeletonRow = () => (
  <div className="flex h-[31px] w-full items-center gap-4 rounded-lg px-3 py-2">
    <div className="w-10">
      <SkeletonLayout isLoading className="h-4 w-10" />
    </div>
    <div className="min-w-0 flex-1">
      <SkeletonLayout isLoading className="h-4 w-28" />
    </div>
    <div className="w-20">
      <SkeletonLayout isLoading className="ml-auto h-4 w-12" />
    </div>
  </div>
);

export const LeaderboardTableFallback = () => (
  <>
    <section className={cn('hidden md:flex', desktopTableContainerClassName)}>
      <div className="flex w-full items-start justify-between px-2 text-[13px] leading-normal tracking-[-0.52px] text-white/70">
        <span className={desktopColumnClassNames.rank}>
          <Trans>Rank</Trans>
        </span>
        <span className={desktopColumnClassNames.trader}>
          <Trans>Trader</Trans>
        </span>
        <span
          className={cn(
            desktopColumnClassNames.pnl,
            'underline decoration-dotted underline-offset-3',
          )}
        >
          <Trans>PnL</Trans>
        </span>
        <span
          className={cn(
            desktopColumnClassNames.volume,
            'underline decoration-dotted underline-offset-3',
          )}
        >
          <Trans>Volume</Trans>
        </span>
        <span className={desktopColumnClassNames.trades}>
          <Trans>Trades</Trans>
        </span>
        <span className={desktopColumnClassNames.winRate}>
          <Trans>Win Rate</Trans>
        </span>
        <span
          className={cn(
            desktopColumnClassNames.referee,
            'underline decoration-dotted underline-offset-3',
          )}
        >
          <Trans id="leaderboard.referee">Referee</Trans>
        </span>
        <span
          className={cn(
            desktopColumnClassNames.referralVolume,
            'underline decoration-dotted underline-offset-3',
          )}
        >
          <Trans>Referral Vol</Trans>
        </span>
      </div>
      <div className="flex w-full flex-col gap-1">
        {SKELETON_ROW_IDS.map((id) => (
          <DesktopSkeletonRow key={`desktop-${id}`} />
        ))}
      </div>
    </section>

    <section className={cn('flex md:hidden', mobileTableContainerClassName)}>
      <div className="flex w-full items-center gap-4 px-3 text-[13px] leading-normal tracking-[-0.52px] text-white/70">
        <span className="w-10">
          <Trans>RANK</Trans>
        </span>
        <span className="min-w-0 flex-1">
          <Trans>Trader</Trans>
        </span>
        <span className="w-20 text-right underline decoration-dotted underline-offset-3">
          <Trans>PnL</Trans>
        </span>
      </div>
      <div className="flex w-full flex-col gap-1">
        {SKELETON_ROW_IDS.map((id) => (
          <MobileSkeletonRow key={`mobile-${id}`} />
        ))}
      </div>
    </section>
  </>
);
