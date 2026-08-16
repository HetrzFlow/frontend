import { useLingui } from '@lingui/react/macro';
import { Skeleton, cn } from '@repo/ui';

interface RecentTradesSkeletonProps {
  className?: string;
  rowCount?: number;
}

const rowWidths = [
  ['w-18', 'w-12', 'w-14'],
  ['w-14', 'w-10', 'w-16'],
  ['w-20', 'w-11', 'w-12'],
  ['w-16', 'w-14', 'w-15'],
  ['w-18', 'w-10', 'w-13'],
  ['w-15', 'w-12', 'w-16'],
];

const RecentTradesSkeleton = ({
  className,
  rowCount = 12,
}: RecentTradesSkeletonProps) => {
  const { t } = useLingui();
  const rows = Array.from({ length: rowCount });

  return (
    <div className={cn('relative h-full max-md:text-xs', className)}>
      <div className="text-t-270 flex px-2">
        <span className="w-4/9">{t`Price`}</span>
        <span className="w-2/9">{t`Size`}</span>
        <span className="w-1/3 text-right">{t`Time`}</span>
      </div>

      <div className="relative h-[calc(100%-48px)] overflow-hidden pt-2">
        {rows.map((_, index) => {
          const widths = rowWidths[index % rowWidths.length]!;

          return (
            <div
              key={`recent-trades-skeleton-${index}`}
              className="flex h-[27px] items-center px-2"
            >
              <div className="w-4/9">
                <Skeleton className={cn('h-3', widths[0])} />
              </div>
              <div className="w-2/9">
                <Skeleton className={cn('h-3', widths[1])} />
              </div>
              <div className="flex w-1/3 justify-end">
                <Skeleton className={cn('h-3', widths[2])} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    </div>
  );
};

export default RecentTradesSkeleton;
