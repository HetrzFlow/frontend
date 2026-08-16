import { Trans } from '@lingui/react/macro';
import OverviewMetricItemSkeleton from '@/common/components/OverviewMetricItemSkeleton';
import ModuleCard from '@/components/ModuleCard';
import PoolsListSkeleton from './components/PoolsList/Skeleton';

const metricLabels = [
  { key: 'tvl', label: <Trans>TVL</Trans> },
  { key: 'total-earned-fees', label: <Trans>Total Earned Fees</Trans> },
  { key: 'your-deposits', label: <Trans>Your Holdings</Trans> },
  { key: 'your-earned-fees', label: <Trans>Your Unrealised PnL</Trans> },
];

const PoolsMetricsSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-2">
    {metricLabels.map(({ key, label }) => (
      <OverviewMetricItemSkeleton
        key={key}
        title={label}
        skeletonClassName="h-[17px] w-16 md:w-24"
        triggerClassName="rounded-xl p-2"
      />
    ))}
  </div>
);

const PoolsOverviewSkeleton = () => (
  <div className="h-[calc(100dvh-56px)] overflow-y-auto md:flex md:h-full md:flex-col md:gap-1 md:overflow-x-hidden md:overflow-y-auto md:p-1">
    <div className="flex flex-col gap-y-4 md:shrink-0 md:flex-row md:gap-1">
      <ModuleCard className="relative flex flex-1 flex-col gap-8 overflow-hidden rounded-none p-0 max-md:gap-6 md:rounded-2xl">
        <div className="px-4 pt-6 md:pt-4">
          <div className="relative z-10">
            <h2 className="font-borna font-medium max-md:text-xl md:mb-0 md:w-[50%] md:min-w-[471px]">
              <Trans>
                Provide market-specific liquidity with independent risk and
                asset management.
              </Trans>
            </h2>
          </div>
        </div>
        <div className="to-bg-1 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-b from-transparent md:hidden" />
        <div className="relative z-20 px-2 pb-6 md:pb-2">
          <PoolsMetricsSkeleton />
        </div>
      </ModuleCard>
      <ModuleCard className="relative hidden w-1/2 overflow-hidden p-0 md:block">
        <p className="absolute top-1/2 left-10 z-20 -translate-y-1/2 text-base/tight font-medium whitespace-nowrap">
          <Trans>Open Liquidity. Modular Yield.</Trans>
        </p>
      </ModuleCard>
    </div>
    <div className="min-h-0 min-w-0 md:flex-1">
      <ModuleCard className="flex h-full flex-col md:p-3">
        <div className="min-h-0 flex-1 max-md:pb-6">
          <PoolsListSkeleton />
        </div>
      </ModuleCard>
    </div>
  </div>
);

export default PoolsOverviewSkeleton;
