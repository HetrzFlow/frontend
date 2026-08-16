import { Trans } from '@lingui/react/macro';
import { Skeleton, cn } from '@repo/ui';
import ModuleCard from '@/components/ModuleCard';

const DETAIL_BANNER_METRIC_LABELS = [
  { key: 'net-apy', label: <Trans>Net APY</Trans> },
  { key: 'tvl', label: <Trans>TVL</Trans> },
  { key: 'total-earned-fees', label: <Trans>Total Earned Fees</Trans> },
] as const;

const DetailBannerSkeleton = ({
  desktopClassName,
  mobileClassName,
}: {
  desktopClassName?: string;
  mobileClassName?: string;
}) => (
  <>
    <ModuleCard
      className={cn('hidden rounded-2xl p-3 md:block', desktopClassName)}
    >
      <div
        className="grid shrink-0 gap-2"
        style={{
          gridTemplateColumns: `repeat(3, minmax(0, 1fr))`,
        }}
      >
        {DETAIL_BANNER_METRIC_LABELS.map(({ key, label }) => (
          <div key={key} className="space-y-1 rounded-xl p-2">
            <div className="text-t-270 text-xs">{label}</div>
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </ModuleCard>
    <div
      className={cn(
        'bg-bg-3-h5 flex flex-wrap gap-2 rounded-2xl p-3 md:hidden',
        mobileClassName,
      )}
    >
      {DETAIL_BANNER_METRIC_LABELS.map(({ key, label }) => (
        <div key={key} className="basis-[calc(50%-4px)] space-y-1">
          <div className="text-t-270 text-xs">{label}</div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  </>
);

export default DetailBannerSkeleton;
