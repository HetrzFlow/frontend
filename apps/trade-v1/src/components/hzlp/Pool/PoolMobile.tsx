import { FC, memo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useLingui } from '@lingui/react/macro';
import { GradientBorder, Loading, SkeletonLayout } from '@repo/ui';
import { IMAGES_MAP } from '@/common';

const LiquidityLineChart = dynamic(
  () => import('@/containers/hzlp/charts/LiquidityLineChart'),
  {
    loading: () => <Loading className="h-[40px] md:h-[90px]" />,
  },
);

interface PoolMobileProps {
  apy: string;
  tvl: string;
  totalSupply: string;
  walletHoldingValue: string;
  walletHoldingAmount: string;
  isPoolDetailLoading: boolean;
  isHzLPDetailLoading: boolean;
}

const PoolMobile: FC<PoolMobileProps> = ({
  apy,
  tvl,
  totalSupply,
  walletHoldingValue,
  walletHoldingAmount,
  isPoolDetailLoading,
  isHzLPDetailLoading,
}) => {
  const { t } = useLingui();

  return (
    <div className="text-t-1100 block p-4 md:hidden">
      <h3 className="mb-4 text-base/tight font-semibold">Pools</h3>
      <Link href="/hzlp/detail" prefetch>
        <GradientBorder outerClassName="p-4">
          <div className="flex items-center gap-2">
            <Image
              src={IMAGES_MAP.coinIcons.HzLP}
              className="rounded-full"
              alt="HzLP icon"
              width={32}
              height={32}
            />
            <span className="text-xl/tight font-semibold">HzLP</span>
          </div>
          <div className="my-3">
            <LiquidityLineChart />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-t-270 text-xs">{t`APY`}</h4>
                  <SkeletonLayout
                    isLoading={isPoolDetailLoading}
                    className="h-7 w-16"
                  >
                    <p className="text-accent font-plex text-2xl/tight font-semibold">
                      {apy}
                    </p>
                  </SkeletonLayout>
                </div>
                <div className="space-y-1">
                  <h4 className="text-t-270 text-right text-xs">{t`TVL`}</h4>
                  <SkeletonLayout
                    isLoading={isPoolDetailLoading}
                    className="h-7 w-16"
                  >
                    <p className="font-plex text-2xl/tight font-semibold">
                      {tvl}
                    </p>
                  </SkeletonLayout>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-t-270 text-xs">{t`Size`}</h4>
                  <SkeletonLayout
                    isLoading={isHzLPDetailLoading}
                    className="h-7 w-16"
                  >
                    <p className="font-plex text-sm/tight">{totalSupply}</p>
                  </SkeletonLayout>
                </div>
                <div className="space-y-1">
                  <h4 className="text-t-270 text-right text-xs">{t`Wallet`}</h4>
                  <SkeletonLayout
                    isLoading={isHzLPDetailLoading}
                    className="h-7 w-16"
                  >
                    <p className="font-plex flex items-center gap-2 text-sm/tight">
                      <span>{walletHoldingValue}</span>
                      <span>{walletHoldingAmount}</span>
                    </p>
                  </SkeletonLayout>
                </div>
              </div>
            </div>
          </div>
        </GradientBorder>
      </Link>
    </div>
  );
};

export default memo(PoolMobile);
