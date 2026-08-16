'use client';

import { useSyncExternalStore } from 'react';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { usePrices } from '@/common/services/rest/price';
import { useHzvDataProvider } from '@/stores/synthetics/marketsData/provider';
import { useMarketTokensDataProvider } from '@/stores/synthetics/marketTokens/provider';
import type { Address } from 'viem';

let isVisibleSnapshot =
  typeof document === 'undefined'
    ? true
    : document.visibilityState === 'visible';
const visibilitySubscribers = new Set<() => void>();

const getSnapshot = () => {
  if (typeof document === 'undefined') return true;
  return isVisibleSnapshot;
};

const getServerSnapshot = () => isVisibleSnapshot;

const handleVisibilityChange = () => {
  if (typeof document === 'undefined') return;
  const next = document.visibilityState === 'visible';
  if (next === isVisibleSnapshot) return;
  isVisibleSnapshot = next;
  visibilitySubscribers.forEach((cb) => cb());
};

const subscribe = (callback: () => void) => {
  visibilitySubscribers.add(callback);
  if (typeof document !== 'undefined' && visibilitySubscribers.size === 1) {
    isVisibleSnapshot = document.visibilityState === 'visible';
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  return () => {
    visibilitySubscribers.delete(callback);
    if (typeof document !== 'undefined' && visibilitySubscribers.size === 0) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
};

export const usePageVisible = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

type VisibilityProps = {
  isVisible?: boolean;
};

type PricesFeedProps = {
  enabled?: boolean;
} & VisibilityProps;

type HzvDataFeedProps = {
  enabled?: boolean;
  hzvValuesRefetchInterval?: number | false;
  marketAddresses?: Address[];
  vaultAddresses?: Address[];
} & VisibilityProps;

type MarketTokensFeedProps = {
  enabled?: boolean;
  refreshInterval?: number;
  withHlv?: boolean;
  marketAddresses?: Address[];
  vaultAddresses?: Address[];
} & VisibilityProps;

function useResolvedVisibility(isVisible?: boolean) {
  const pageVisible = usePageVisible();
  return typeof isVisible === 'boolean' ? isVisible : pageVisible;
}

export function PricesFeed({ enabled = true, isVisible }: PricesFeedProps) {
  const visible = useResolvedVisibility(isVisible);
  usePrices({ enabled: enabled && visible });
  return null;
}

export function HzvDataFeed({
  enabled = true,
  isVisible,
  hzvValuesRefetchInterval = DYNAMIC_DATA_CACHE_TIME,
  marketAddresses,
  vaultAddresses,
}: HzvDataFeedProps) {
  const visible = useResolvedVisibility(isVisible);
  useHzvDataProvider({
    enabled: enabled && visible,
    hzvValuesRefetchInterval,
    marketAddresses,
    vaultAddresses,
  });
  return null;
}

export function MarketTokensFeed({
  enabled = true,
  isVisible,
  refreshInterval = DYNAMIC_DATA_CACHE_TIME,
  withHlv = true,
  marketAddresses,
  vaultAddresses,
}: MarketTokensFeedProps) {
  const visible = useResolvedVisibility(isVisible);
  useMarketTokensDataProvider({
    enabled: enabled && visible,
    refreshInterval,
    withHlv,
    marketAddresses,
    vaultAddresses,
  });
  return null;
}
