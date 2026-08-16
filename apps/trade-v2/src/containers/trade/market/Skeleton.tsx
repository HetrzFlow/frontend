import { useLingui } from '@lingui/react/macro';
import { Skeleton, cn } from '@repo/ui';

interface MarketSkeletonProps {
  className?: string;
}

const MarketMetricSkeleton = ({
  label,
  valueClassName = 'w-16',
}: {
  label: string;
  valueClassName?: string;
}) => (
  <div className="flex h-full shrink-0 flex-col items-start justify-between rounded-lg px-2 py-1 max-md:hidden">
    <span className="text-t-270 text-[10px] font-normal">{label}</span>
    <Skeleton className={cn('h-4', valueClassName)} />
  </div>
);

const MarketSkeleton = ({ className }: MarketSkeletonProps) => {
  const { t } = useLingui();

  return (
    <div
      className={cn(
        'marketContainer z-10 flex h-11 w-full shrink-0 items-center gap-2 overflow-hidden max-md:justify-between',
        className,
      )}
    >
      <div className="bg-bg-3 flex h-8 shrink-0 items-center gap-1 rounded-xl px-4 max-md:h-10 max-md:px-3">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="ml-1 h-4 w-16 max-md:w-20" />
        <Skeleton className="ml-1 h-3.5 w-3.5" />
      </div>

      <div className="bg-border mx-2 h-9 w-px shrink-0 max-md:hidden" />

      <div className="font-plex flex h-full shrink-0 flex-col items-start justify-between rounded-lg px-2 py-1">
        <Skeleton className="h-5 w-20 max-md:h-6 max-md:w-24" />
        <Skeleton className="h-3.5 w-10 max-md:ml-auto" />
      </div>

      <div className="relative h-full min-w-0 shrink max-md:hidden">
        <div className="scrollbar-none flex h-full items-center gap-2 overflow-hidden font-medium">
          <MarketMetricSkeleton label={t`24h High`} />
          <MarketMetricSkeleton label={t`24h Low`} />
          <MarketMetricSkeleton label={t`24h Volume`} />
          <div className="bg-border h-9 w-px shrink-0" />
          <MarketMetricSkeleton
            label={t`Liquidity(L/S)`}
            valueClassName="w-28"
          />
          <MarketMetricSkeleton
            label={t`Open Interest(L/S)`}
            valueClassName="w-32"
          />
          <MarketMetricSkeleton label={t`Loss Rebate`} valueClassName="w-14" />
        </div>
      </div>
    </div>
  );
};

export default MarketSkeleton;
