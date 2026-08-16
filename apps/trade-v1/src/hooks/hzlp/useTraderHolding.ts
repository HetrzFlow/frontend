import { useMemo } from 'react';
import { calc, fromDecimalsAmount, ZERO_STR } from '@hertzflow/sdk';
import { truncateFormat } from '@repo/lib/format';
import { useGlobalStore, useHzLPDetail, useHZLPPrice } from '@/common';
import { useBalances, useIsConnect } from './useAccount';

export const useTraderHolding = () => {
  const { data: hzLPDetail, isLoading } = useHzLPDetail();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const isConnect = useIsConnect();
  const balance = useBalances()?.find(
    (v) => v?.coinType === hzLPDetail?.coin_type,
  );

  const amount = useMemo(
    () =>
      balance && hzLPDetail
        ? fromDecimalsAmount(balance.totalBalance, hzLPDetail.hzlp_decimal)
        : ZERO_STR,
    [balance, hzLPDetail],
  );

  const hzlpPx = useHZLPPrice();

  const holdingValue = useMemo(
    () =>
      truncateFormat(
        isConnect ? calc(amount).times(hzlpPx ?? '0') : ZERO_STR,
        hzLPDetail?.hzlp_decimal,
        {
          stripTrailingZeros: true,
        },
      ),
    [isConnect, amount, hzlpPx, hzLPDetail?.hzlp_decimal],
  );

  const holdingValueUSD = useMemo(
    () =>
      truncateFormat(
        isConnect ? calc(amount).times(hzlpPx ?? '') : ZERO_STR,
        usdAmountDisplayDecimal,
        {
          style: 'currency',
          currency: 'USD',
          showMinDecimalValue: true,
        },
      ),
    [isConnect, amount, hzlpPx, usdAmountDisplayDecimal],
  );

  return {
    amount,
    holdingValue,
    holdingValueUSD,
    isConnect,
    isLoading,
    hzLPDetail,
  };
};
