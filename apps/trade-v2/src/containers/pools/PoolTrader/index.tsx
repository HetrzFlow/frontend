'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { buildPriceId, useInstStore } from '@/common';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { useGasLimits, useGasPrice } from '@/common/services/rest/gas';
import { usePriceTickerStream } from '@/common/services/ws/tickers';
import { useTokensData } from '@/domain/synthetics/liquidity/hzlp/useTokensData';
import { useMarketInfoByAddress } from '@/queries/bsc/pools';
import {
  useHzvConfigByVault,
  useInternalUsdConfigForToken,
} from '@/queries/bsc/vaults';
import { ActivityTabType } from '../PoolsDetail/components/ActivityPanel';
import PoolTradeTabs from './PoolTradeTabs';
import RemainingCapacityCard from './RemainingCapacityCard';
import PoolTraderSkeleton from './Skeleton';

export function usePoolTradePriceSubscription(
  type: ActivityTabType,
  marketAddressOverride?: string,
) {
  const params = useParams();
  const routeMarketAddress = params?.market_address as string | undefined;
  const marketAddress = marketAddressOverride ?? routeMarketAddress;
  const isVault = type === ActivityTabType.VAULT;

  const coins = useInstStore((state) => state.getCoins());

  const { data: marketInfo } = useMarketInfoByAddress(marketAddress ?? '', {
    enabled: !isVault && !!marketAddress,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });

  const { data: hzvConfig } = useHzvConfigByVault(
    isVault ? marketAddress : undefined,
  );
  const internalUsdConfigQuery = useInternalUsdConfigForToken(
    isVault ? hzvConfig?.shortToken : undefined,
  );

  const priceIds = useMemo(() => {
    const ids: string[] = [];

    if (isVault) {
      if (hzvConfig) {
        const longCoin = hzvConfig.longToken
          ? coins[hzvConfig.longToken]
          : null;
        const shortCoin = hzvConfig.shortToken
          ? coins[hzvConfig.shortToken]
          : null;
        if (longCoin?.symbol) {
          ids.push(buildPriceId(longCoin.symbol));
        }
        if (shortCoin?.symbol) {
          ids.push(buildPriceId(shortCoin.symbol));
        }
        const underlyingTokenAddress = internalUsdConfigQuery.isSuccess
          ? (internalUsdConfigQuery.data?.underlyingTokenAddress ??
            hzvConfig.shortToken)
          : undefined;
        const underlyingCoin = Object.values(coins).find(
          (coin) =>
            coin.address?.toLowerCase() ===
            underlyingTokenAddress?.toLowerCase(),
        );
        if (underlyingCoin?.symbol) {
          ids.push(buildPriceId(underlyingCoin.symbol));
        }
        hzvConfig.markets?.forEach((mktAddr) => {
          const coin = Object.values(coins).find(
            (c) => c.address?.toLowerCase() === mktAddr.toLowerCase(),
          );
          if (coin?.symbol) {
            ids.push(buildPriceId(coin.symbol));
          }
        });
      }
    } else {
      if (marketInfo) {
        const { indexTokenAddress, longTokenAddress, shortTokenAddress } =
          marketInfo;

        if (indexTokenAddress && coins[indexTokenAddress]?.symbol) {
          ids.push(buildPriceId(coins[indexTokenAddress].symbol));
        }
        if (longTokenAddress && coins[longTokenAddress]?.symbol) {
          ids.push(buildPriceId(coins[longTokenAddress].symbol));
        }
        if (shortTokenAddress && coins[shortTokenAddress]?.symbol) {
          ids.push(buildPriceId(coins[shortTokenAddress].symbol));
        }
      }
    }

    return [...new Set(ids.filter(Boolean))];
  }, [
    coins,
    hzvConfig,
    internalUsdConfigQuery.data?.underlyingTokenAddress,
    internalUsdConfigQuery.isSuccess,
    isVault,
    marketInfo,
  ]);

  usePriceTickerStream(priceIds, { throttleWait: 1000 });
}

export default function PoolTrader({
  type,
  variant = 'desktop',
  className,
  showHoldings,
  interactionLoading = false,
}: {
  type: ActivityTabType;
  variant?: 'desktop' | 'dialog';
  className?: string;
  showHoldings?: boolean;
  interactionLoading?: boolean;
}) {
  usePoolTradePriceSubscription(type);
  useTokensData();
  useGasLimits();
  useGasPrice();

  const containerClassName =
    variant === 'desktop'
      ? 'hidden min-h-0 w-90 shrink-0 flex-col gap-2 md:flex'
      : 'flex w-full min-h-0 flex-col gap-2';
  const shouldShowHoldings = showHoldings ?? variant === 'desktop';

  if (interactionLoading) {
    return (
      <PoolTraderSkeleton
        variant={variant}
        className={className}
        showHoldings={showHoldings}
      />
    );
  }

  return (
    <div className={[containerClassName, className].filter(Boolean).join(' ')}>
      {shouldShowHoldings ? <RemainingCapacityCard type={type} /> : null}
      <PoolTradeTabs type={type} variant={variant} />
    </div>
  );
}
