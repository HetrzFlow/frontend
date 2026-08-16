import { useCallback, useMemo } from 'react';
import { BASIS_POINTS_DIVISOR_BIGINT } from '@hertzflow/sdk-v2/configs/factors';
import { getInternalUsdParamsForMarketTokens } from '@hertzflow/sdk-v2/configs/internalUsd';
import { bigMath } from '@hertzflow/sdk-v2/utils/bigmath';
import { zeroAddress, type Address } from 'viem';

import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient/hooks';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { usePriceStore } from '@/common/stores/priceStore';
import { useMarketInfoByAddress } from '@/queries/bsc/pools';
import { useMarketTokenByAddress } from '@/stores/synthetics/marketTokens/hooks';
import { usePreferenceStore } from '@/stores/trade/preference';
import { useDepositAmounts } from './useDepositAmounts';
import { useDepositExecutionFee } from './useDepositExecutionFee';
import { useTokensData } from './useTokensData';

import type { ExecutionFee } from '@hertzflow/sdk-v2/types/fees';
import type { DepositAmounts } from '@hertzflow/sdk-v2/types/trade';

const BASIS_POINTS_DIVISOR = 10000;
const FIRST_DEPOSIT_RECEIVER =
  '0x0000000000000000000000000000000000000001' as Address;

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

export interface UseHzlpDepositTransactionParams {
  marketAddress: Address;
  enabled?: boolean;
  longTokenAmount?: bigint;
  shortTokenAmount?: bigint;
  longTokenSwapPath?: Address[];
  shortTokenSwapPath?: Address[];
}

export interface UseHzlpDepositTransactionReturn {
  depositAmounts: DepositAmounts | undefined;
  executionFee: ExecutionFee | undefined;
  minMarketTokens: bigint | undefined;
  isLoading: boolean;
  isReady: boolean;
  onDeposit: () => Promise<`0x${string}` | undefined>;
}

export function useHzlpDepositTransaction(
  params: UseHzlpDepositTransactionParams,
): UseHzlpDepositTransactionReturn {
  const {
    marketAddress,
    enabled = true,
    longTokenAmount = 0n,
    shortTokenAmount = 0n,
    longTokenSwapPath = [],
    shortTokenSwapPath = [],
  } = params;

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

  const { tokensData, isLoading: isTokensLoading } = useTokensData();

  const nativeTokenPrices = pricesMap[zeroAddress];

  const marketInfo = marketInfoData ?? undefined;

  const { marketTokenData } = useMarketTokenByAddress({
    marketAddress,
    isDeposit: true,
    enabled: enabled && !!marketAddress,
  });
  const isMarketTokenDataLoading = marketTokenData === undefined;

  const internalUsd = useMemo(
    () =>
      getInternalUsdParamsForMarketTokens({
        chainId: hzSdk?.chainId,
        longTokenAddress: marketInfo?.longTokenAddress,
        shortTokenAddress: marketInfo?.shortTokenAddress,
      }),
    [
      hzSdk?.chainId,
      marketInfo?.longTokenAddress,
      marketInfo?.shortTokenAddress,
    ],
  );
  const isFirstDeposit = marketTokenData?.totalSupply === 0n;

  const { depositAmounts, isReady: isAmountsReady } = useDepositAmounts({
    marketInfo,
    marketTokenData,
    longTokenAmount,
    shortTokenAmount,
    tokensData,
    pricesMap,
  });

  const swapsCount = useMemo(
    () => longTokenSwapPath.length + shortTokenSwapPath.length,
    [longTokenSwapPath, shortTokenSwapPath],
  );

  const { executionFee, isLoading: isFeeLoading } = useDepositExecutionFee({
    chainId: hzSdk?.chainId ?? 0,
    tokensData,
    nativeTokenPrices,
    swapsCount,
    callbackGasLimit: 0n,
  });

  const minMarketTokens = useMemo(() => {
    if (!depositAmounts?.marketTokenAmount) return undefined;
    return applySlippageToMinOut(
      allowedSlippage,
      depositAmounts.marketTokenAmount,
    );
  }, [depositAmounts?.marketTokenAmount, allowedSlippage]);

  const isLoading =
    enabled &&
    (isMarketLoading ||
      isTokensLoading ||
      isMarketTokenDataLoading ||
      isFeeLoading ||
      !isAmountsReady);

  const isReady = useMemo(() => {
    return (
      enabled &&
      !!hzSdk &&
      !!account &&
      !!marketInfo &&
      !!tokensData &&
      !!depositAmounts &&
      !!executionFee &&
      executionFee.feeTokenAmount > 0n &&
      !!minMarketTokens &&
      (longTokenAmount > 0n || shortTokenAmount > 0n)
    );
  }, [
    hzSdk,
    enabled,
    account,
    marketInfo,
    tokensData,
    depositAmounts,
    executionFee,
    minMarketTokens,
    longTokenAmount,
    shortTokenAmount,
  ]);

  const onDeposit = useCallback(async (): Promise<
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
      !minMarketTokens
    )
      return undefined;

    const depositParams = {
      addresses: {
        receiver: isFirstDeposit ? FIRST_DEPOSIT_RECEIVER : account,
        callbackContract: zeroAddress,
        uiFeeReceiver: zeroAddress,
        market: marketAddress,
        initialLongToken: marketInfo.longTokenAddress as Address,
        initialShortToken: marketInfo.shortTokenAddress as Address,
        longTokenSwapPath,
        shortTokenSwapPath,
      },
      minMarketTokens,
      shouldUnwrapNativeToken: false,
      executionFee: executionFee.feeTokenAmount,
      callbackGasLimit: 0n,
      dataList: [] as `0x${string}`[],
    };

    const txHash = await hzSdk.liquidity.createDeposit({
      params: depositParams,
      longTokenAmount,
      shortTokenAmount,
      internalUsd,
    });

    return txHash;
  }, [
    isReady,
    hzSdk,
    account,
    marketInfo,
    executionFee,
    tokensData,
    internalUsd,
    minMarketTokens,
    marketAddress,
    longTokenAmount,
    shortTokenAmount,
    longTokenSwapPath,
    shortTokenSwapPath,
    isFirstDeposit,
  ]);

  return {
    depositAmounts,
    executionFee,
    minMarketTokens,
    isLoading,
    isReady,
    onDeposit,
  };
}
