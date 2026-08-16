'use client';

import { useMemo, useRef, useState } from 'react';
import { calc } from '@repo/lib/calc';
import { cn, useResizeObserver } from '@repo/ui';
import { useInstStore } from '@/common';
import { useHydrated } from '@/common/hooks/useHydrated';
import { useMarketsStats } from '@/hooks/useMarketsStats';
import Item from './Item';
import MarketTickerBarSkeleton from './Skeleton';

const MIN_MARQUEE_DURATION_SECONDS = 20;
const MARQUEE_DURATION_SECONDS_PER_ITEM = 2.5;

const MarketTickerBar = () => {
  const insts = useInstStore((state) => state.getViewInstsArr());

  const marketsStats = useMarketsStats();

  const sortedInsts = useMemo(() => {
    return insts
      .slice()
      .sort((a, b) => {
        const aMarketStats = marketsStats[a.marketTokenAddress];
        const bMarketStats = marketsStats[b.marketTokenAddress];
        if (
          aMarketStats?.liqLong &&
          aMarketStats.liqShort &&
          aMarketStats.oiLong &&
          aMarketStats.oiShort &&
          bMarketStats?.liqLong &&
          bMarketStats.liqShort &&
          bMarketStats.oiLong &&
          bMarketStats.oiShort
        ) {
          //  rankKey = liquidity * 0.6 + OI * 0.4 desc; alphabet asc
          const aRank = calc(aMarketStats.liqLong)
            .plus(aMarketStats.liqShort)
            .times(0.6)
            .plus(
              calc(aMarketStats.oiLong).plus(aMarketStats.oiShort).times(0.4),
            );
          const bRank = calc(bMarketStats.liqLong)
            .plus(bMarketStats.liqShort)
            .times(0.6)
            .plus(
              calc(bMarketStats.oiLong).plus(bMarketStats.oiShort).times(0.4),
            );
          return calc(aRank).gt(bRank) ? -1 : 1;
        }

        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 20);
  }, [insts, marketsStats]);

  const [shouldAnimate, setShouldAnimate] = useState(false);
  // default show shadow
  const [shouldShadow, setShouldShadow] = useState(true);
  const scrollContainerWidth = useRef(0);
  const itemsContainerWidth = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  const updateAnimationState = (
    nextItemsContainerWidth: number,
    nextScrollContainerWidth: number,
  ) => {
    const nextShouldAnimate =
      nextItemsContainerWidth > nextScrollContainerWidth;
    setShouldAnimate(nextShouldAnimate);
    setShouldShadow(nextShouldAnimate);
  };

  useResizeObserver<HTMLDivElement>((entry) => {
    const { clientWidth } = entry.target;
    if (scrollContainerWidth.current === clientWidth) return;

    scrollContainerWidth.current = clientWidth;
    if (itemsContainerWidth.current) {
      updateAnimationState(itemsContainerWidth.current, clientWidth);
    }
  }, scrollContainerRef.current);

  useResizeObserver<HTMLDivElement>((entry) => {
    const { clientWidth } = entry.target;
    if (itemsContainerWidth.current === clientWidth) return;

    itemsContainerWidth.current = clientWidth;
    if (scrollContainerWidth.current) {
      updateAnimationState(clientWidth, scrollContainerWidth.current);
    }
  }, itemsContainerRef.current);

  const hasHydrated = useHydrated();
  const marqueeDuration = Math.max(
    sortedInsts.length * MARQUEE_DURATION_SECONDS_PER_ITEM,
    MIN_MARQUEE_DURATION_SECONDS,
  );

  if (!hasHydrated || !sortedInsts.length) return <MarketTickerBarSkeleton />;

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        'relative h-6 shrink-0 overflow-hidden max-md:h-8',
        "before:pointer-events-none before:absolute before:top-0 before:left-0 before:z-[1] before:h-full before:w-20 before:content-['']",
        "after:pointer-events-none after:absolute after:top-0 after:right-0 after:z-[1] after:h-full after:w-20 after:content-['']",
        shouldShadow
          ? 'before:block before:bg-[linear-gradient(to_right,var(--background),transparent)] after:block after:bg-[linear-gradient(to_right,transparent,var(--background))]'
          : 'before:hidden before:bg-transparent after:hidden after:bg-transparent',
      )}
    >
      <div
        className={cn(
          'flex h-6 w-max gap-2 max-md:h-8',
          shouldAnimate &&
            'animate-marquee [animation-delay:500ms] hover:[animation-play-state:paused]',
        )}
        style={{
          ['--marquee-duration' as string]: `${marqueeDuration}s`,
          ['--marquee-end' as string]: 'calc(-50% - 2px)',
        }}
      >
        <div
          ref={itemsContainerRef}
          className="flex shrink-0 gap-1 overflow-hidden"
        >
          {sortedInsts.map((v) => (
            <Item key={v.id} instId={v.id} />
          ))}
        </div>
        {shouldAnimate && (
          <div className="flex shrink-0 gap-1 overflow-hidden">
            {sortedInsts.map((v) => (
              <Item key={v.id} instId={v.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketTickerBar;
