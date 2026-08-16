'use client';

import { useEffect, useRef, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { cn, TabsActiveBar } from '@repo/ui';
import type { LeaderboardSortBy } from '@/services/rest/leaderboard';

interface PeriodTabsProps {
  activeSortBy: LeaderboardSortBy;
  onSortChange: (sortBy: LeaderboardSortBy) => void;
}

const leaderboardMetricTabs: Array<{
  key: LeaderboardSortBy;
}> = [
  { key: 'pnl' },
  { key: 'volume' },
  { key: 'winRate' },
  { key: 'referee' },
];

export const PeriodTabs = ({ activeSortBy, onSortChange }: PeriodTabsProps) => {
  const { t } = useLingui();
  const tabRefs = useRef<Record<LeaderboardSortBy, HTMLButtonElement | null>>({
    pnl: null,
    volume: null,
    winRate: null,
    referee: null,
  });
  const tabsWrapRef = useRef<HTMLDivElement | null>(null);
  const [activeTabEle, setActiveTabEle] = useState<HTMLButtonElement | null>(
    null,
  );

  useEffect(() => {
    setActiveTabEle(tabRefs.current[activeSortBy]);
  }, [activeSortBy]);
  const getMetricLabel = (key: LeaderboardSortBy) => {
    if (key === 'volume') return t`Volume`;
    if (key === 'winRate') return t`Win Rate`;
    if (key === 'referee') {
      return t({ id: 'leaderboard.referee', message: 'Referee' });
    }
    return t`PnL`;
  };

  return (
    <div
      ref={tabsWrapRef}
      className="relative isolate flex w-fit items-center rounded-xl bg-white/10"
      role="tablist"
      aria-label={t`Leaderboard metric`}
    >
      {leaderboardMetricTabs.map((metric) => {
        const active = metric.key === activeSortBy;

        return (
          <button
            key={metric.key}
            type="button"
            role="tab"
            aria-selected={active}
            ref={(el) => {
              tabRefs.current[metric.key] = el;
              if (active && activeTabEle !== el) {
                setActiveTabEle(el);
              }
            }}
            className={cn(
              'relative z-1 h-8 rounded-xl px-3 py-2 text-[13px] leading-none font-medium tracking-[-0.52px] transition-colors',
              active ? 'text-black' : 'text-white hover:text-white/90',
            )}
            onClick={() => onSortChange(metric.key)}
          >
            {getMetricLabel(metric.key)}
          </button>
        );
      })}
      <TabsActiveBar
        className="bg-accent z-0 h-8 rounded-xl"
        observerEle={tabsWrapRef.current}
        activeTabEle={activeTabEle}
      />
    </div>
  );
};
