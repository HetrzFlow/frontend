import { useQuery } from '@repo/lib/queryClient';

import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient/hooks';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';

export const useHlvTokenBalance = (
  hlvTokenAddress: string | undefined,
  options?: { enabled?: boolean },
) => {
  const hzSdk = useHzSdk();
  const walletAddress = useCurrentAccountAddress() || undefined;

  const queryKey = [
    'hz-sdk',
    'hlv-token-balance',
    hzSdk?.chainId,
    walletAddress,
    hlvTokenAddress,
  ];

  const queryResult = useQuery<{ balance: bigint; formatted: string } | null>({
    queryKey,
    enabled:
      (options?.enabled ?? true) &&
      !!hzSdk &&
      !!hlvTokenAddress &&
      !!walletAddress,
    queryFn: async () => {
      if (!hzSdk || !hlvTokenAddress || !walletAddress) {
        return null;
      }

      const normalizedAddress = hlvTokenAddress.toLowerCase();
      const balances = await hzSdk?.tokens.getTokensBalances(walletAddress, [
        { address: normalizedAddress },
      ]);

      const balance = balances[normalizedAddress] ?? 0n;

      const formatted = (Number(balance) / 1e18).toFixed(6);

      return { balance, formatted };
    },
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    ...queryResult,
  };
};
