import { useMemo } from 'react';
import { fromDecimalsAmount } from '@hertzflow/sdk';
import { queryClient, useMutation, useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { useHzSdk } from '../../chainClient/hooks';
import { useInstStore } from '../../stores/instStore';
import { getCachedPriceTickerData } from '../ws/tickers';
import { getProtocolStoreDataFromCache } from './liqPool';

// qeury maxIn
export const useSwapMaxIn = (payCoinType: string, receiveCoinType: string) => {
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());

  const result = useQuery({
    queryKey: [
      'rest',
      'swapMaxIn',
      payCoinType,
      receiveCoinType,
      hzSdk.fullClient.network,
    ],
    queryFn: async () => {
      return hzSdk.QueryModule.queryMaxSwapIn({
        coinInType: payCoinType,
        coinOutType: receiveCoinType,
      });
    },
  });

  const maxIn = useMemo(() => {
    return result.data && coins[payCoinType]
      ? fromDecimalsAmount(result.data, coins[payCoinType].decimal)
      : '';
  }, [result.data, coins, payCoinType]);

  return { ...result, data: maxIn };
};

type FeeResultType = {
  fee: string;
  swapFee: string;
  priceImpact: string;
  outAmount: string;
  payIsCalcing: boolean;
  receiveIsCalcing: boolean;
};

const feeAmountQueryKeyPrefix = ['rest', 'swapFeeAmount'];
// const feeAmountParamsKey = ['params', 'swap', 'calcSwapAmount'];

type CalcSwapAmountParamsType =
  | {
      calcOut: true;
      inCoinType: string;
      inCoinAmount: string;
      outCoinType: string;
      slippage: number;
    }
  | {
      calcOut: false;
      inCoinType: string;
      outCoinType: string;
      outCoinAmount: string;
      slippage: number;
    };

let calcSwapAmountParams: CalcSwapAmountParamsType | null = null;

// calc swap amount
export const useCalcSwapAmount = (options?: {
  onError?: (error: Error) => void;
}) => {
  const coins = useInstStore((state) => state.getCoins());
  const hzSdk = useHzSdk();
  return useMutation({
    mutationFn: async (params: CalcSwapAmountParamsType) => {
      calcSwapAmountParams = params;

      const { inCoinType, outCoinType, slippage } = params;
      const swapFeeResult = queryClient.getQueryData<FeeResultType>([
        feeAmountQueryKeyPrefix,
        inCoinType,
        outCoinType,
      ]);

      queryClient.setQueryData(
        [feeAmountQueryKeyPrefix, inCoinType, outCoinType],
        {
          ...swapFeeResult,
          receiveIsCalcing: params.calcOut,
          payIsCalcing: !params.calcOut,
        },
      );
      queryClient.setQueryData(
        [feeAmountQueryKeyPrefix, inCoinType, 'isCalcing'],
        !params.calcOut,
      );
      queryClient.setQueryData(
        [feeAmountQueryKeyPrefix, outCoinType, 'isCalcing'],
        params.calcOut,
      );
      try {
        const protocolStore = getProtocolStoreDataFromCache(
          hzSdk.fullClient.network,
        );
        const outCoinPx = getCachedPriceTickerData(
          `${coins[outCoinType]?.symbol || ''}/USD`,
        )?.[0]?.p;
        if (params.calcOut) {
          const { inCoinAmount } = params;
          if (
            coins[inCoinType]?.decimal !== undefined &&
            coins[outCoinType]?.decimal !== undefined &&
            protocolStore &&
            outCoinPx
          ) {
            const result = inCoinAmount
              ? await hzSdk.QueryModule.querySwapAmountOut({
                  protocolStore,
                  typeArguments: [inCoinType, outCoinType],
                  amountIn: inCoinAmount,
                  inCoinDecimals: coins[inCoinType].decimal,
                  slippage: slippage,
                  outCoinPrice: outCoinPx,
                  outCoinDecimals: coins[outCoinType].decimal,
                })
              : {
                  formatted: {
                    totalFee: '',
                    swapFee: '',
                    priceImpact: '',
                    amountOutAfterFee: '',
                    amountOutAfterFeeWithSlippage: '',
                  },
                };

            if (params === calcSwapAmountParams) {
              queryClient.setQueryData(
                [feeAmountQueryKeyPrefix, inCoinType, outCoinType],
                {
                  fee: result.formatted.totalFee,
                  swapFee: result.formatted.swapFee,
                  priceImpact: result.formatted.priceImpact,
                  outAmount: result.formatted.amountOutAfterFee,
                  receiveIsCalcing: false,
                  payIsCalcing: false,
                },
              );

              queryClient.setQueryData(
                [feeAmountQueryKeyPrefix, inCoinType, 'isCalcing'],
                false,
              );
              queryClient.setQueryData(
                [feeAmountQueryKeyPrefix, outCoinType, 'isCalcing'],
                false,
              );
              return result;
            }
            return;
          }
        } else {
          const { outCoinAmount } = params;
          if (
            coins[inCoinType]?.decimal !== undefined &&
            coins[outCoinType]?.decimal !== undefined &&
            protocolStore &&
            outCoinPx
          ) {
            const result = outCoinAmount
              ? await hzSdk.QueryModule.querySwapAmountIn({
                  protocolStore,
                  typeArguments: [inCoinType, outCoinType],
                  amountOut: outCoinAmount,
                  inCoinDecimals: coins[inCoinType].decimal,
                  outCoinDecimals: coins[outCoinType].decimal,
                  slippage: slippage,
                  outCoinPrice: outCoinPx,
                })
              : {
                  formatted: {
                    totalFee: 0,
                    swapFee: 0,
                    priceImpact: 0,
                    amountInRes: '',
                    amountOutRes: '',
                    amountOutWithSlippage: '',
                  },
                };

            if (params === calcSwapAmountParams) {
              queryClient.setQueryData(
                [feeAmountQueryKeyPrefix, inCoinType, outCoinType],
                {
                  fee: result.formatted.totalFee,
                  swapFee: result.formatted.swapFee,
                  priceImpact: result.formatted.priceImpact,
                  outAmount: result.formatted.amountOutRes,
                  receiveIsCalcing: false,
                  payIsCalcing: false,
                },
              );

              queryClient.setQueryData(
                [feeAmountQueryKeyPrefix, inCoinType, 'isCalcing'],
                false,
              );
              queryClient.setQueryData(
                [feeAmountQueryKeyPrefix, outCoinType, 'isCalcing'],
                false,
              );
              return result;
            }
            return;
          }
        }
      } catch (error) {
        if (options?.onError) {
          options.onError(error as Error);
        } else {
          toast.error((error as Error).message);
        }
      }

      queryClient.setQueryData(
        [feeAmountQueryKeyPrefix, inCoinType, outCoinType],
        {
          ...swapFeeResult,
          receiveIsCalcing: false,
          payIsCalcing: false,
        },
      );

      queryClient.setQueryData(
        [feeAmountQueryKeyPrefix, inCoinType, 'isCalcing'],
        false,
      );
      queryClient.setQueryData(
        [feeAmountQueryKeyPrefix, outCoinType, 'isCalcing'],
        false,
      );
    },
  });
};

export const getCalcSwapAmountParams = () => {
  return calcSwapAmountParams;
};

// qeury swap fee
export const useSwapFeeAmount = (
  payCoinType?: string,
  receiveCoinType?: string,
) => {
  const { mutate: calcSwapAmount } = useCalcSwapAmount();
  return useQuery({
    queryKey: [feeAmountQueryKeyPrefix, payCoinType, receiveCoinType],
    queryFn: () => {
      if (calcSwapAmountParams) {
        calcSwapAmount(calcSwapAmountParams);
      }

      return (
        queryClient.getQueryData<FeeResultType>([
          feeAmountQueryKeyPrefix,
          payCoinType,
          receiveCoinType,
        ]) || {
          fee: '0',
          swapFee: '0',
          priceImpact: '0',
          outAmount: '',
          receiveIsCalcing: false,
          payIsCalcing: false,
        }
      );
    },
    enabled: !!(payCoinType && receiveCoinType),
    refetchInterval: 5000,
    gcTime: 0,
  });
};

// query swap fee
export const useIsCalcing = (coinType?: string) => {
  return useQuery({
    queryKey: [feeAmountQueryKeyPrefix, coinType, 'isCalcing'],
    queryFn: () => {
      return (
        queryClient.getQueryData<boolean>([
          feeAmountQueryKeyPrefix,
          coinType,
          'isCalcing',
        ]) ?? false
      );
    },
    enabled: !!coinType,
    gcTime: 0,
  });
};

// reset calc params
export const resetCalcParams = ({
  payCoinType,
  receiveCoinType,
}: {
  payCoinType?: string;
  receiveCoinType?: string;
}) => {
  calcSwapAmountParams = null;
  queryClient.setQueryData(
    [feeAmountQueryKeyPrefix, payCoinType, receiveCoinType],
    null,
  );
};
