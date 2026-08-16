import { Trans } from '@lingui/react/macro';
import { HzIcon, Skeleton } from '@repo/ui';
import ModuleCard from '@/components/ModuleCard';

const VaultCardSkeletonBody = () => (
  <div className="bg-bg-2 relative isolate overflow-hidden rounded-2xl p-3 pt-20">
    <div className="bg-card pointer-events-none absolute inset-0 hidden md:block" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[150px] overflow-hidden rounded-2xl bg-[#081317]">
      <div className="absolute -top-20 -left-12 h-44 w-72 rounded-full bg-[radial-gradient(circle,rgba(21,130,147,0.48)_0%,transparent_70%)] blur-3xl" />
      <div className="absolute top-2 -right-16 h-36 w-64 rounded-full bg-[radial-gradient(circle,rgba(0,223,235,0.28)_0%,transparent_72%)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,24,28,0)_0%,#0e181c_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_48%)]" />
    </div>
    <div className="relative space-y-3">
      <HzIcon className="text-accent" size={24} />
      <Skeleton className="h-[16.8px] w-28" />
      <div>
        <button
          type="button"
          className="text-t-350 decoration-t-430 inline-flex items-center text-xs underline decoration-dotted underline-offset-3"
        >
          <Trans>APY</Trans>
        </button>
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="flex justify-between">
        <button
          type="button"
          className="text-t-350 decoration-t-430 inline-flex items-center text-xs underline decoration-dotted underline-offset-3"
        >
          <Trans>TVL/Supply</Trans>
        </button>
        <div>
          <Skeleton className="mb-1 ml-auto h-6 w-16" />
          <Skeleton className="ml-auto h-[14.4px] w-12" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-t-350 decoration-t-430 inline-flex items-center text-xs underline decoration-dotted underline-offset-3"
        >
          <Trans>Market Exposure</Trans>
        </button>
        <Skeleton className="h-8 w-[68.7px]" />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-t-350 text-xs">
          <Trans>Deposited</Trans>
        </div>
        <Skeleton className="size-[33px] rounded-full" />
      </div>
    </div>
  </div>
);

const VaultCardSkeletonFooter = () => (
  <div className="bg-bg-3 flex items-center justify-between rounded-b-2xl px-3 pt-3 pb-3">
    <div className="flex flex-col gap-1">
      <div className="text-t-350 text-xs">
        <Trans>Your Holdings</Trans>
      </div>
      <Skeleton className="h-[19.19px] w-20" />
    </div>
    <Skeleton className="h-[24.4px] w-[63px] rounded-xl" />
  </div>
);

const VaultCardSkeleton = () => (
  <div className="relative pb-2">
    <ModuleCard className="bg-bg-3 overflow-hidden rounded-2xl p-0">
      <VaultCardSkeletonBody />
      <VaultCardSkeletonFooter />
    </ModuleCard>
  </div>
);

export default VaultCardSkeleton;
