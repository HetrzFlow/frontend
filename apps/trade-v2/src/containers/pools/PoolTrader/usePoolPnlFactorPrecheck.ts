import { useMemo } from 'react';
import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import {
  MAX_PNL_FACTOR_FOR_DEPOSITS_KEY,
  maxPnlFactorKey,
} from '@hertzflow/sdk-v2/configs/dataStore';
import { getMarketPnl } from '@hertzflow/sdk-v2/utils/markets';
import { PRECISION } from '@hertzflow/sdk-v2/utils/numbers';
import { convertToUsd } from '@hertzflow/sdk-v2/utils/tokens';
import { getAddress } from 'viem';
import { useQuery } from '@repo/lib/queryClient';
import { useHzSdk } from '@/common/chainClient/hooks';
import { STATIC_CONFIG_CACHE_TIME } from '@/common/constants/timeConstants';
import type { Coin } from '@/common/services/rest/inst';
import { useInstStore } from '@/common/stores/instStore';
import { usePriceStore } from '@/common/stores/priceStore';
import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import type { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';

type PoolPnlFactors = {
  long: bigint;
  short: bigint;
};

type PoolPnlFactorPrecheckParams = {
  marketInfo: MarketInfo | undefined;
  isDeposit: boolean;
  enabled: boolean;
};

function getByAddress<T>(items: Record<string, T>, address: string): T | undefined {
  const checksumAddress = getAddress(address);
  return items[checksumAddress] ?? items[checksumAddress.toLowerCase()];
}

function getPoolUsd({
  marketInfo,
  pricesMap,
  coinsMap,
  isLong,
}: {
  marketInfo: MarketInfo;
  pricesMap: Record<string, TokenPrices>;
  coinsMap: Record<string, Coin>;
  isLong: boolean;
}) {
  const tokenAddress = isLong
    ? marketInfo.longTokenAddress
    : marketInfo.shortTokenAddress;
  const poolAmount = isLong
    ? marketInfo.longPoolAmount
    : marketInfo.shortPoolAmount;
  const tokenPrices = getByAddress(pricesMap, tokenAddress);
  const token = getByAddress(coinsMap, tokenAddress);

  if (!tokenPrices || !token || poolAmount <= 0n) {
    return 0n;
  }

  return convertToUsd(poolAmount, token.decimals, tokenPrices.minPrice) ?? 0n;
}

function isSidePnlFactorExceeded({
  marketInfo,
  pricesMap,
  coinsMap,
  isLong,
  maxPnlFactor,
}: {
  marketInfo: MarketInfo;
  pricesMap: Record<string, TokenPrices>;
  coinsMap: Record<string, Coin>;
  isLong: boolean;
  maxPnlFactor: bigint;
}) {
  if (maxPnlFactor <= 0n) return false;

  const indexTokenPrices = getByAddress(pricesMap, marketInfo.indexTokenAddress);
  if (!indexTokenPrices) return false;

  const poolPnl = getMarketPnl(marketInfo, indexTokenPrices, isLong, false);
  if (poolPnl <= 0n) return false;

  const poolUsd = getPoolUsd({ marketInfo, pricesMap, coinsMap, isLong });
  if (poolUsd <= 0n) return false;

  return (poolPnl * PRECISION) / poolUsd >= maxPnlFactor;
}

export function usePoolPnlFactorPrecheck({
  marketInfo,
  isDeposit,
  enabled,
}: PoolPnlFactorPrecheckParams) {
  const hzSdk = useHzSdk();
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const coinsMap = useInstStore((state) => state.getCoins());
  const marketTokenAddress = marketInfo?.marketTokenAddress;

  const depositFactorsQuery = useQuery<PoolPnlFactors>({
    queryKey: [
      'pool-pnl-factor-precheck',
      hzSdk?.chainId,
      marketTokenAddress,
      'deposit',
    ],
    enabled: Boolean(enabled && isDeposit && hzSdk && marketTokenAddress),
    queryFn: async () => {
      if (!hzSdk || !marketTokenAddress) {
        throw new Error('Pool PnL factor query executed before prerequisites loaded');
      }

      const marketAddress = getAddress(marketTokenAddress);
      const result = await hzSdk.executeMulticall({
        pnlFactors: {
          contractAddress: getContract(hzSdk.chainId, 'DataStore'),
          abiId: 'DataStore',
          calls: {
            long: {
              methodName: 'getUint',
              params: [
                maxPnlFactorKey(
                  MAX_PNL_FACTOR_FOR_DEPOSITS_KEY,
                  marketAddress,
                  true,
                ),
              ],
            },
            short: {
              methodName: 'getUint',
              params: [
                maxPnlFactorKey(
                  MAX_PNL_FACTOR_FOR_DEPOSITS_KEY,
                  marketAddress,
                  false,
                ),
              ],
            },
          },
        },
      });

      const long = result.data.pnlFactors?.long?.returnValues?.[0] as
        | bigint
        | undefined;
      const short = result.data.pnlFactors?.short?.returnValues?.[0] as
        | bigint
        | undefined;

      if (long === undefined || short === undefined) {
        throw new Error('Failed to load pool deposit PnL factors');
      }

      return { long, short };
    },
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    if (!enabled || !marketInfo) return false;

    const maxPnlFactors = isDeposit
      ? depositFactorsQuery.data
      : {
          long: marketInfo.maxPnlFactorForWithdrawalsLong,
          short: marketInfo.maxPnlFactorForWithdrawalsShort,
        };

    if (!maxPnlFactors) return false;

    return (
      isSidePnlFactorExceeded({
        marketInfo,
        pricesMap,
        coinsMap,
        isLong: true,
        maxPnlFactor: maxPnlFactors.long,
      }) ||
      isSidePnlFactorExceeded({
        marketInfo,
        pricesMap,
        coinsMap,
        isLong: false,
        maxPnlFactor: maxPnlFactors.short,
      })
    );
  }, [
    coinsMap,
    depositFactorsQuery.data,
    enabled,
    isDeposit,
    marketInfo,
    pricesMap,
  ]);
}
