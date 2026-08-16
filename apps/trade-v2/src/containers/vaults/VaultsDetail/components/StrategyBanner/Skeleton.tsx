import ModuleCard from '@/components/ModuleCard';

const StrategyBannerSkeleton = () => (
  <ModuleCard className="max-md:bg-bg-2 rounded-2xl p-3 max-md:p-3">
    <div className="flex w-full flex-col items-center gap-2">
      <div className="bg-bg-3 size-[120px] rounded-full" />
      <div className="w-full space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex h-5 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-bg-3 size-2 rounded-full" />
              <div className="bg-bg-3 size-5 rounded-full" />
              <div className="bg-bg-3 h-[14.4px] w-10 rounded-xl" />
            </div>
            <div className="bg-bg-3 h-[14.4px] w-12 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  </ModuleCard>
);

export default StrategyBannerSkeleton;
