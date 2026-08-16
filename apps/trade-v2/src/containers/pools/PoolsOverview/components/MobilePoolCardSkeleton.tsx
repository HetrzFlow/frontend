import { Trans } from '@lingui/react/macro';
import { SkeletonLayout } from '@repo/ui';

const MobilePoolCardSkeleton = () => (
  <div className="block">
    <div className="border-border-h5 space-y-3 rounded-xl border p-3">
      <div
        className="flex items-center justify-between gap-3"
        id="mobile-pool-card-header"
      >
        <div className="flex items-center gap-2">
          <SkeletonLayout isLoading className="size-8 rounded-full" />
          <SkeletonLayout isLoading className="h-[17px] w-24" />
        </div>
      </div>
      <SkeletonLayout isLoading className="h-12 w-9/10" />
      <div className="space-y-1">
        <div className="text-t-350 text-xs">
          <Trans>Fee APY</Trans>
        </div>
        <SkeletonLayout isLoading className="h-10 w-24" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-t-350 text-xs">
            <Trans>TVL</Trans>
          </div>
          <SkeletonLayout isLoading className="h-[14.4px] w-16" />
        </div>
        <div>
          <div className="text-t-350 text-xs">
            <Trans>Supply</Trans>
          </div>
          <SkeletonLayout isLoading className="h-[14.4px] w-20" />
        </div>
      </div>
    </div>
  </div>
);

export default MobilePoolCardSkeleton;
