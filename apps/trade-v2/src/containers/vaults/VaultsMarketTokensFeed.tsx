'use client';

import { useParams } from 'next/navigation';
import { STATIC_CONFIG_CACHE_TIME } from '@/common/constants/timeConstants';
import {
  HzvDataFeed,
  MarketTokensFeed,
  PricesFeed,
  usePageVisible,
} from '@/components/DataFeeds';
import { useVaultsListDataProvider } from '@/stores/synthetics/marketsData/provider';
import {
  useVaultsMarketTokenAddresses,
  useViewedVaultAddresses,
} from '@/stores/synthetics/marketsData/selectors';

export default function VaultsMarketTokensFeed() {
  const params = useParams<{ market_address?: string }>();
  const isDetailPage = !!params?.market_address;
  const isVisible = usePageVisible();
  useVaultsListDataProvider({
    enabled: isVisible,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
  });
  const marketAddresses = useVaultsMarketTokenAddresses();
  const vaultAddresses = useViewedVaultAddresses();
  return (
    <>
      <PricesFeed isVisible={isVisible} />
      {!isDetailPage ? (
        <HzvDataFeed
          isVisible={isVisible}
          hzvValuesRefetchInterval={false}
          marketAddresses={marketAddresses}
          vaultAddresses={vaultAddresses}
        />
      ) : null}
      {!isDetailPage ? (
        <MarketTokensFeed
          isVisible={isVisible}
          marketAddresses={marketAddresses}
          vaultAddresses={vaultAddresses}
        />
      ) : null}
    </>
  );
}
