import { Skeleton, cn } from '@repo/ui';

interface MarketTickerBarSkeletonProps {
  className?: string;
}

const itemWidths = [
  ['w-10', 'w-14', 'w-9'],
  ['w-12', 'w-16', 'w-8'],
  ['w-9', 'w-13', 'w-10'],
  ['w-11', 'w-15', 'w-8'],
  ['w-10', 'w-14', 'w-9'],
  ['w-12', 'w-16', 'w-10'],
];

const MarketTickerBarSkeleton = ({
  className,
}: MarketTickerBarSkeletonProps) => (
  <div
    className={cn(
      'relative h-6 shrink-0 overflow-hidden max-md:h-8',
      "before:pointer-events-none before:absolute before:top-0 before:left-0 before:z-[1] before:h-full before:w-20 before:bg-[linear-gradient(to_right,var(--background),transparent)] before:content-['']",
      "after:pointer-events-none after:absolute after:top-0 after:right-0 after:z-[1] after:h-full after:w-20 after:bg-[linear-gradient(to_right,transparent,var(--background))] after:content-['']",
      className,
    )}
  >
    <div className="flex h-full w-max items-center gap-1 overflow-hidden">
      {itemWidths.map((widths, index) => (
        <div
          key={`market-ticker-skeleton-${index}`}
          className="flex h-6 shrink-0 items-center gap-1 rounded-xl px-2 max-md:h-8"
        >
          <Skeleton className={cn('h-3.5', widths[0])} />
          <Skeleton className={cn('h-3.5', widths[1])} />
          <Skeleton className={cn('ml-1 h-3', widths[2])} />
        </div>
      ))}
    </div>
  </div>
);

export default MarketTickerBarSkeleton;
