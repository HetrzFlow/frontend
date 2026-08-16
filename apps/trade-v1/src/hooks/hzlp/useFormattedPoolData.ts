import { useMemo } from 'react';
import { calc, fromDecimalsAmount, ZERO_STR } from '@hertzflow/sdk';
import { truncate } from '@repo/lib/calc';
import { percentFormat, truncateFormat, unitFormat } from '@repo/lib/format';
import { HZLPDetailRes, PoolDetailResData, useGlobalStore } from '@/common';

export const useFormattedPoolData = (
  poolDetail: PoolDetailResData | undefined,
  hzLPDetail: HZLPDetailRes | undefined,
) => {
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const coinDetail = useMemo(
    () => poolDetail?.coin_details ?? [],
    [poolDetail?.coin_details],
  );

  const totalLiquidity = useMemo(
    () =>
      unitFormat(
        fromDecimalsAmount(
          calc(poolDetail?.total_liquidity ?? ZERO_STR).toString(10),
          usdAmountDecimal,
        ),
        usdAmountDisplayDecimal,
      ),
    [poolDetail?.total_liquidity, usdAmountDecimal, usdAmountDisplayDecimal],
  );

  const totalSupply = useMemo(
    () =>
      unitFormat(
        fromDecimalsAmount(
          hzLPDetail?.total_supply ?? ZERO_STR,
          hzLPDetail?.hzlp_decimal ?? 8,
        ),
        hzLPDetail?.hzlp_decimal ?? 8,
      ),
    [hzLPDetail?.total_supply, hzLPDetail?.hzlp_decimal],
  );

  const apy = useMemo(
    () =>
      hzLPDetail?.apy
        ? percentFormat(hzLPDetail.apy, 2, {
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          })
        : 'N/A',
    [hzLPDetail?.apy],
  );

  const tvl = useMemo(
    () =>
      unitFormat(
        fromDecimalsAmount(
          poolDetail?.total_liquidity ?? ZERO_STR,
          usdAmountDecimal,
        ),
        usdAmountDisplayDecimal,
        {
          style: 'currency',
          currency: 'USD',
        },
      ),
    [poolDetail?.total_liquidity, usdAmountDecimal, usdAmountDisplayDecimal],
  );

  const hzlpPrice = useMemo(
    () =>
      truncateFormat(
        hzLPDetail?.hzlp_price || '',
        hzLPDetail?.hzlp_price_display_precision ?? 4,
        {
          style: 'currency',
          currency: 'USD',
          showMinDecimalValue: true,
        },
      ),
    [hzLPDetail?.hzlp_price, hzLPDetail?.hzlp_price_display_precision],
  );

  const marketCap = useMemo(
    () =>
      unitFormat(
        hzLPDetail?.hzlp_decimal !== undefined && hzLPDetail?.market_cap
          ? truncate(
              fromDecimalsAmount(hzLPDetail?.market_cap, usdAmountDecimal),
              usdAmountDisplayDecimal,
            )
          : '',
        usdAmountDisplayDecimal,
        {
          style: 'currency',
          currency: 'USD',
        },
      ),
    [
      usdAmountDecimal,
      usdAmountDisplayDecimal,
      hzLPDetail?.hzlp_decimal,
      hzLPDetail?.market_cap,
    ],
  );

  return {
    coinDetail,
    totalLiquidity,
    totalSupply,
    apy,
    tvl,
    hzlpPrice,
    marketCap,
  };
};
