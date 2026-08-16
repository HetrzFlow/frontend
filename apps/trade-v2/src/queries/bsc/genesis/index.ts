import { createWalletClient, custom, type Address } from 'viem';
import { useMutation, useQuery, useQueryClient } from '@repo/lib/queryClient';
import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import { useActiveWallet } from '@/common/chainClient/privyCompat';
import {
  DYNAMIC_DATA_CACHE_TIME,
  STATIC_CONFIG_CACHE_TIME,
} from '@/common/constants/timeConstants';
import {
  fetchGenesisVaultConfig,
  fetchGenesisOverview,
  fetchGenesisUserPosition,
  fetchGenesisSocialState,
  claimGenesisRewards,
  type GenesisAsset,
  createGenesisSocialChallenge,
  initiateGenesisSocialBinding,
  unbindGenesisSocial,
  type GenesisSocialAction,
  type GenesisSocialBinding,
  fetchGenesisMeritsSeasons,
  fetchGenesisMeritsEpoch,
  fetchGenesisLpEstimate,
  fetchGenesisMeritsUserSummary,
} from '@/services/rest/genesis';

const LP_ESTIMATE_REFRESH_INTERVAL = 5_000;
const MERITS_USER_SUMMARY_REFRESH_INTERVAL = 10_000;

export const useGenesisOverview = () => {
  return useQuery({
    queryKey: ['genesisOverview'],
    queryFn: fetchGenesisOverview,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    staleTime: STATIC_CONFIG_CACHE_TIME,
  });
};

export const useGenesisVaultConfig = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['genesisVaultConfig'],
    queryFn: fetchGenesisVaultConfig,
    enabled: options?.enabled ?? true,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    staleTime: STATIC_CONFIG_CACHE_TIME,
  });
};

export const useGenesisMeritsSeasons = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['genesisMeritsSeasons'],
    queryFn: fetchGenesisMeritsSeasons,
    enabled: options?.enabled ?? true,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    staleTime: STATIC_CONFIG_CACHE_TIME,
  });

export const useGenesisMeritsEpoch = (seasonId?: number) =>
  useQuery({
    queryKey: ['genesisMeritsEpoch', seasonId],
    queryFn: () => fetchGenesisMeritsEpoch(seasonId!),
    enabled: seasonId !== undefined,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    staleTime: STATIC_CONFIG_CACHE_TIME,
  });

export const useGenesisLpEstimate = (options?: { enabled?: boolean }) => {
  const address = useCurrentAccountAddress();
  return useQuery({
    queryKey: ['genesisLpEstimate', address],
    queryFn: () => fetchGenesisLpEstimate(address),
    enabled: !!address && (options?.enabled ?? true),
    refetchInterval: LP_ESTIMATE_REFRESH_INTERVAL,
    staleTime: LP_ESTIMATE_REFRESH_INTERVAL,
  });
};

export const useGenesisMeritsUserSummary = (
  seasonId?: number | 'all',
  options?: { enabled?: boolean },
) => {
  const address = useCurrentAccountAddress();
  return useQuery({
    queryKey: ['genesisMeritsUserSummary', address, seasonId],
    queryFn: () =>
      fetchGenesisMeritsUserSummary(
        address,
        seasonId === 'all' ? undefined : seasonId,
      ),
    enabled: !!address && seasonId !== undefined && (options?.enabled ?? true),
    refetchInterval: MERITS_USER_SUMMARY_REFRESH_INTERVAL,
    staleTime: MERITS_USER_SUMMARY_REFRESH_INTERVAL,
  });
};

export const useGenesisUserPosition = (options?: { enabled?: boolean }) => {
  const address = useCurrentAccountAddress();
  return useQuery({
    queryKey: ['genesisUserPosition', address],
    queryFn: () => fetchGenesisUserPosition(address),
    enabled: !!address && (options?.enabled ?? true),
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
    staleTime: DYNAMIC_DATA_CACHE_TIME,
  });
};

export const useGenesisSocialState = () => {
  const address = useCurrentAccountAddress();
  return useQuery({
    queryKey: ['genesisSocialState', address],
    queryFn: () => fetchGenesisSocialState(address),
    enabled: !!address,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    staleTime: STATIC_CONFIG_CACHE_TIME,
  });
};

export const useClaimGenesisRewards = () => {
  const address = useCurrentAccountAddress();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['genesis', 'claimRewards'],
    mutationFn: (symbol: GenesisAsset['symbol']) =>
      claimGenesisRewards({ address, symbol }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['genesisUserPosition'],
      });
    },
  });
};

const useSignGenesisSocialAction = () => {
  const address = useCurrentAccountAddress();
  const { wallet } = useActiveWallet();

  return async (
    action: GenesisSocialAction,
    platform: GenesisSocialBinding['platform'],
  ) => {
    if (!address || !wallet) {
      throw new Error('Wallet is not connected');
    }

    const provider = await wallet.getEthereumProvider();
    const walletClient = createWalletClient({
      transport: custom(provider),
    });
    const challenge = await createGenesisSocialChallenge({
      action,
      address,
      platform,
    });
    const signature = await walletClient.signMessage({
      account: address as Address,
      message: challenge.message,
    });

    return { address, challenge, signature };
  };
};

export const useUnbindGenesisSocial = () => {
  const queryClient = useQueryClient();
  const signAction = useSignGenesisSocialAction();

  return useMutation({
    mutationKey: ['genesis', 'unbindSocial'],
    mutationFn: async (platform: GenesisSocialBinding['platform']) => {
      const { address, challenge, signature } = await signAction(
        'unbind',
        platform,
      );
      return unbindGenesisSocial({
        address,
        platform,
        nonce: challenge.nonce,
        signature,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['genesisSocialState'],
      });
    },
  });
};

export const useInitiateGenesisSocialBinding = () => {
  const signAction = useSignGenesisSocialAction();

  return useMutation({
    mutationKey: ['genesis', 'initiateSocialBinding'],
    mutationFn: async (platform: GenesisSocialBinding['platform']) => {
      const { address, challenge, signature } = await signAction(
        'bind',
        platform,
      );
      return initiateGenesisSocialBinding({
        address,
        platform,
        nonce: challenge.nonce,
        signature,
        consent: true,
        consentTs: Date.now(),
      });
    },
  });
};
