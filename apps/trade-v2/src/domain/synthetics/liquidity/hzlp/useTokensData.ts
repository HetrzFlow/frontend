import { useQuery } from '@repo/lib/queryClient';

import { useHzSdk } from '@/common/chainClient/hooks';
import { STATIC_CONFIG_CACHE_TIME } from '@/common/constants/timeConstants';
import type { TokensData } from '@hertzflow/sdk-v2/types/tokens';

export function useTokensData() {
  const hzSdk = useHzSdk();

  const result = useQuery({
    queryKey: ['hz-sdk', 'tokensData', hzSdk?.chainId],
    enabled: !!hzSdk,
    queryFn: async () => {
      if (!hzSdk) return { tokensData: undefined };
      return hzSdk.tokens.getTokensData();
    },
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    tokensData: result.data?.tokensData as TokensData | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
  };
}

export function useTokensConfig() {
  const hzSdk = useHzSdk();

  const result = useQuery({
    queryKey: ['hz-sdk', 'tokensConfig', hzSdk?.chainId],
    enabled: !!hzSdk,
    queryFn: async () => {
      if (!hzSdk) return { tokensData: undefined };
      return hzSdk.tokens.getTokensData();
    },
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    tokensData: result.data?.tokensData as TokensData | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
  };
}
