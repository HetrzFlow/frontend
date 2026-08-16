import { Trans } from '@lingui/react/macro';
import OverviewMetricItemSkeleton from '@/common/components/OverviewMetricItemSkeleton';
import VaultCardSkeleton from './components/VaultCardSkeleton';

const VAULT_SKELETON_COUNT = 6;
const VAULT_SKELETON_IDS = Array.from(
  { length: VAULT_SKELETON_COUNT },
  (_, index) => `vault-skeleton-${index}`,
);
const metricLabels = [
  { key: 'tvl', label: <Trans>TVL</Trans> },
  { key: 'total-earned-fees', label: <Trans>Total Earned Fees</Trans> },
  { key: 'your-holdings', label: <Trans>Your Holdings</Trans> },
  { key: 'your-earnings', label: <Trans>Your Unrealised PnL</Trans> },
];

const VaultsMetricsSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 py-4 md:grid-cols-4 md:gap-[8px] md:py-8">
    {metricLabels.map(({ key, label }) => (
      <OverviewMetricItemSkeleton
        key={key}
        title={label}
        skeletonClassName="h-[19.2px] w-16 md:h-[16.8px] md:w-24"
        triggerClassName="cursor-pointer rounded-xl p-2 hover:bg-white/10 md:flex md:flex-col-reverse md:items-center md:justify-center md:gap-[8px] md:text-center"
      />
    ))}
  </div>
);

export const VaultsToolbarSkeletonContent = () => (
  <>
    <div className="bg-bg-3 h-9 flex-1 rounded-xl md:max-w-100" />
    <div className="flex items-center gap-2">
      <div className="bg-bg-3 h-9 w-[80.61px] rounded-xl" />
      <div className="bg-bg-3 hidden h-9 w-[68px] rounded-xl md:block" />
    </div>
  </>
);

const VaultsToolbarSkeleton = () => (
  <div
    id="vault-list-search"
    className="mb-3 flex items-center justify-between gap-1 md:mb-0"
  >
    <VaultsToolbarSkeletonContent />
  </div>
);

export const VaultCardsSkeletonList = ({
  className,
}: {
  className?: string;
}) => (
  <div
    className={`mt-2 space-y-3 md:grid md:grid-cols-4 md:gap-2 ${className ?? ''}`}
  >
    {VAULT_SKELETON_IDS.map((id) => (
      <div key={id} className="w-full md:max-w-[264px]">
        <VaultCardSkeleton />
      </div>
    ))}
  </div>
);

const VaultsOverviewSkeleton = () => (
  <div className="w-full px-4 pt-4 pb-18 md:px-0 md:pb-8">
    <h2 className="text-center text-[26px]/tight font-semibold max-md:text-xl">
      <Trans>Build on BNB. Earn on HertzFlow.</Trans>
    </h2>
    <VaultsMetricsSkeleton />
    <VaultsToolbarSkeleton />
    <VaultCardsSkeletonList className="pb-8" />
  </div>
);

export default VaultsOverviewSkeleton;
