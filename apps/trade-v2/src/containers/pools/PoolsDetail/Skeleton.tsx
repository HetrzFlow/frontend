import { Trans } from '@lingui/react/macro';
import DetailBannerSkeleton from '@/common/components/DetailBannerSkeleton';
import PoolTraderSkeleton from '@/containers/pools/PoolTrader/Skeleton';
import ActivityPanelSkeleton from './components/ActivityPanel/Skeleton';
import PoolDetailInfoTabsSkeleton from './components/PoolDetailInfoTabsSkeleton';
import { PoolHealthAndAboutSkeleton } from './components/PoolHealthAndAbout';

const PoolDetailHeaderSkeleton = () => (
  <div className="flex shrink-0 items-center gap-2">
    <div className="bg-bg-2 flex size-8 items-center justify-center rounded-full" />
    <div className="flex items-center gap-2">
      <div className="bg-bg-3 h-8 w-8 rounded-full md:h-6 md:w-6" />
      <div className="bg-bg-3 h-[16.8px] w-16 rounded-xl" />
      <div className="bg-bg-3 h-[22px] w-21 rounded-sm" />
    </div>
  </div>
);

const PoolDetailLoadingShell = () => (
  <div
    data-detail-page-shell
    className="relative left-1/2 h-[calc(100dvh-56px)] min-h-0 w-screen -translate-x-1/2 overflow-x-hidden overflow-y-auto pb-[calc(160px+env(safe-area-inset-bottom))] md:h-full md:pb-10"
  >
    <h2 className="sr-only">
      <Trans>Pool Details</Trans>
    </h2>
    <div className="mx-auto max-w-[1080px] px-4 md:px-1">
      <div className="relative z-10 pt-[env(safe-area-inset-top)] md:pt-0">
        <div className="bg-bg-1-h5 pointer-events-none absolute inset-0 md:hidden" />
        <div className="relative z-10 py-2 max-md:pt-0 max-md:pb-4">
          <PoolDetailHeaderSkeleton />
        </div>
      </div>
      <div className="grid min-h-0 grid-cols-1 gap-2 max-md:gap-4 md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-2 max-md:gap-4">
          <DetailBannerSkeleton mobileClassName="bg-bg-2" />
          <PoolDetailInfoTabsSkeleton />
          <PoolHealthAndAboutSkeleton />
          <div className="flex min-h-0 flex-col md:max-h-108 md:flex-1">
            <ActivityPanelSkeleton type="pool" fitContentHeight />
          </div>
        </div>
        <div className="hidden md:block">
          <div className="sticky top-0">
            <PoolTraderSkeleton />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PoolDetailLoadingShell;
