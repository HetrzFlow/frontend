'use client';

import { usePoolDetail, useHzLPDetail } from '@/common';
import Pool from '@/components/hzlp/Pool';
import { useFormattedPoolData } from '@/hooks/hzlp/useFormattedPoolData';
import { useWalletHolding } from '@/hooks/hzlp/useWalletHolding';

const PoolContainer = () => {
  const { data: poolDetail, isLoading: isPoolDetailLoading } = usePoolDetail();
  const { data: hzLPDetail, isLoading: isHzLPDetailLoading } = useHzLPDetail();

  const {
    coinDetail,
    totalLiquidity,
    totalSupply,
    apy,
    tvl,
    hzlpPrice,
    marketCap,
  } = useFormattedPoolData(poolDetail, hzLPDetail);

  const { walletHoldingAmount, walletHoldingValue } =
    useWalletHolding(hzLPDetail);

  return (
    <Pool
      hzlpPrice={hzlpPrice}
      apy={apy}
      totalSupply={totalSupply}
      marketCap={marketCap}
      totalLiquidity={totalLiquidity}
      tvl={tvl}
      coinDetail={coinDetail}
      walletHoldingValue={walletHoldingValue}
      walletHoldingAmount={walletHoldingAmount}
      poolDetail={poolDetail}
      isPoolDetailLoading={isPoolDetailLoading}
      isHzLPDetailLoading={isHzLPDetailLoading}
    />
  );
};

PoolContainer.displayName = 'PoolContainer';

export default PoolContainer;
