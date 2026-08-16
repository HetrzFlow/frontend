import { useMemo } from 'react';
import { addHexPrefix } from '@hertzflow/sdk';
import { calc } from '@repo/lib/calc';
import { TOTAL_WEIGHT } from '../constants/common';
import { usePoolDetail } from '../services/rest/liqPool';

export interface CoinWeight {
  coinType: string;
  coinName: string;
  currentWeight: number; // e.g. 0.1205 = 12.05%
  targetWeight: number; // e.g.  0.20 = 20%
  currentWeightPercent: string; // e.g. "12.05%"
  targetWeightPercent: string; // e.g. "20.00%"
}

export interface CoinWeightsMap {
  [coinType: string]: CoinWeight;
}

/**
 * all coin weight hook
 */
export const useCoinWeights = () => {
  const { data: poolDetailData, isLoading, error } = usePoolDetail();

  const { coinWeights, coinWeightsMap } = useMemo(() => {
    if (!poolDetailData?.coin_details) {
      return {
        coinWeights: [],
        coinWeightsMap: {},
      };
    }

    const weights: CoinWeight[] = [];
    const weightsMap: CoinWeightsMap = {};

    poolDetailData.coin_details.forEach((coin) => {
      const { coin_type, coin_name, current_weight, target_weight } = coin;

      // current_weight (e.g. 0.1205 = 12.05%)
      const currentWeightDecimal = current_weight;

      const targetWeightDecimal = calc(target_weight).toNumber();

      // percentage string
      const currentWeightPercent = `${(currentWeightDecimal * 100).toFixed(2)}%`;
      const targetWeightPercent = `${(targetWeightDecimal * 100).toFixed(2)}%`;

      const coinWeight: CoinWeight = {
        coinType: addHexPrefix(coin_type),
        coinName: coin_name,
        currentWeight: currentWeightDecimal,
        targetWeight: targetWeightDecimal,
        currentWeightPercent,
        targetWeightPercent,
      };

      weights.push(coinWeight);
      weightsMap[addHexPrefix(coin_type)] = coinWeight;
    });

    return {
      coinWeights: weights,
      coinWeightsMap: weightsMap,
    };
  }, [poolDetailData]);

  /**
   * get weight by coinType
   */
  const getCoinWeightByCoinType = useMemo(() => {
    return (coinType: string): CoinWeight | undefined => {
      const normalizedCoinType = coinType.startsWith('0x')
        ? coinType
        : addHexPrefix(coinType);
      return coinWeightsMap[normalizedCoinType];
    };
  }, [coinWeightsMap]);

  /**
   * get weight by coinName
   */
  const getCoinWeightByCoinName = useMemo(() => {
    return (coinName: string): CoinWeight | undefined => {
      return coinWeights.find(
        (weight) => weight.coinName.toLowerCase() === coinName.toLowerCase(),
      );
    };
  }, [coinWeights]);

  return {
    // origin data
    coinWeights,
    coinWeightsMap,

    // query function
    getCoinWeightByCoinType,
    getCoinWeightByCoinName,

    // status
    isLoading,
    hasError: !!error,

    // details
    totalCoins: coinWeights.length,
  };
};
