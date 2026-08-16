import { useMemo } from 'react';
import HlvReaderAbi from '@hertzflow/sdk-v2/abis/HlvReader';
import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import { getAddress } from 'viem';
import { useQuery } from '@repo/lib/queryClient';

import { usePrivy } from '@/common/chainClient';
import { useHzSdk } from '@/common/chainClient/hooks';
import { STATIC_CONFIG_CACHE_TIME } from '@/common/constants/timeConstants';
import { useHlvListQuery } from '@/stores/synthetics/marketTokens/queries/useHzvMarketsQuery';

import { useVaultDetail } from './list';
import type { HzvConfig } from './types';

type HzvConfigsBaseQuery = ReturnType<typeof useHlvListQuery>;

type HzvConfigsQueryResult = Pick<
  HzvConfigsBaseQuery,
  'isFetching' | 'isPending' | 'isError' | 'isSuccess' | 'error' | 'refetch'
> & {
  data: Record<string, HzvConfig> | undefined;
  isLoading: boolean;
};

export const useHzvConfigs = (options?: {
  enabled?: boolean;
}): HzvConfigsQueryResult => {
  const { ready } = usePrivy();
  const enabled = options?.enabled ?? true;
  const isEnabled = enabled && ready;

  const query = useHlvListQuery({ enabled: isEnabled });

  const data = useMemo(() => {
    if (!query.data?.hlvList) return undefined;
    const result: Record<string, HzvConfig> = {};
    for (const hlvInfo of query.data.hlvList) {
      const hlvToken = getAddress(hlvInfo.hlv.hlvToken);
      result[hlvToken] = {
        hlvToken,
        longToken: getAddress(hlvInfo.hlv.longToken),
        shortToken: getAddress(hlvInfo.hlv.shortToken),
        markets: hlvInfo.markets.map((m: string) => getAddress(m)),
      };
    }
    return result;
  }, [query.data?.hlvList]);

  return {
    data,
    isLoading: !isEnabled || query.isLoading,
    isFetching: query.isFetching,
    isPending: query.isPending,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useHzvConfigByVault = (vaultAddress: string | undefined) => {
  const hzSdk = useHzSdk();
  const { ready } = usePrivy();
  const checksumVault = vaultAddress ? getAddress(vaultAddress) : undefined;
  const chainId = hzSdk?.chainId;
  const isHzvConfigQueryEnabled =
    ready && !!hzSdk && !!checksumVault && !!chainId;

  const { data: vaultDetailRes } = useVaultDetail(vaultAddress ?? '', {
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval: false,
  });
  const restDerivedConfig = useMemo((): HzvConfig | undefined => {
    const detail = vaultDetailRes?.data;
    if (!detail?.long_token_address || !detail?.short_token_address)
      return undefined;
    if (!detail.market_exposure?.length) return undefined;
    if (checksumVault && getAddress(detail.vault_address) !== checksumVault)
      return undefined;
    const maxCapByMarket: Record<string, bigint> = {};
    for (const m of detail.market_exposure) {
      if (m.max_cap) {
        try {
          maxCapByMarket[getAddress(m.market_address)] = BigInt(m.max_cap);
        } catch {
          /* skip invalid */
        }
      }
    }
    return {
      hlvToken: getAddress(detail.vault_token_address || detail.vault_address),
      longToken: getAddress(detail.long_token_address),
      shortToken: getAddress(detail.short_token_address),
      markets: detail.market_exposure.map((m) => getAddress(m.market_address)),
      maxCapByMarket,
    };
  }, [checksumVault, vaultDetailRes?.data]);

  const query = useQuery<HzvConfig>({
    queryKey: ['hz-sdk', 'hzv-config', hzSdk?.chainId, checksumVault],
    enabled: isHzvConfigQueryEnabled,
    queryFn: async () => {
      if (!hzSdk || !checksumVault || !chainId) {
        throw new Error('HZV config query executed before prerequisites loaded');
      }

      const dataStoreAddress = getContract(chainId, 'DataStore');
      const hlvReaderAddress = getContract(chainId, 'HlvReader');
      const hlvInfo = await hzSdk?.publicClient.readContract({
        address: hlvReaderAddress as `0x${string}`,
        abi: HlvReaderAbi,
        functionName: 'getHlvInfo',
        args: [dataStoreAddress as `0x${string}`, checksumVault],
      });
      const hlvToken = getAddress(hlvInfo.hlv.hlvToken);
      return {
        hlvToken,
        longToken: getAddress(hlvInfo.hlv.longToken),
        shortToken: getAddress(hlvInfo.hlv.shortToken),
        markets: hlvInfo.markets.map((m: string) => getAddress(m)),
        maxCapByMarket: restDerivedConfig?.maxCapByMarket,
      };
    },
    placeholderData: restDerivedConfig,
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data ?? restDerivedConfig,
    isLoading:
      !query.data &&
      !restDerivedConfig &&
      (!isHzvConfigQueryEnabled || query.isLoading),
    isFetching: query.isFetching,
    isPending: query.isPending,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
};
