import { useMemo } from 'react';
import { calc, fromDecimalsAmount, ZERO_STR } from '@hertzflow/sdk';
import { unitFormat } from '@repo/lib/format';
import { HZLPDetailRes, useHZLPPrice } from '@/common';
import { useBalances, useIsConnect } from './useAccount';

export const useWalletHolding = (hzLPDetail: HZLPDetailRes | undefined) => {
  const isConnect = useIsConnect();
  const hzlpPx = useHZLPPrice();
  const balance = useBalances()?.find(
    (v) => v?.coinType === hzLPDetail?.coin_type,
  );

  const balanceFormatted = useMemo(
    () =>
      balance && hzLPDetail
        ? fromDecimalsAmount(balance.totalBalance, hzLPDetail.hzlp_decimal)
        : ZERO_STR,
    [balance, hzLPDetail],
  );

  const walletHoldingAmount = useMemo(
    () =>
      isConnect
        ? unitFormat(balanceFormatted, hzLPDetail?.hzlp_decimal, {
            stripTrailingZeros: true,
          })
        : '-',
    [isConnect, balanceFormatted, hzLPDetail?.hzlp_decimal],
  );

  const walletHoldingValue = useMemo(
    () =>
      isConnect
        ? unitFormat(
            calc(balanceFormatted).times(hzlpPx ?? ZERO_STR),
            hzLPDetail?.hzlp_decimal,
            {
              stripTrailingZeros: true,
              style: 'currency',
              currency: 'USD',
            },
          )
        : '-',
    [isConnect, balanceFormatted, hzlpPx, hzLPDetail?.hzlp_decimal],
  );

  return {
    balanceFormatted,
    walletHoldingAmount,
    walletHoldingValue,
    isConnect,
  };
};
