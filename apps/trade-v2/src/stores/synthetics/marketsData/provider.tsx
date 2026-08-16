import {
  DYNAMIC_DATA_CACHE_TIME,
  STATIC_CONFIG_CACHE_TIME,
} from '@/common/constants/timeConstants';
import { usePoolsList } from '@/queries/bsc/pools';
import {
  useHzvConfigs,
  useHzvValues,
  useVaultsList,
} from '@/queries/bsc/vaults';
import { CATEGORY, DEFAULT_POOLS_LIST_PAGE_SIZE } from '@/services/rest/pools';
import type { Address } from 'viem';

export type UseMarketsDataProviderResult = {
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
};

export type UseHzvDataProviderParams = {
  enabled?: boolean;
  hzvValuesRefetchInterval?: number | false;
  marketAddresses?: Address[];
  vaultAddresses?: Address[];
};

export function useHzvDataProvider(
  p: UseHzvDataProviderParams = {},
): UseMarketsDataProviderResult {
  const {
    enabled = true,
    hzvValuesRefetchInterval = DYNAMIC_DATA_CACHE_TIME,
    marketAddresses,
    vaultAddresses,
  } = p;
  const hzvConfigsQuery = useHzvConfigs({ enabled });
  const hzvValuesQuery = useHzvValues({
    enabled,
    refetchInterval: hzvValuesRefetchInterval,
    marketAddresses,
    vaultAddresses,
  });

  const refetch = () => {
    hzvConfigsQuery.refetch();
    hzvValuesQuery.refetch();
  };

  return {
    isLoading:
      enabled && (hzvConfigsQuery.isLoading || hzvValuesQuery.isLoading),
    isFetching:
      enabled && (hzvConfigsQuery.isFetching || hzvValuesQuery.isFetching),
    refetch,
  };
}

export type UsePoolsListDataProviderParams = {
  enabled?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | 'always';
  category?: CATEGORY;
};

export function usePoolsListDataProvider(
  p: UsePoolsListDataProviderParams = {},
) {
  const {
    enabled = true,
    refetchInterval = STATIC_CONFIG_CACHE_TIME,
    refetchOnWindowFocus = false,
    refetchOnMount,
    category = CATEGORY.all,
  } = p;
  return usePoolsList({
    category,
    sortBy: 'tvl_usd',
    sortOrder: 'desc',
    page: 1,
    pageSize: DEFAULT_POOLS_LIST_PAGE_SIZE,
    enabled,
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnMount,
  });
}

export type UseVaultsListDataProviderParams = {
  enabled?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | 'always';
};

export function useVaultsListDataProvider(
  p: UseVaultsListDataProviderParams = {},
) {
  const {
    enabled = true,
    refetchInterval = STATIC_CONFIG_CACHE_TIME,
    refetchOnWindowFocus = false,
    refetchOnMount,
  } = p;
  return useVaultsList({
    enabled,
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnMount,
  });
}
