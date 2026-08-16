'use client';

import { memo } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { SkeletonLayout } from '@repo/ui';
import { IMAGES_MAP } from '@/common';
import LiquidityLineChart from '@/containers/hzlp/charts/LiquidityLineChart';

type Props = {
  coinName: string;
  apy: string;
  tvl: string;
  totalSupply: string;
  isPoolDetailLoading: boolean;
  isHzLPDetailLoading: boolean;
};

const DetailCard: React.FC<Props> = ({
  coinName,
  apy,
  tvl,
  totalSupply,
  isPoolDetailLoading,
  isHzLPDetailLoading,
}: Props) => {
  const { t } = useLingui();

  return (
    <div className="bg-bg-3-h5 rounded-[12px] p-4">
      <div className="flex items-center gap-2">
        <Image
          src={IMAGES_MAP.coinIcons.HzLP}
          className="rounded-full"
          alt="HzLP icon"
          width={32}
          height={32}
        />
        <span className="text-xl/tight font-semibold">{coinName}</span>
      </div>
      <div className="my-3">
        <LiquidityLineChart />
        <div className="space-y-4">
          <div className="flex items-start justify-between">
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
                isLoading={isHzLPDetailLoading}
                className="h-7 w-16"
              >
                <p className="font-plex text-2xl/tight font-semibold">{tvl}</p>
              </SkeletonLayout>
              <SkeletonLayout
                isLoading={isHzLPDetailLoading}
                className="h-3 w-16"
              >
                <p className="text-t-270 text-right text-xs">
                  {totalSupply} HzLP
                </p>
              </SkeletonLayout>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DetailCard);
