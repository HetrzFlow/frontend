'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getAddress, type Address } from 'viem';
import { MarketTokensFeed, PricesFeed } from '@/components/DataFeeds';
import PoolsListFeed from './PoolsListFeed';

export default function PoolsDataFeeds() {
  const params = useParams<{ market_address?: string }>();
  const marketAddress = params?.market_address;
  const detailMarketAddresses = useMemo<Address[] | undefined>(() => {
    if (!marketAddress) return undefined;
    try {
      return [getAddress(marketAddress)];
    } catch {
      return undefined;
    }
  }, [marketAddress]);
  const isDetailPage = !!marketAddress;
  const isMarketTokensFeedEnabled = detailMarketAddresses !== undefined;

  return (
    <>
      <PricesFeed />
      {isDetailPage ? (
        <MarketTokensFeed
          enabled={isMarketTokensFeedEnabled}
          withHlv={false}
          marketAddresses={detailMarketAddresses}
        />
      ) : null}
      {!isDetailPage ? <PoolsListFeed /> : null}
    </>
  );
}
