import { FC, memo } from 'react';
import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import { GradientBorder, Loading, Separator, SkeletonLayout } from '@repo/ui';
import { CoinDetailItem, PoolDetailResData } from '@/common';
import Allocation from '@/components/hzlp/Allocation';
import PoolPieChart from '@/containers/hzlp/charts/PoolPieChart';

const LiquidityLineChart = dynamic(
  () => import('@/containers/hzlp/charts/LiquidityLineChart'),
  {
    loading: () => <Loading className="h-[40px] md:h-[90px]" />,
  },
);

interface PoolDesktopProps {
  totalLiquidity: string;
  coinDetail: CoinDetailItem[];
  poolDetail: PoolDetailResData | undefined;
  isLoading: boolean;
}

const PoolDesktop: FC<PoolDesktopProps> = ({
  totalLiquidity,
  coinDetail,
  poolDetail,
  isLoading,
}) => {
  const { t } = useLingui();

  return (
    <GradientBorder outerClassName="p-6 pb-0 rounded-3xl hidden md:block">
      <h2 className="mb-6 text-2xl/[0.9] font-semibold">{t`HzLP Pool`}</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="text-t-270 flex flex-col gap-3 text-sm">
          <h3>{t`Total Liquidity`}</h3>
          <SkeletonLayout isLoading={isLoading} className="h-8 w-40">
            <p className="text-t-1100 font-plex text-3xl/[0.9] font-semibold lg:text-4xl/[0.9]">
              {totalLiquidity}
            </p>
          </SkeletonLayout>
          <LiquidityLineChart />
        </div>
        <div className="text-t-270 flex flex-col gap-3 text-xs lg:text-sm">
          <h3>{t`Pool Composition`}</h3>
          <PoolPieChart poolName="HzLP" data={coinDetail} />
        </div>
      </div>
      <Separator className="my-6" />
      <Allocation poolDetail={poolDetail} />
    </GradientBorder>
  );
};

export default memo(PoolDesktop);
