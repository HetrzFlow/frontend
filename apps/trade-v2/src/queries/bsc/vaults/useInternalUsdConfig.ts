'use client';

import { useEffect, useMemo } from 'react';
import {
  hydrateInternalUsdConfigs,
  type InternalUsdChainConfig,
} from '@hertzflow/sdk-v2/configs/internalUsd';
import { getAddress, type Address } from 'viem';
import { useQuery } from '@repo/lib/queryClient';
import { useHzSdk } from '@/common/chainClient/hooks';
import {
  syncInternalUsdPriceAliases,
  usePriceStore,
} from '@/common/stores/priceStore';

type InternalUsdConfigMap = Record<string, InternalUsdChainConfig | undefined>;

function normalizeAddresses(addresses: readonly string[]) {
  return Array.from(
    new Set(addresses.filter(Boolean).map((address) => address.toLowerCase())),
  ).sort();
}

export function useInternalUsdConfigsForTokens(
  wrappedTokenAddresses: readonly string[],
) {
  const hzSdk = useHzSdk();
  const normalizedAddresses = useMemo(
    () => normalizeAddresses(wrappedTokenAddresses),
    [wrappedTokenAddresses],
  );
  const query = useQuery<InternalUsdConfigMap>({
    queryKey: [
      'hz-sdk',
      'internal-usd-configs',
      hzSdk?.chainId,
      normalizedAddresses,
    ],
    enabled:
      !!hzSdk?.chainId &&
      !!hzSdk?.publicClient &&
      normalizedAddresses.length > 0,
    queryFn: async () => {
      if (!hzSdk?.publicClient || !hzSdk.chainId) {
        throw new Error(
          'Internal USD configs query executed before prerequisites loaded',
        );
      }

      const addresses = normalizedAddresses.map(
        (address) => getAddress(address) as Address,
      );
      const configs = await hydrateInternalUsdConfigs({
        chainId: hzSdk.chainId,
        wrappedTokenAddresses: addresses,
        publicClient: hzSdk.publicClient,
      });
      const configsByWrapper = new Map(
        configs.map((config) => [
          config.wrappedTokenAddress.toLowerCase(),
          config,
        ]),
      );

      return Object.fromEntries(
        normalizedAddresses.map((address) => [
          address,
          configsByWrapper.get(address),
        ]),
      );
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  const pricesMap = usePriceStore((state) => state.pricesMap);
  const resolvedConfigs = useMemo(
    () =>
      Object.values(query.data ?? {}).filter(
        (config): config is InternalUsdChainConfig => config !== undefined,
      ),
    [query.data],
  );
  useEffect(() => {
    if (resolvedConfigs.length > 0) {
      syncInternalUsdPriceAliases(resolvedConfigs);
    }
  }, [pricesMap, resolvedConfigs]);

  return query;
}

export function useInternalUsdConfigForToken(wrappedTokenAddress?: string) {
  const query = useInternalUsdConfigsForTokens(
    wrappedTokenAddress ? [wrappedTokenAddress] : [],
  );
  const addressKey = wrappedTokenAddress?.toLowerCase();

  return {
    ...query,
    data: addressKey ? query.data?.[addressKey] : undefined,
  };
}
