import { useMemo } from 'react';
import {
  getDepositAmounts,
  TokenDataWithPrices,
} from '@hertzflow/sdk-v2/utils/trade/liquidityDeposit';
import type { MarketTokenData } from '@/stores/synthetics/marketTokens/types';
import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import type { TokenPrices, TokensData } from '@hertzflow/sdk-v2/types/tokens';
import type { DepositAmounts } from '@hertzflow/sdk-v2/types/trade';
import type { Address } from 'viem';

export interface UseDepositAmountsParams {
  marketInfo: MarketInfo | undefined;
  marketTokenData: MarketTokenData | undefined;
  longTokenAmount: bigint;
  shortTokenAmount: bigint;
  tokensData: TokensData | undefined;
  pricesMap: Record<Address, TokenPrices>;
  uiFeeFactor?: bigint;
}

export interface UseDepositAmountsReturn {
  depositAmounts: DepositAmounts | undefined;
  isReady: boolean;
}

export function useDepositAmounts({
  marketInfo,
  marketTokenData,
  longTokenAmount,
  shortTokenAmount,
  tokensData,
  pricesMap,
  uiFeeFactor = 0n,
}: UseDepositAmountsParams): UseDepositAmountsReturn {
  const depositAmounts = useMemo(() => {
    if (!marketInfo || !marketTokenData || !tokensData) {
      return undefined;
    }

    const longToken = tokensData[marketInfo.longTokenAddress];
    const shortToken = tokensData[marketInfo.shortTokenAddress];
    const longTokenPrices = pricesMap[marketInfo.longTokenAddress as Address];
    const shortTokenPrices = pricesMap[marketInfo.shortTokenAddress as Address];

    if (!longToken || !shortToken || !longTokenPrices || !shortTokenPrices) {
      return undefined;
    }

    const longTokenWithPrices: TokenDataWithPrices = {
      ...longToken,
      prices: longTokenPrices,
    };

    const shortTokenWithPrices: TokenDataWithPrices = {
      ...shortToken,
      prices: shortTokenPrices,
    };

    try {
      return getDepositAmounts({
        marketInfo,
        marketToken: marketTokenData,
        longToken: longTokenWithPrices,
        shortToken: shortTokenWithPrices,
        longTokenAmount,
        shortTokenAmount,
        uiFeeFactor,
      });
    } catch (error) {
      console.error('Failed to calculate deposit amounts:', error);
      return undefined;
    }
  }, [
    marketInfo,
    marketTokenData,
    longTokenAmount,
    shortTokenAmount,
    tokensData,
    pricesMap,
    uiFeeFactor,
  ]);

  const isReady = depositAmounts !== undefined;

  return {
    depositAmounts,
    isReady,
  };
}
