import { useMemo } from 'react';
import { createFindSwapPath } from '@hertzflow/sdk-v2/utils/swap/swapPath';
import { getWithdrawalAmounts } from '@hertzflow/sdk-v2/utils/trade/liquidityWithdrawal';
import type { MarketTokenData } from '@/stores/synthetics/marketTokens/types';
import type {
  MarketInfo,
  MarketsInfoData,
} from '@hertzflow/sdk-v2/types/markets';
import type { TokenPrices, TokensData } from '@hertzflow/sdk-v2/types/tokens';
import type { WithdrawalAmounts } from '@hertzflow/sdk-v2/types/trade';
import type { Address } from 'viem';

export interface UseWithdrawalAmountsParams {
  chainId: number;
  marketInfo: MarketInfo | undefined;
  marketsInfoData: MarketsInfoData | undefined;
  marketTokenData: MarketTokenData | undefined;
  marketTokenAmount: bigint;
  tokensData: TokensData | undefined;
  pricesMap: Record<Address, TokenPrices>;
  uiFeeFactor?: bigint;
  receiveTokenAddress?: Address;
}

export interface UseWithdrawalAmountsReturn {
  withdrawalAmounts: WithdrawalAmounts | undefined;
  isReady: boolean;
}

export function useWithdrawalAmounts({
  chainId,
  marketInfo,
  marketsInfoData,
  marketTokenData,
  marketTokenAmount,
  tokensData,
  pricesMap,
  uiFeeFactor = 0n,
  receiveTokenAddress,
}: UseWithdrawalAmountsParams): UseWithdrawalAmountsReturn {
  const findSwapPath = useMemo(() => {
    if (
      !receiveTokenAddress ||
      !marketInfo ||
      !marketsInfoData ||
      !tokensData
    ) {
      return undefined;
    }

    const fromTokenAddress =
      receiveTokenAddress === marketInfo.shortTokenAddress
        ? marketInfo.longTokenAddress
        : marketInfo.shortTokenAddress;

    return createFindSwapPath({
      chainId,
      fromTokenAddress,
      toTokenAddress: receiveTokenAddress,
      marketsInfoData,
      prices: pricesMap,
      tokensData,
      isExpressFeeSwap: false,
    });
  }, [
    chainId,
    receiveTokenAddress,
    marketInfo,
    marketsInfoData,
    tokensData,
    pricesMap,
  ]);

  const withdrawalAmounts = useMemo(() => {
    const hasInputAmount = marketTokenAmount > 0n;
    if (!marketInfo || !marketTokenData || !tokensData || !hasInputAmount) {
      return undefined;
    }

    const longToken = tokensData[marketInfo.longTokenAddress];
    const shortToken = tokensData[marketInfo.shortTokenAddress];
    const longTokenPrices = pricesMap[marketInfo.longTokenAddress as Address];
    const shortTokenPrices = pricesMap[marketInfo.shortTokenAddress as Address];

    if (!longToken || !shortToken || !longTokenPrices || !shortTokenPrices) {
      return undefined;
    }

    try {
      const result = getWithdrawalAmounts({
        marketInfo,
        marketTokenDecimals: marketTokenData.decimals,
        marketTokenTotalSupply: marketTokenData.totalSupply,
        longToken,
        shortToken,
        longTokenPrices,
        shortTokenPrices,
        marketTokenAmount,
        uiFeeFactor,
        wrappedReceiveTokenAddress: receiveTokenAddress,
        findSwapPath,
      });

      return result;
    } catch (error) {
      console.error('Failed to calculate withdrawal amounts:', error);
      return undefined;
    }
  }, [
    marketInfo,
    marketTokenData,
    marketTokenAmount,
    tokensData,
    pricesMap,
    uiFeeFactor,
    receiveTokenAddress,
    findSwapPath,
  ]);

  const isReady = withdrawalAmounts !== undefined;

  return {
    withdrawalAmounts,
    isReady,
  };
}
