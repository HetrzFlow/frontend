'use client';

import { STATIC_CONFIG_CACHE_TIME } from '@/common/constants/timeConstants';
import { usePageVisible } from '@/components/DataFeeds';
import { usePoolsListDataProvider } from '@/stores/synthetics/marketsData/provider';

export default function PoolsListFeed() {
  const isVisible = usePageVisible();

  usePoolsListDataProvider({
    enabled: isVisible,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
  });

  return null;
}
