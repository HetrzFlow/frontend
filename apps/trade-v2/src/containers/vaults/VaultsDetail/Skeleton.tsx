import { Trans } from '@lingui/react/macro';
import DetailBannerSkeleton from '@/common/components/DetailBannerSkeleton';
import ActivityPanelSkeleton from '@/containers/pools/PoolsDetail/components/ActivityPanel/Skeleton';
import { AboutPerformanceTabsSkeleton } from '@/containers/pools/PoolsDetail/components/detailShared';
import PoolTraderSkeleton from '@/containers/pools/PoolTrader/Skeleton';
import VaultDetailInfoTabSkeleton from './components/DetailInfoTab/Skeleton';
import StrategyBannerSkeleton from './components/StrategyBanner/Skeleton';

const VaultDetailHeaderSkeleton = () => (
  <div className="flex shrink-0 items-center gap-2">
    <div className="bg-bg-2 flex size-8 items-center justify-center rounded-full" />
    <div className="flex items-center gap-2">
      <div className="bg-bg-3 h-[16.8px] w-15 rounded-xl" />
    </div>
  </div>
);

const VaultAboutSkeleton = () => (
  <div className="space-y-2">
    <div className="space-y-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="bg-bg-3 h-[14.4px] w-20 rounded-xl" />
          <div className="bg-bg-3 h-[14.4px] w-24 rounded-xl" />
        </div>
      ))}
    </div>
    <div className="space-y-1">
      <div className="bg-bg-3 h-[14.4px] w-full rounded-xl" />
      <div className="bg-bg-3 h-[14.4px] w-4/5 rounded-xl" />
    </div>
    <div className="bg-bg-2 grid grid-cols-2 gap-3 rounded-2xl p-3">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index}>
          <div className="bg-bg-3 h-[14.4px] w-14 rounded-xl" />
          <div className="bg-bg-3 mt-1 h-[19.2px] w-24 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

const VaultDetailLoadingShell = () => (
  <div
    data-detail-page-shell
    className="relative left-1/2 h-[calc(100dvh-56px)] min-h-0 w-screen -translate-x-1/2 overflow-x-hidden overflow-y-auto pb-[calc(160px+env(safe-area-inset-bottom))] md:h-full md:pb-10"
  >
    <h2 className="sr-only">
      <Trans>Vault Details</Trans>
    </h2>
    <div className="mx-auto max-w-[1080px] px-4 md:px-1">
      <div className="relative z-10 pt-[env(safe-area-inset-top)] md:pt-0">
        <div className="bg-bg-1-h5 pointer-events-none absolute inset-0 md:hidden" />
        <div className="relative z-10 py-2 max-md:pt-0 max-md:pb-4">
          <VaultDetailHeaderSkeleton />
        </div>
      </div>
      <div className="grid min-h-0 grid-cols-1 gap-2 max-md:gap-4 md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-2 max-md:gap-4">
          <DetailBannerSkeleton mobileClassName="bg-bg-2" />
          <VaultDetailInfoTabSkeleton />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[260px_minmax(0,1fr)]">
            <StrategyBannerSkeleton />
            <div className="max-md:bg-bg-2 max-md:rounded-2xl max-md:p-3">
              <AboutPerformanceTabsSkeleton
                aboutContent={<VaultAboutSkeleton />}
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-col md:flex-1">
            <ActivityPanelSkeleton type="vault" fitContentHeight />
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

export default VaultDetailLoadingShell;
