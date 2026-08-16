'use client';
import { useCallback, useMemo, useState } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Address, maxUint256, withTimeout, zeroAddress } from 'viem';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { useQuery } from '@repo/lib/queryClient';
import { useCurrentAccountAddress, useHzSdk } from '../chainClient';
import { useInstStore } from '../stores';
import { useCustomSignAndExecuteTransaction } from './useExecTransaction';

// Hook to get current allowance
export const useTokenAllowanceForSyntheticsRouter = (
  tokenAddress?: Address,
  spenderAddress?: Address,
) => {
  const hzSdk = useHzSdk();
  const accountAddress = useCurrentAccountAddress();

  return useQuery({
    queryKey: [
      'tokenAllowance',
      hzSdk?.chainId,
      accountAddress,
      tokenAddress,
      spenderAddress,
    ],
    enabled:
      !!hzSdk &&
      !!tokenAddress &&
      tokenAddress !== zeroAddress &&
      !!accountAddress,
    initialData: 0n,
    queryFn: async () => {
      if (!tokenAddress || !accountAddress) return maxUint256;

      const allowance = spenderAddress
        ? await hzSdk!.allowance.getTokenAllowance(
            tokenAddress!,
            spenderAddress,
          )
        : await hzSdk!.allowance.getTokenAllowanceForSyntheticsRouter(
            tokenAddress!,
          );

      return allowance ?? 0n;
    },
  });
};

export function useApproveTokenForSyntheticsRouter({
  tokenAddress,
  spenderAddress,
  tokenDecimals,
  hideToast = false,
  showTokenIcon = true,
}: {
  tokenAddress?: Address;
  spenderAddress?: Address;
  tokenDecimals?: number;
  hideToast?: boolean;
  showTokenIcon?: boolean;
}) {
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const [isApproving, setIsApproving] = useState(false);

  const {
    data,
    isLoading: isAllowanceLoading,
    refetch,
  } = useTokenAllowanceForSyntheticsRouter(tokenAddress, spenderAddress);

  const approveToken = useCallback(
    async (amount?: bigint) => {
      if (!hzSdk) return;
      if (!tokenAddress) {
        throw new Error('Token address is required');
      }

      const coin = coins[tokenAddress];
      const title = i18n._(msg`Approval`);
      setIsApproving(true);
      const result = await executeTransaction({
        toast: hideToast
          ? undefined
          : {
              title,
              description: i18n._(msg`Approving token spending`),
              successDescription: i18n._(msg`Completed`),
              icon: showTokenIcon ? (
                <CoinIcon size={24} src={coin?.icon} alt={coin?.name} />
              ) : undefined,
              id: 'toast-approveToken',
            },
        executeTransaction: async () => {
          return withTimeout(
            () =>
              spenderAddress
                ? hzSdk.allowance.approveToken(
                    tokenAddress,
                    spenderAddress,
                    amount,
                  )
                : hzSdk.allowance.approveTokenForSyntheticsRouter(
                    tokenAddress,
                    amount,
                  ),
            {
              timeout: 30000,
              errorInstance: new Error('timeout'),
            },
          );
        },
        onSuccess: async () => {
          await refetch();
        },
      });

      setIsApproving(false);
      if (!result.success) {
        throw result.error;
      }

      return result.txHash;
    },
    [
      tokenAddress,
      spenderAddress,
      coins,
      hzSdk,
      executeTransaction,
      refetch,
      hideToast,
      showTokenIcon,
    ],
  );

  const allowanceAmount = useMemo(() => {
    const decimals =
      tokenDecimals ?? (tokenAddress ? coins[tokenAddress]?.decimal : undefined);
    return data && tokenAddress && decimals != null
      ? calc(data.toString())
          .div(calc(10).pow(decimals))
          .toFixed()
      : '0';
  }, [data, coins, tokenAddress, tokenDecimals]);

  return {
    allowance: data,
    allowanceAmount,
    isAllowanceLoading: isAllowanceLoading,
    approveToken,
    isApproving,
    refetchAllowance: refetch,
  };
}
