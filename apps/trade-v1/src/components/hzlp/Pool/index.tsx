import { FC, memo } from 'react';
import { MEDIA_SIZES, useMediaQuery } from '@repo/ui';
import { CoinDetailItem, PoolDetailResData } from '@/common';
import PoolDesktop from './PoolDesktop';
import PoolMobile from './PoolMobile';
import PoolStats from './PoolStats';

interface PoolProps {
  // Formatted data
  hzlpPrice: string;
  apy: string;
  totalSupply: string;
  marketCap: string;
  totalLiquidity: string;
  tvl: string;
  coinDetail: CoinDetailItem[];
  walletHoldingValue: string;
  walletHoldingAmount: string;

  // Raw data for child components
  poolDetail: PoolDetailResData | undefined;

  // Loading states
  isPoolDetailLoading: boolean;
  isHzLPDetailLoading: boolean;
}

const Pool: FC<PoolProps> = ({
  hzlpPrice,
  apy,
  totalSupply,
  marketCap,
  totalLiquidity,
  tvl,
  coinDetail,
  walletHoldingValue,
  walletHoldingAmount,
  poolDetail,
  isPoolDetailLoading,
  isHzLPDetailLoading,
}) => {
  const mediaSz = useMediaQuery();
  const isSmallScreen = mediaSz === MEDIA_SIZES.SM;

  return (
    <>
      <PoolStats
        hzlpPrice={hzlpPrice}
        apy={apy}
        totalSupply={totalSupply}
        marketCap={marketCap}
        isLoading={isHzLPDetailLoading}
      />

      {isSmallScreen ? (
        <PoolMobile
          apy={apy}
          tvl={tvl}
          totalSupply={totalSupply}
          walletHoldingValue={walletHoldingValue}
          walletHoldingAmount={walletHoldingAmount}
          isPoolDetailLoading={isPoolDetailLoading}
          isHzLPDetailLoading={isHzLPDetailLoading}
        />
      ) : (
        <PoolDesktop
          totalLiquidity={totalLiquidity}
          coinDetail={coinDetail}
          poolDetail={poolDetail}
          isLoading={isHzLPDetailLoading}
        />
      )}
    </>
  );
};

export default memo(Pool);
