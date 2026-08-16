import { Trans } from '@lingui/react/macro';
import {
  PeriodSelectLoadingShell,
  PeriodTabsLoadingShell,
  SummaryCardsSkeleton,
} from './LeaderboardLoadingParts';
import { LeaderboardPodiumFallback } from './LeaderboardPodium';
import { LeaderboardTableFallback } from './LeaderboardTableFallback';

const LeaderboardLoadingShell = () => (
  <main className="h-full min-h-0">
    <div className="relative min-h-full overflow-x-clip">
      <div className="relative z-1 mx-auto flex w-full max-w-[1080px] flex-col gap-5 px-4 pt-5 pb-[calc(104px+env(safe-area-inset-bottom))] md:gap-6 md:px-0 md:pt-2.5 md:pb-10">
        <section className="flex w-full flex-col gap-5 md:h-[67px] md:flex-row md:items-center md:justify-between md:gap-0">
          <div className="flex w-[311px] flex-col justify-center gap-2 md:w-[358px] md:gap-3">
            <h2 className="text-2xl leading-[normal] font-semibold tracking-[-0.96px] text-white md:text-[32px] md:font-medium md:tracking-[-1.28px]">
              <Trans>Leaderboard</Trans>
            </h2>
            <p className="text-sm leading-[normal] text-white/70">
              <Trans>Claim you&apos;re degen? Come prove it.</Trans>
            </p>
          </div>
          <SummaryCardsSkeleton />
        </section>
        <div className="flex h-8 w-full items-center justify-between">
          <PeriodTabsLoadingShell />
          <PeriodSelectLoadingShell />
        </div>
        <LeaderboardPodiumFallback />
        <div className="mt-1 md:mt-0">
          <LeaderboardTableFallback />
        </div>
      </div>
    </div>
  </main>
);

export default LeaderboardLoadingShell;
