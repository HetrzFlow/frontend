import { useMemo } from 'react';
import {
  calc,
  FEE_BPS_POWER,
  FeeKey,
  HZLP_DECIMALS,
  ZERO_STR,
} from '@hertzflow/sdk';
import { normalizeStructTag } from '@mysten/sui/utils';
import { UseFormReturn } from 'react-hook-form';
import { queryClient, useMutation, useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import {
  useHzSdk,
  buildPriceId,
  useHzLPDetail,
  getProtocolStoreDataFromCache,
  getVaultDataFromCache,
  getCachedPriceTickerData,
  usePriceTickerStream,
  useInstStore,
} from '@/common';
import { type Coin } from '@/common';

import { usePreferenceStore } from '@/stores/hzlp/preference';

const hzlpReceiveAmountKeyPrefix = ['rest', 'hzlpReceiveAmount'];

const getCoinPrice = (
  coinType: string,
  coins: Record<string, Coin>,
): string => {
  const coin = coins[coinType];
  if (!coin) {
    throw new Error(`Coin not found for coinType: ${coinType}`);
  }

  const priceKey = buildPriceId(coin.symbol);
  const price = getCachedPriceTickerData(priceKey)?.[0]?.p;

  return price ?? ZERO_STR;
};

type CalcHzlpReceiveParamsType = {
  coinType: string;
  amount: string;
};

type HzlpReceiveResultType = boolean;

export const useCalcReceiveAmount = (options: {
  isBuy: boolean;
  onError?: (error: Error) => void;
}) => {
  const { isBuy, onError } = options;
  const slippage = usePreferenceStore((state) => state.slippage);
  const coins = useInstStore((state) => state.getCoins());
  const hzSdk = useHzSdk();

  return useMutation({
    mutationKey: [isBuy],
    mutationFn: async (params: CalcHzlpReceiveParamsType) => {
      queryClient.setQueryData<CalcHzlpReceiveParamsType>(
        [hzlpReceiveAmountKeyPrefix, isBuy, 'params'],
        params,
      );

      const { coinType, amount } = params;

      queryClient.setQueryData(
        [hzlpReceiveAmountKeyPrefix, isBuy, 'result'],
        true,
      );

      queryClient.setQueryData(
        [hzlpReceiveAmountKeyPrefix, isBuy, 'isCalcing'],
        true,
      );

      try {
        if (coins[coinType]?.decimal !== undefined && +amount) {
          const res = isBuy
            ? await hzSdk.QueryModule.queryAddLiquidityAmountAndFee({
                coinType: coinType,
                amountIn: amount,
                inCoinDecimals: coins[coinType].decimal,
                slippage: +slippage,
                inCoinPrice: getCoinPrice(coinType, coins),
                outCoinDecimals: HZLP_DECIMALS,
              })
            : await hzSdk.QueryModule.queryRemoveLiquidityAmountAndFee({
                coinType: coinType,
                amountIn: amount,
                slippage: +slippage,
                outCoinPrice: getCoinPrice(coinType, coins),
                outCoinDecimals: coins[coinType].decimal,
              });

          queryClient.setQueryData(
            [hzlpReceiveAmountKeyPrefix, isBuy, 'result'],
            false,
          );

          queryClient.setQueryData(
            [hzlpReceiveAmountKeyPrefix, isBuy, 'isCalcing'],
            false,
          );

          return res.amountOutAfterFee;
        }
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          toast.error((error as Error).message);
        }
      }
      queryClient.setQueryData(
        [hzlpReceiveAmountKeyPrefix, isBuy, 'result'],
        false,
      );

      queryClient.setQueryData(
        [hzlpReceiveAmountKeyPrefix, isBuy, 'isCalcing'],
        false,
      );
    },
  });
};

export const useHzLPReceiveAmount = (
  isBuy: boolean,
  form: UseFormReturn<{
    paySz: {
      value: string;
      coin: string;
    };
    receiveSz: {
      value: string;
      coin: string;
    };
  }>,
  handlePaySzChange: (value: { value: string; coin: string }) => void,
) => {
  return useQuery({
    queryKey: [hzlpReceiveAmountKeyPrefix, isBuy, 'result'],
    queryFn: () => {
      handlePaySzChange(form.getValues('paySz'));

      return (
        queryClient.getQueryData<HzlpReceiveResultType>([
          hzlpReceiveAmountKeyPrefix,
          isBuy,
          'result',
        ]) || false
      );
    },
    enabled: !!form,
    refetchInterval: 5000,
  });
};

export const useIsCalcing = (isBuy: boolean, enabled: boolean = false) => {
  return useQuery({
    queryKey: [hzlpReceiveAmountKeyPrefix, isBuy, 'isCalcing'],
    queryFn: () => {
      return (
        queryClient.getQueryData<boolean>([
          hzlpReceiveAmountKeyPrefix,
          isBuy,
          'isCalcing',
        ]) ?? false
      );
    },
    enabled: enabled,
  });
};

export const usePriceImpactSelect = ({
  isBuy,
  payCoinType,
  receiveCoinType,
  payCoinAmount,
}: {
  isBuy: boolean;
  payCoinType: string;
  receiveCoinType: string;
  payCoinAmount: string;
}) => {
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());
  const payCoin = coins[payCoinType ?? ''];
  const receiveCoin = coins[receiveCoinType ?? ''];
  const { data: hzlpDetail } = useHzLPDetail();
  const vaultObject = getVaultDataFromCache(hzSdk.fullClient.network);
  const protocolStore = getProtocolStoreDataFromCache(hzSdk.fullClient.network);

  let payCoinPx = usePriceTickerStream(
    isBuy && payCoin ? buildPriceId(payCoin.symbol) : '',
  ).data[0]?.p;
  payCoinPx = isBuy
    ? (payCoinPx ?? ZERO_STR)
    : (hzlpDetail?.hzlp_price?.toString() ?? ZERO_STR);

  let receiveCoinPx = usePriceTickerStream(
    !isBuy && receiveCoin ? buildPriceId(receiveCoin.symbol) : '',
  ).data[0]?.p;
  receiveCoinPx = !isBuy
    ? (receiveCoinPx ?? ZERO_STR)
    : (hzlpDetail?.hzlp_price?.toString() ?? ZERO_STR);

  const size = calc(payCoinAmount).times(payCoinPx);
  const { data: priceImpacts, isFetching } = useQuery({
    queryKey: ['rest', 'feeRates', isBuy, payCoinType, payCoinAmount],
    enabled:
      Number(payCoinAmount) > 0 &&
      vaultObject !== undefined &&
      protocolStore !== undefined,
    queryFn: async () => {
      let result: {
        name: string;
        type: string;
        feeBps: number;
      }[] = [];
      if (!payCoinAmount) return [];
      try {
        if (isBuy) {
          if (!payCoin) return [];
          result = await hzSdk.QueryModule.queryAddFeeBps({
            vaultObject,
            coinType: payCoinType!,
            coinDecimals: payCoin.decimal,
            amount: payCoinAmount,
          });
        } else {
          result = await hzSdk.QueryModule.queryRemoveFeeBps({
            vaultObject,
            hzlpAmount: payCoinAmount,
          });
        }

        const lpFeeRate = hzSdk.QueryModule.getFeeRate({
          feeKey: FeeKey.AddRemoveFee,
          protocolStore: protocolStore!,
        });
        const lpFee = calc(size)
          .times(lpFeeRate)
          .div(FEE_BPS_POWER)
          .toString(10);

        const priceImpacts = result.map((v) => {
          const priceImpactRate = v.feeBps - Number(lpFeeRate);
          const priceImpact = calc(size)
            .times(priceImpactRate)
            .div(FEE_BPS_POWER)
            .toString(10);

          return {
            coinType: normalizeStructTag(v.name),
            totalFeeRate: v.feeBps / FEE_BPS_POWER,
            lpFeeRate: Number(lpFeeRate) / FEE_BPS_POWER,
            priceImpactRate: Number(priceImpactRate) / FEE_BPS_POWER,
            priceImpact,
            lpFee,
          };
        });
        return priceImpacts;
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-feeRates' });
        throw error;
      }
    },
  });

  const result = useMemo(() => {
    if (!priceImpacts || priceImpacts.length === 0) {
      return {
        currentToken: {
          coinType: '',
          symbol: '',
          price: '',
          totalFee: '',
          lpFeeRate: '',
          priceImpactRate: '',
          priceImpact: '',
          lpFee: '',
        },
        bestToken: {
          coinType: '',
          symbol: '',
          price: '',
          totalFee: '',
          lpFeeRate: '',
          priceImpactRate: '',
          priceImpact: '',
          lpFee: '',
        },
        priceDifferencePercent: 0,
      };
    }

    const currentToken = priceImpacts.find(
      (item) => item.coinType === (isBuy ? payCoinType : receiveCoinType),
    );
    if (!currentToken) {
      return {
        currentToken: {
          coinType: '',
          symbol: '',
          price: '',
          totalFee: '',
          lpFeeRate: '',
          priceImpactRate: '',
          priceImpact: '',
          lpFee: '',
        },
        bestToken: {
          coinType: '',
          symbol: '',
          price: '',
          totalFee: '',
          lpFeeRate: '',
          priceImpactRate: '',
          priceImpact: '',
          lpFee: '',
        },
        priceDifferencePercent: 0,
      };
    }

    const currentTotalFee = calc(size)
      .times(currentToken.totalFeeRate)
      .toString(10);

    const currentCoin = coins[currentToken.coinType];

    const minTotalFeeRate = Math.min(
      ...priceImpacts.map((item) => item.totalFeeRate),
    );

    if (currentToken.totalFeeRate <= minTotalFeeRate) {
      const currentTokenData = {
        coinType: currentToken.coinType,
        symbol: currentCoin?.symbol ?? '',
        price: isBuy ? payCoinPx : receiveCoinPx,
        totalFee: currentTotalFee,
        lpFeeRate: currentToken.lpFeeRate.toString(),
        priceImpactRate: currentToken.priceImpactRate.toString(),
        priceImpact: currentToken.priceImpact,
        lpFee: currentToken.lpFee,
      };

      return {
        currentToken: currentTokenData,
        bestToken: currentTokenData,
        priceDifferencePercent: 0,
      };
    }

    const optimalTokens = priceImpacts.filter(
      (item) => item.totalFeeRate === minTotalFeeRate,
    );

    if (optimalTokens.length === 0) {
      const currentTokenData = {
        coinType: currentToken.coinType,
        symbol: currentCoin?.symbol ?? '',
        price: isBuy ? payCoinPx : receiveCoinPx,
        totalFee: currentTotalFee,
        lpFeeRate: currentToken.lpFeeRate.toString(),
        priceImpactRate: currentToken.priceImpactRate.toString(),
        priceImpact: currentToken.priceImpact,
        lpFee: currentToken.lpFee,
      };

      return {
        currentToken: currentTokenData,
        bestToken: currentTokenData,
        priceDifferencePercent: 0,
      };
    }

    let bestToken = optimalTokens[0]!;
    if (optimalTokens.length === 1) {
      bestToken = optimalTokens[0]!;
    } else {
      const minPriceImpactRate = Math.min(
        ...optimalTokens.map((item) => item.priceImpactRate),
      );
      const optimalPriceImpactTokens = optimalTokens.filter(
        (item) => item.priceImpactRate === minPriceImpactRate,
      );

      if (optimalPriceImpactTokens.length === 1) {
        bestToken = optimalPriceImpactTokens[0]!;
      } else {
        const suiToken = optimalPriceImpactTokens.find((item) => {
          const coin = coins[item.coinType];
          return coin?.symbol?.toLowerCase() === 'sui';
        });
        bestToken = suiToken ?? optimalPriceImpactTokens[0]!;
      }
    }

    const bestTotalFee = calc(size).times(bestToken.totalFeeRate).toString(10);

    const bestCoin = coins[bestToken.coinType];
    const bestCoinPrice = getCachedPriceTickerData(
      buildPriceId(bestCoin?.symbol ?? ''),
    )?.[0]?.p;

    const currentTotalFeeNum = parseFloat(currentTotalFee);
    const bestTotalFeeNum = parseFloat(bestTotalFee);

    let priceDifferencePercent: number;
    if (bestTotalFeeNum === 0) {
      priceDifferencePercent = 100;
    } else {
      priceDifferencePercent =
        ((currentTotalFeeNum - bestTotalFeeNum) / currentTotalFeeNum) * 100;
    }

    return {
      currentToken: {
        coinType: currentToken.coinType,
        symbol: currentCoin?.symbol ?? '',
        price: isBuy ? payCoinPx : receiveCoinPx,
        totalFee: currentTotalFee,
        lpFeeRate: currentToken.lpFeeRate.toString(),
        priceImpactRate: currentToken.priceImpactRate.toString(),
        priceImpact: currentToken.priceImpact,
        lpFee: currentToken.lpFee,
      },
      bestToken: {
        coinType: bestToken.coinType,
        symbol: bestCoin?.symbol ?? '',
        price: bestCoinPrice ?? '',
        totalFee: bestTotalFee,
        lpFeeRate: bestToken.lpFeeRate.toString(),
        priceImpactRate: bestToken.priceImpactRate.toString(),
        priceImpact: bestToken.priceImpact,
        lpFee: bestToken.lpFee,
      },
      priceDifferencePercent: Math.max(0, priceDifferencePercent),
    };
  }, [
    priceImpacts,
    size,
    coins,
    isBuy,
    payCoinPx,
    receiveCoinPx,
    payCoinType,
    receiveCoinType,
  ]);

  const isReady = !isFetching && result.currentToken.coinType !== '';

  const setData = (data: typeof result) => {
    queryClient.setQueryData(
      ['priceImpactSelect', isBuy, payCoinType, receiveCoinType, payCoinAmount],
      data,
    );
  };

  return {
    isFetching,
    isReady,
    isCalculating: !isFetching && !isReady,
    setData,
    ...result,
  };
};
