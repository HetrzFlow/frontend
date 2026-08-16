import { useMemo } from 'react';
import { useQuery } from '@repo/lib/queryClient';
import { useCurrentAccountAddress, useHzSdk } from '../hooks';
import type { Address } from 'viem';

export type UseTokenBalanceOptions = {
  account?: Address;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
};

export function useTokenBalance(
  tokenAddress: Address | undefined,
  options: UseTokenBalanceOptions = {},
) {
  const hzSdk = useHzSdk();
  const accountFromWallet = useCurrentAccountAddress();
  const account = options.account ?? accountFromWallet;
  const enabled =
    (options.enabled ?? true) && !!hzSdk && !!tokenAddress && !!account;
  const queryKey = useMemo(
    () => ['tokenBalance', hzSdk?.chainId, account, tokenAddress],
    [hzSdk?.chainId, account, tokenAddress],
  );

  return useQuery<bigint>({
    queryKey,
    enabled,
    queryFn: async () => {
      if (!hzSdk || !tokenAddress || !account) {
        throw new Error('Token balance query executed before prerequisites loaded');
      }
      const balance = await hzSdk.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [{ name: 'account', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'balanceOf',
        args: [account as `0x${string}`],
      });
      return balance ?? 0n;
    },
    staleTime: options.staleTime ?? 5_000,
    refetchInterval: options.refetchInterval,
    refetchOnWindowFocus: false,
  });
}
