import { useMemo } from 'react';
import { useGasLimits, useGasPrice } from '@/common/services/rest/gas';
import {
  estimateDepositOraclePriceCount,
  estimateExecuteDepositGasLimit,
  getExecutionFee,
} from '@/domain/synthetics/fees';
import type {
  ExecutionFee,
  GasLimitsConfig,
} from '@hertzflow/sdk-v2/types/fees';
import type { TokenPrices, TokensData } from '@hertzflow/sdk-v2/types/tokens';

export interface UseDepositExecutionFeeParams {
  chainId: number;
  tokensData: TokensData | undefined;
  nativeTokenPrices: TokenPrices | undefined;
  swapsCount?: number;
  callbackGasLimit?: bigint;
}

export interface UseDepositExecutionFeeReturn {
  executionFee: ExecutionFee | undefined;
  gasLimits: GasLimitsConfig | undefined;
  gasPrice: bigint | undefined;
  isLoading: boolean;
  isReady: boolean;
}

export function useDepositExecutionFee({
  chainId,
  tokensData,
  nativeTokenPrices,
  swapsCount = 0,
  callbackGasLimit = 0n,
}: UseDepositExecutionFeeParams): UseDepositExecutionFeeReturn {
  const { data: gasLimits, isLoading: isGasLimitsLoading } = useGasLimits();
  const { data: gasPrice, isLoading: isGasPriceLoading } = useGasPrice();

  const executionFee = useMemo(() => {
    if (!gasLimits || !gasPrice || !tokensData) return undefined;

    try {
      const estimatedGasLimit = estimateExecuteDepositGasLimit(gasLimits, {
        swapsCount,
        callbackGasLimit,
      });

      const oraclePriceCount = estimateDepositOraclePriceCount(swapsCount);

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
      console.error('Failed to calculate execution fee:', error);
      return undefined;
    }
  }, [
    chainId,
    gasLimits,
    gasPrice,
    tokensData,
    nativeTokenPrices,
    swapsCount,
    callbackGasLimit,
  ]);

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
