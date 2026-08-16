import { useMemo } from 'react';
import { useGasLimits, useGasPrice } from '@/common/services/rest/gas';
import {
  estimateExecuteWithdrawalGasLimit,
  estimateWithdrawalOraclePriceCount,
  getExecutionFee,
} from '@/domain/synthetics/fees';
import type {
  ExecutionFee,
  GasLimitsConfig,
} from '@hertzflow/sdk-v2/types/fees';
import type { TokenPrices, TokensData } from '@hertzflow/sdk-v2/types/tokens';

export interface UseWithdrawalExecutionFeeParams {
  chainId: number;
  tokensData: TokensData | undefined;
  nativeTokenPrices: TokenPrices | undefined;
  swapsCount?: number;
  callbackGasLimit?: bigint;
}

export interface UseWithdrawalExecutionFeeReturn {
  executionFee: ExecutionFee | undefined;
  gasLimits: GasLimitsConfig | undefined;
  gasPrice: bigint | undefined;
  isLoading: boolean;
  isReady: boolean;
}

export function useWithdrawalExecutionFee({
  chainId,
  tokensData,
  nativeTokenPrices,
  swapsCount = 0,
  callbackGasLimit = 0n,
}: UseWithdrawalExecutionFeeParams): UseWithdrawalExecutionFeeReturn {
  const { data: gasLimits, isLoading: isGasLimitsLoading } = useGasLimits();
  const { data: gasPrice, isLoading: isGasPriceLoading } = useGasPrice();

  const executionFee = useMemo(() => {
    if (!gasLimits || !gasPrice || !tokensData || !nativeTokenPrices) {
      return undefined;
    }

    try {
      const estimatedGasLimit = estimateExecuteWithdrawalGasLimit(gasLimits, {
        callbackGasLimit,
        swapsCount: BigInt(swapsCount),
      });

      const oraclePriceCount = estimateWithdrawalOraclePriceCount(swapsCount);

      return getExecutionFee(
        chainId,
        gasLimits,
        nativeTokenPrices,
        tokensData,
        estimatedGasLimit,
        gasPrice,
        oraclePriceCount,
      );
    } catch (error) {
      console.error('Failed to calculate withdrawal execution fee:', error);
      return undefined;
    }
  }, [gasLimits, gasPrice, tokensData, nativeTokenPrices, callbackGasLimit, swapsCount, chainId]);

  const isLoading = isGasLimitsLoading || isGasPriceLoading;
  const isReady = executionFee !== undefined;

  return {
    executionFee,
    gasLimits,
    gasPrice,
    isLoading,
    isReady,
  };
}
