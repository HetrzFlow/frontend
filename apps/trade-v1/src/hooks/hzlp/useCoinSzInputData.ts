import { useMemo } from 'react';
import { ZERO_STR } from '@hertzflow/sdk';
import { calc, truncate } from '@repo/lib/calc';
import {
  MIN_REMAINING_SUI,
  buildPriceId,
  useHzLPDetail,
  useHZLPPrice,
  usePriceTickerStream,
  useInstStore,
} from '@/common';
import { NORMALIZED_SUI_TYPE_ARG } from '@/constants/hzlp/common';
import { useBalances } from '@/hooks/hzlp/useAccount';
import { useIsCalcing } from '@/services/rest/hzlp/trade';

interface CoinSzInputDataParams {
  coin?: string;
  isBuy: boolean;
  disabled?: boolean;
}

export const useCoinSzInputData = ({
  coin,
  isBuy,
  disabled,
}: CoinSzInputDataParams) => {
  const coins = useInstStore((state) => state.getCoins());

  const isHzlp = coin === 'HzLP';
  const { data: hzlpData } = useHzLPDetail(isHzlp);

  const coinObj = useMemo(() => {
    const coinFromStore = Object.values(coins).find((v) => v.symbol === coin);
    return isHzlp
      ? {
          symbol: hzlpData?.symbol,
          coinType: hzlpData?.coin_type,
          decimal: hzlpData?.hzlp_decimal,
        }
      : {
          symbol: coinFromStore?.symbol,
          coinType: coinFromStore?.coinType,
          decimal: coinFromStore?.decimal,
        };
  }, [coins, isHzlp, hzlpData, coin]);

  let coinPx = usePriceTickerStream(
    isHzlp || !coinObj.symbol ? '' : buildPriceId(coinObj.symbol),
    { throttleWait: 5000 },
  ).data[0]?.p;
  const hzlpPx = useHZLPPrice(isHzlp);
  coinPx = isHzlp ? hzlpPx : coinPx;

  const { data: isCalcing } = useIsCalcing(isBuy, !!disabled);

  const balances = useBalances(coinObj.coinType ? [coinObj.coinType] : []);

  const balance = useMemo(() => {
    if (!balances) return '';

    const balanceObj = balances[0];

    if (!balanceObj || !balanceObj.totalBalance) return ZERO_STR;

    return truncate(
      calc(balanceObj.totalBalance).div(Math.pow(10, coinObj?.decimal || 0)),
      coinObj?.decimal,
    );
  }, [balances, coinObj]);

  const maxValue =
    coinObj?.coinType === NORMALIZED_SUI_TYPE_ARG
      ? truncate(calc(balance).minus(MIN_REMAINING_SUI), coinObj?.decimal)
      : balance;

  return {
    coinObj,
    coinPx,
    isCalcing,
    balance,
    maxValue,
    isHzlp,
    hzlpData,
  };
};
