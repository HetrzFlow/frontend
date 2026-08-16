import { useMemo } from 'react';
import { addHexPrefix } from '@hertzflow/sdk';
import { calc } from '@repo/lib/calc';
import { buildPriceId } from '../constants/common';
import { usePoolDetail } from '../services/rest/liqPool';
import { usePriceTickerStream } from '../services/ws/tickers';
import { useInstStore } from '../stores/instStore';

export const useTvl = () => {
  const {
    data: poolDetailData,
    isLoading: isDataLoading,
    error,
  } = usePoolDetail();
  const coins = useInstStore((state) => state.getCoins());
  const { data: prices } = usePriceTickerStream(
    poolDetailData?.coin_details?.map((coin) => buildPriceId(coin.coin_name)) ||
      [],
    { throttleWait: 5000 },
  );

  const { rawValue, isCalculating } = useMemo(() => {
    if (isDataLoading) {
      return {
        rawValue: '0',
        isCalculating: true,
      };
    }

    // Check if we have necessary calculation dependencies
    const hasCoinsData = Object.keys(coins).length > 0;
    const hasPoolData =
      poolDetailData?.coin_details &&
      Array.isArray(poolDetailData.coin_details) &&
      poolDetailData.coin_details.length > 0;

    // Check if all required prices are loaded
    const hasAllRequiredPrices =
      !hasPoolData || poolDetailData.coin_details.every((_, i) => prices[i]);

    // If any necessary data is missing, continue showing loading state
    if (!hasPoolData || !hasCoinsData || !hasAllRequiredPrices) {
      return {
        rawValue: '0',
        isCalculating: true,
      };
    }

    // Calculate real-time TVL using current prices
    const realTimeTvl = poolDetailData.coin_details.reduce(
      (total, coin, index) => {
        const { coin_type, coin_amount } = coin;

        const coinObjFromInstStore = coins[addHexPrefix(coin_type)];
        const px = prices[index]?.[0]?.p;

        if (!px || !coinObjFromInstStore?.decimal) {
          return total;
        }

        const coinPoolSizeUsd = calc(coin_amount)
          .div(Math.pow(10, coinObjFromInstStore.decimal))
          .times(px);

        return total.plus(coinPoolSizeUsd);
      },
      calc(0),
    );

    return {
      rawValue: realTimeTvl.toString(10),
      isCalculating: false,
    };
  }, [poolDetailData, coins, prices, isDataLoading]);

  return {
    rawValue,
    tvl: calc(rawValue),
    isLoading: isCalculating,
    hasError: !!error,
  };
};
