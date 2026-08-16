import { useCallback, useMemo } from 'react';
import { BASIS_POINTS_DIVISOR_BIGINT } from '@hertzflow/sdk-v2/configs/factors';
import { bigMath } from '@hertzflow/sdk-v2/utils/bigmath';
import { zeroAddress, getAddress, type Address } from 'viem';

import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient/hooks';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { usePriceStore } from '@/common/stores/priceStore';
import { UI_FEE_RECEIVER_ACCOUNT } from '@/config';
import { useMarketInfoByAddress } from '@/queries/bsc/pools';
import { useMarketTokenByAddress } from '@/stores/synthetics/marketTokens/hooks';
import { usePreferenceStore } from '@/stores/trade/preference';
import { useTokensData } from './useTokensData';
import { useWithdrawalAmounts } from './useWithdrawalAmounts';
import { useWithdrawalExecutionFee } from './useWithdrawalExecutionFee';

import type { ExecutionFee } from '@hertzflow/sdk-v2/types/fees';
import type { WithdrawalAmounts } from '@hertzflow/sdk-v2/types/trade';

const BASIS_POINTS_DIVISOR = 10000;

function applySlippageToMinOut(
  allowedSlippage: number,
  minOutputAmount: bigint,
): bigint {
  const slippageBasisPoints = BASIS_POINTS_DIVISOR - allowedSlippage;
  return bigMath.mulDiv(
    minOutputAmount,
    BigInt(slippageBasisPoints),
    BASIS_POINTS_DIVISOR_BIGINT,
  );
}

export interface UseHzlpWithdrawTransactionParams {
  marketAddress: Address;
  enabled?: boolean;
  marketTokenAmount?: bigint;
}

export interface UseHzlpWithdrawTransactionReturn {
  withdrawalAmounts: WithdrawalAmounts | undefined;
  executionFee: ExecutionFee | undefined;
  minLongTokenAmount: bigint | undefined;
  minShortTokenAmount: bigint | undefined;
  isLoading: boolean;
  isReady: boolean;
  onWithdraw: () => Promise<`0x${string}` | undefined>;
}

export function useHzlpWithdrawTransaction(
  params: UseHzlpWithdrawTransactionParams,
): UseHzlpWithdrawTransactionReturn {
  const { marketAddress, enabled = true, marketTokenAmount = 0n } = params;

  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const pricesMap = usePriceStore((state) => state.pricesMap);

  const slippageStr = usePreferenceStore((state) => state.slippage);
  const allowedSlippage = useMemo(() => {
    const slippagePercent = parseFloat(slippageStr) || 0.02;
    return Math.round(slippagePercent * BASIS_POINTS_DIVISOR);
  }, [slippageStr]);

  const { data: marketInfoData, isLoading: isMarketLoading } =
    useMarketInfoByAddress(marketAddress, {
      enabled: enabled && !!marketAddress,
      refreshInterval: DYNAMIC_DATA_CACHE_TIME,
    });

  const marketsInfoData = useMemo(() => {
    if (!marketInfoData) return undefined;
    const addr = marketInfoData.marketTokenAddress ?? marketAddress;
    if (!addr) return undefined;
    const checksum = getAddress(addr) as Address;
    return { [checksum]: marketInfoData };
  }, [marketInfoData, marketAddress]);
  const isMarketsInfoLoading = !marketsInfoData;

  const { tokensData, isLoading: isTokensLoading } = useTokensData();

  const nativeTokenPrices = pricesMap[zeroAddress];

  const marketInfo = marketInfoData ?? undefined;
  const { marketTokenData } = useMarketTokenByAddress({
    marketAddress,
    isDeposit: false,
    enabled: enabled && !!marketAddress,
  });
  const isMarketTokenDataLoading = marketTokenData === undefined;

  const receiveTokenAddress = marketInfo?.shortTokenAddress as
    | Address
    | undefined;

  const { withdrawalAmounts, isReady: isAmountsReady } = useWithdrawalAmounts({
    chainId: hzSdk?.chainId ?? 0,
    marketInfo,
    marketsInfoData,
    marketTokenData,
    marketTokenAmount,
    tokensData,
    pricesMap,
    receiveTokenAddress,
  });

  const swapsCount = useMemo(() => {
    if (!withdrawalAmounts) return 0;
    const longSwaps =
      withdrawalAmounts.longTokenSwapPathStats?.swapPath?.length ?? 0;
    const shortSwaps =
      withdrawalAmounts.shortTokenSwapPathStats?.swapPath?.length ?? 0;
    return longSwaps + shortSwaps;
  }, [withdrawalAmounts]);

  const { executionFee, isLoading: isFeeLoading } = useWithdrawalExecutionFee({
    chainId: hzSdk?.chainId ?? 0,
    tokensData,
    nativeTokenPrices,
    swapsCount,
    callbackGasLimit: 0n,
  });

  const minLongTokenAmount = useMemo(() => {
    if (!withdrawalAmounts) return undefined;

    if (withdrawalAmounts.longTokenSwapPathStats) {
      return applySlippageToMinOut(
        allowedSlippage,
        withdrawalAmounts.longTokenSwapPathStats.amountOut,
      );
    }
    return applySlippageToMinOut(
      allowedSlippage,
      withdrawalAmounts.longTokenBeforeSwapAmount,
    );
  }, [withdrawalAmounts, allowedSlippage]);

  const minShortTokenAmount = useMemo(() => {
    if (!withdrawalAmounts) return undefined;

    if (withdrawalAmounts.shortTokenSwapPathStats) {
      return applySlippageToMinOut(
        allowedSlippage,
        withdrawalAmounts.shortTokenSwapPathStats.amountOut,
      );
    }
    return applySlippageToMinOut(
      allowedSlippage,
      withdrawalAmounts.shortTokenBeforeSwapAmount,
    );
  }, [withdrawalAmounts, allowedSlippage]);

  const isLoading =
    enabled &&
    (isMarketLoading ||
      isMarketsInfoLoading ||
      isTokensLoading ||
      isMarketTokenDataLoading ||
      isFeeLoading ||
      !isAmountsReady);

  const isReady = useMemo(() => {
    const ready =
      enabled &&
      !!hzSdk &&
      !!account &&
      !!marketInfo &&
      !!tokensData &&
      !!withdrawalAmounts &&
      !!executionFee &&
      executionFee.feeTokenAmount > 0n &&
      minLongTokenAmount !== undefined &&
      minShortTokenAmount !== undefined &&
      marketTokenAmount > 0n;
    return ready;
  }, [
    hzSdk,
    enabled,
    account,
    marketInfo,
    tokensData,
    withdrawalAmounts,
    executionFee,
    minLongTokenAmount,
    minShortTokenAmount,
    marketTokenAmount,
  ]);

  const onWithdraw = useCallback(async (): Promise<
    `0x${string}` | undefined
  > => {
    if (
      !isReady ||
      !hzSdk ||
      !account ||
      !marketInfo ||
      !executionFee ||
      executionFee.feeTokenAmount <= 0n ||
      !tokensData ||
      !withdrawalAmounts ||
      minLongTokenAmount === undefined ||
      minShortTokenAmount === undefined
    )
      return undefined;

    const longTokenSwapPath = (withdrawalAmounts.longTokenSwapPathStats
      ?.swapPath ?? []) as Address[];
    const shortTokenSwapPath = (withdrawalAmounts.shortTokenSwapPathStats
      ?.swapPath ?? []) as Address[];

    const withdrawalParams = {
      addresses: {
        receiver: account,
        callbackContract: zeroAddress,
        uiFeeReceiver: UI_FEE_RECEIVER_ACCOUNT,
        market: marketAddress,
        longTokenSwapPath,
        shortTokenSwapPath,
      },
      minLongTokenAmount,
      minShortTokenAmount,
      shouldUnwrapNativeToken: false,
      executionFee: executionFee.feeTokenAmount,
      callbackGasLimit: 0n,
      dataList: [] as `0x${string}`[],
    };

    const txHash = await hzSdk.liquidity.createWithdrawal({
      params: withdrawalParams,
      marketTokenAmount,
    });

    return txHash;
  }, [
    isReady,
    hzSdk,
    account,
    marketInfo,
    executionFee,
    tokensData,
    withdrawalAmounts,
    minLongTokenAmount,
    minShortTokenAmount,
    marketAddress,
    marketTokenAmount,
  ]);

  return {
    withdrawalAmounts,
    executionFee,
    minLongTokenAmount,
    minShortTokenAmount,
    isLoading,
    isReady,
    onWithdraw,
  };
}
