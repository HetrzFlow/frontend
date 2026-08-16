import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@repo/lib/queryClient';
import { toast } from '@repo/ui';

import { usePrivy } from '@/common/chainClient';
import {
  useConnectionStatus,
  useCurrentAccountAddress,
} from '@/common/chainClient/hooks';
import {
  DYNAMIC_DATA_CACHE_TIME,
  STATIC_CONFIG_CACHE_TIME,
} from '@/common/constants/timeConstants';
import { toLowerAddressParam } from '@/lib/address';
import {
  getHistoryNextPageParam,
  type HistoryAction,
} from '@/services/rest/pools';
import {
  fetchVaultDetail,
  fetchVaultHistoryData,
  fetchVaultsList,
} from '@/services/rest/vaults';

import type { VaultDetailQueryData } from './types';

export const useVaultsList = ({
  enabled = true,
  refetchInterval = STATIC_CONFIG_CACHE_TIME,
  refetchOnWindowFocus = false,
  refetchOnMount,
  initialData,
}: {
  enabled?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | 'always';
  initialData?: Awaited<ReturnType<typeof fetchVaultsList>>['data'];
} = {}) => {
  const connectionStatus = useConnectionStatus();
  const wallet_address = useCurrentAccountAddress() || undefined;
  const walletAddressParam =
    connectionStatus === 'connected'
      ? toLowerAddressParam(wallet_address)
      : undefined;
  return useQuery({
    queryKey: ['bsc-data-query', 'vaults', walletAddressParam],
    enabled,
    initialData: walletAddressParam ? undefined : initialData,
    queryFn: async () => {
      const data = await fetchVaultsList({
        wallet_address: walletAddressParam,
      });
      return data.data;
    },
    placeholderData: (prev) => prev,
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnMount,
  });
};

export const useVaultDetail = (
  vaultAddress: string,
  options?: {
    staleTime?: number;
    refetchInterval?: number | false;
    initialData?: VaultDetailQueryData;
    includeWalletAddress?: boolean;
    showErrorToast?: boolean;
  },
) => {
  const { t } = useLingui();
  const { ready } = usePrivy();
  const wallet_address = useCurrentAccountAddress() || undefined;
  const includeWalletAddress = options?.includeWalletAddress ?? true;
  const walletAddressParam =
    includeWalletAddress && ready
      ? toLowerAddressParam(wallet_address)
      : undefined;
  const queryClient = useQueryClient();
  const vaultAddressParam = useMemo(
    () => toLowerAddressParam(vaultAddress) ?? '',
    [vaultAddress],
  );
  const staleTime = options?.staleTime ?? STATIC_CONFIG_CACHE_TIME;
  const refetchInterval = options?.refetchInterval ?? STATIC_CONFIG_CACHE_TIME;
  const query = useQuery<VaultDetailQueryData>({
    queryKey: [
      'bsc-data-query',
      'vault-detail',
      vaultAddressParam,
      walletAddressParam,
    ],
    enabled: !!vaultAddressParam,
    initialData: walletAddressParam ? undefined : options?.initialData,
    queryFn: async () => {
      try {
        const data = await fetchVaultDetail({
          vault_address: vaultAddressParam,
          wallet_address: walletAddressParam,
        });
        return data;
      } catch (error) {
        if (options?.showErrorToast) {
          toast.error(t`Failed to load vault details. Please try again.`, {
            id: `vault-detail-error-${vaultAddressParam}`,
          });
        }
        throw error;
      }
    },
    placeholderData: (prev) => {
      if (prev) return prev;
      if (!vaultAddressParam) return undefined;
      const target = vaultAddressParam.toLowerCase();
      const listData = queryClient.getQueryData<
        Awaited<ReturnType<typeof fetchVaultsList>>['data']
      >(['bsc-data-query', 'vaults', walletAddressParam]);
      const vault = listData?.items?.find(
        (item) => item.vault_address?.toLowerCase() === target,
      );
      if (vault) {
        return { data: vault };
      }
      return undefined;
    },
    staleTime,
    refetchInterval,
    refetchOnWindowFocus: false,
  });

  return query;
};

export const useVaultHistory = ({
  marketAddress,
  limit,
  walletAddress,
  action,
  enabled = true,
  refetchInterval = DYNAMIC_DATA_CACHE_TIME,
}: {
  marketAddress: string;
  limit?: number;
  walletAddress?: string;
  action?: HistoryAction;
  enabled?: boolean;
  refetchInterval?: number | false;
}) => {
  const walletAddressParam = toLowerAddressParam(walletAddress);
  const marketAddressParam = toLowerAddressParam(marketAddress) ?? '';
  return useInfiniteQuery({
    queryKey: [
      'bsc-data-query',
      'vault-history',
      marketAddressParam,
      limit,
      walletAddressParam,
      action,
    ],
    enabled: !!marketAddress && enabled,
    queryFn: async ({ pageParam }) => {
      const data = await fetchVaultHistoryData({
        market_address: marketAddress,
        cursor: pageParam,
        limit,
        wallet_address: walletAddressParam,
        action,
      });
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getHistoryNextPageParam,
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};
