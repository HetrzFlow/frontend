'use client';

import { useHzLPDetail, usePoolDetail } from '@/common';
import Allocation from '@/components/hzlp/Allocation';
import DetailCard from '@/components/hzlp/DetailCard';
import DetailPoolComposition from '@/components/hzlp/DetailPoolComposition';
import { useFormattedPoolData } from '@/hooks/hzlp/useFormattedPoolData';

const DetailContainer: React.FC = () => {
  const { data: poolDetail, isLoading: isPoolDetailLoading } = usePoolDetail();
  const { data: hzLPDetail, isLoading: isHzLPDetailLoading } = useHzLPDetail();

  const { apy, tvl, totalSupply } = useFormattedPoolData(
    poolDetail,
    hzLPDetail,
  );

  return (
    <>
      <DetailCard
        coinName="HzLP"
        apy={apy}
        tvl={tvl}
        totalSupply={totalSupply}
        isPoolDetailLoading={isPoolDetailLoading}
        isHzLPDetailLoading={isHzLPDetailLoading}
      />
      <DetailPoolComposition poolDetail={poolDetail} poolName="HzLP" />
      <Allocation poolDetail={poolDetail} />
    </>
  );
};

DetailContainer.displayName = 'DetailContainer';

export default DetailContainer;
