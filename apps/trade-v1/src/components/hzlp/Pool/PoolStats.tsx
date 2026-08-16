import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Separator, SkeletonLayout } from '@repo/ui';

interface PoolStatsProps {
  hzlpPrice: string;
  apy: string;
  totalSupply: string;
  marketCap: string;
  isLoading: boolean;
}

const PoolStats: FC<PoolStatsProps> = ({
  hzlpPrice,
  apy,
  totalSupply,
  marketCap,
  isLoading,
}) => {
  const { t } = useLingui();

  return (
    <div className="border-border hidden items-center gap-y-3 border-y py-4 md:flex md:h-[118px] md:justify-evenly md:p-6">
      <div className="space-y-3">
        <SkeletonLayout isLoading={isLoading} className="h-8 w-full">
          <div className="text-t-1100 font-plex text-center text-2xl/tight font-semibold md:text-4xl/[0.9]">
            {hzlpPrice}
          </div>
        </SkeletonLayout>
        <div className="text-t-270 text-center text-xs leading-normal md:text-sm">
          {t`HzLP Price`}
        </div>
      </div>
      <Separator orientation="vertical" className="hidden md:block" />
      <div className="space-y-3">
        <SkeletonLayout isLoading={isLoading} className="h-8 w-full">
          <div className="text-t-1100 font-plex text-center text-2xl/tight font-semibold md:text-4xl/[0.9]">
            {apy}
          </div>
        </SkeletonLayout>
        <div className="text-t-270 text-center text-xs leading-normal md:text-sm">
          {t`APY`}
        </div>
      </div>
      <Separator orientation="vertical" className="hidden md:block" />
      <div className="space-y-3">
        <SkeletonLayout isLoading={isLoading} className="h-8 w-full">
          <div className="text-t-1100 font-plex text-center text-2xl/tight font-semibold md:text-4xl/[0.9]">
            {totalSupply}
          </div>
        </SkeletonLayout>
        <div className="text-t-270 text-center text-xs leading-normal md:text-sm">
          {t`HzLP Supply`}
        </div>
      </div>
      <Separator orientation="vertical" className="hidden md:block" />
      <div className="space-y-3">
        <SkeletonLayout isLoading={isLoading} className="h-8 w-full">
          <div className="text-t-1100 font-plex text-center text-2xl/tight font-semibold md:text-4xl/[0.9]">
            {marketCap}
          </div>
        </SkeletonLayout>
        <div className="text-t-270 text-center text-xs leading-normal md:text-sm">
          {t`Market Cap`}
        </div>
      </div>
    </div>
  );
};

export default memo(PoolStats);

