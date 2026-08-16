import { getAddress } from 'viem';
import { useQuery } from '@repo/lib/queryClient';

import { STATIC_CONFIG_CACHE_TIME } from '@/common/constants/timeConstants';
import { toLowerAddressParam } from '@/lib/address';
import { APY_PERIOD } from '@/services/rest/pools';
import {
  fetchVaultNetAprChartData,
  fetchVaultTvlChartData,
} from '@/services/rest/vaults';

function normalizeVaultAddress(vaultAddress: string) {
  if (!vaultAddress) return '';
  try {
    return getAddress(vaultAddress);
  } catch {
    return vaultAddress;
  }
}

export const useVaultFeesChart = ({
  vaultAddress,
  period,
  enabled = true,
  refetchInterval = STATIC_CONFIG_CACHE_TIME,
  initialData,
}: {
  vaultAddress: string;
  period: APY_PERIOD;
  enabled?: boolean;
  refetchInterval?: number | false;
  initialData?: Awaited<ReturnType<typeof fetchVaultNetAprChartData>>['data'];
}) => {
  const normalizedVaultAddress = normalizeVaultAddress(vaultAddress);
  const vaultAddressParam = toLowerAddressParam(normalizedVaultAddress) ?? '';

  return useQuery({
    queryKey: [
      'bsc-data-query',
      'vault-net-apr-chart',
      vaultAddressParam,
      period,
    ],
    enabled: !!vaultAddressParam && enabled,
    initialData,
    queryFn: async () => {
      const { data } = await fetchVaultNetAprChartData({
        vault_address: vaultAddressParam,
        period,
      });
      return data;
    },
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};

export const useVaultTvlChart = ({
  vaultAddress,
  period,
  enabled = true,
  refetchInterval = STATIC_CONFIG_CACHE_TIME,
  initialData,
}: {
  vaultAddress: string;
  period: APY_PERIOD;
  enabled?: boolean;
  refetchInterval?: number | false;
  initialData?: Awaited<ReturnType<typeof fetchVaultTvlChartData>>['data'];
}) => {
  const normalizedVaultAddress = normalizeVaultAddress(vaultAddress);
  const vaultAddressParam = toLowerAddressParam(normalizedVaultAddress) ?? '';

  return useQuery({
    queryKey: [
      'bsc-data-query',
      'vault-tvl-chart',
      vaultAddressParam,
      period,
    ],
    enabled: !!vaultAddressParam && enabled,
    initialData,
    queryFn: async () => {
      const { data } = await fetchVaultTvlChartData({
        vault_address: vaultAddressParam,
        period,
      });
      return data;
    },
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};
