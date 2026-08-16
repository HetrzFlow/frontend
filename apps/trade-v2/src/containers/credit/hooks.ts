'use client';

import { useMemo } from 'react';
import { CREDIT_TOKEN_DECIMALS } from '@hertzflow/sdk-v2';
import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import { useLingui } from '@lingui/react/macro';
import { erc20Abi, parseUnits, type Address } from 'viem';
import { useMutation, useQuery, useQueryClient } from '@repo/lib/queryClient';
import { useInstStore } from '@/common';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient/hooks';
import { useTokenBalance } from '@/common/chainClient/hooks/useTokenBalance';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { isTradableCreditMarketInst } from '@/lib/credit/creditTrade';
import { fetchCreditAirdrop, fetchCreditBalance } from '@/services/rest/credit';
import { CREDIT_PAYOUT_SYMBOL_BY_WRAPPER_SYMBOL } from './constants';

const CREDIT_CLAIM_REFETCH_INTERVAL = 2_000;
const CREDIT_CLAIM_REFETCH_COUNT = 4;
let creditBalanceClaimRefetchTimer: ReturnType<typeof setTimeout> | undefined;
let creditAirdropClaimRefetchTimer: ReturnType<typeof setTimeout> | undefined;

export const useCreditAirdrop = (seasonId: string) => {
  const account = useCurrentAccountAddress();

  return useQuery({
    queryKey: ['credit', 'airdrop', account, seasonId],
    queryFn: () => fetchCreditAirdrop({ userAddress: account!, seasonId }),
    enabled: !!account && !!seasonId,
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
};

export const useCreditBackendBalance = () => {
  const account = useCurrentAccountAddress();

  return useQuery({
    queryKey: ['credit', 'balance', account],
    enabled: !!account,
    queryFn: () => fetchCreditBalance(account!),
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
};

export const useCreditMarketConfig = () => {
  const insts = useInstStore((state) => state.getInstsArr());
  const isLoading = useInstStore(
    (state) => !state.insts.initialized || state.insts.requestPending,
  );
  const data = useMemo(
    () => insts.filter(isTradableCreditMarketInst),
    [insts],
  );

  return {
    data,
    isLoading,
  };
};

const invalidateCreditQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await queryClient.invalidateQueries({ queryKey: ['credit'] });
  await queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
};

const refetchCreditQueryAfterClaimReceipt = (
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: unknown[],
  timer: ReturnType<typeof setTimeout> | undefined,
  setTimer: (timer: ReturnType<typeof setTimeout> | undefined) => void,
) => {
  if (timer) clearTimeout(timer);

  let remainingRefetches = CREDIT_CLAIM_REFETCH_COUNT;
  const refetch = () => {
    void queryClient
      .refetchQueries({ queryKey, type: 'active' })
      .finally(() => {
        remainingRefetches -= 1;
        setTimer(
          remainingRefetches > 0
            ? setTimeout(refetch, CREDIT_CLAIM_REFETCH_INTERVAL)
            : undefined,
        );
      });
  };

  setTimer(setTimeout(refetch, CREDIT_CLAIM_REFETCH_INTERVAL));
};

const refetchCreditBalanceAfterClaimReceipt = (
  queryClient: ReturnType<typeof useQueryClient>,
  account: string,
) =>
  refetchCreditQueryAfterClaimReceipt(
    queryClient,
    ['credit', 'balance', account],
    creditBalanceClaimRefetchTimer,
    (timer) => {
      creditBalanceClaimRefetchTimer = timer;
    },
  );

const refetchCreditAirdropAfterClaimReceipt = (
  queryClient: ReturnType<typeof useQueryClient>,
  account: string,
) =>
  refetchCreditQueryAfterClaimReceipt(
    queryClient,
    ['credit', 'airdrop', account],
    creditAirdropClaimRefetchTimer,
    (timer) => {
      creditAirdropClaimRefetchTimer = timer;
    },
  );

export const useClaimCreditAirdrop = () => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const queryClient = useQueryClient();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();

  return useMutation({
    mutationKey: ['credit', 'claim-credit-airdrop', account],
    mutationFn: async () => {
      if (!hzSdk || !account) {
        throw new Error(t`Wallet is not connected`);
      }

      const result = await executeTransaction({
        toast: {
          title: t`Credit Airdrop`,
          description: t`Claiming Credit`,
          successDescription: t`Credit claimed`,
          errorDescription: t`Claim failed`,
          id: 'toast-credit-airdrop-claim',
        },
        executeTransaction: () =>
          hzSdk.credit.claimAirdrop(),
        onSuccess: async () => {
          refetchCreditAirdropAfterClaimReceipt(queryClient, account);
          refetchCreditBalanceAfterClaimReceipt(queryClient, account);
          await invalidateCreditQueries(queryClient);
        },
      });

      if (!result.success) {
        throw result.error;
      }
    },
  });
};

export const useClaimCreditTokenAirdrop = () => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const queryClient = useQueryClient();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();

  return useMutation({
    mutationKey: ['credit', 'claim-token-airdrop', account],
    mutationFn: async () => {
      if (!hzSdk || !account) {
        throw new Error(t`Wallet is not connected`);
      }

      const result = await executeTransaction({
        toast: {
          title: t`Token Airdrop`,
          description: t`Claiming Token`,
          successDescription: t`Token claimed`,
          errorDescription: t`Claim failed`,
          id: 'toast-credit-token-airdrop-claim',
        },
        executeTransaction: () =>
          hzSdk.credit.claimTokenAirdrop(),
        onSuccess: async () => {
          refetchCreditAirdropAfterClaimReceipt(queryClient, account);
          await invalidateCreditQueries(queryClient);
        },
      });

      if (!result.success) {
        throw result.error;
      }
    },
  });
};

export const useClaimCreditFeeRebate = () => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const queryClient = useQueryClient();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();

  return useMutation({
    mutationKey: ['credit', 'claim-fee-rebate', account],
    mutationFn: async ({
      amount,
      creditBalance,
      allowance,
    }: {
      amount: string;
      creditBalance: bigint;
      allowance: bigint;
    }) => {
      if (!hzSdk || !account) {
        throw new Error(t`Wallet is not connected`);
      }

      const amountUnits = parseUnits(amount, CREDIT_TOKEN_DECIMALS);
      if (amountUnits <= 0n) {
        throw new Error(t`Claim amount must be greater than 0`);
      }

      if (creditBalance < amountUnits) {
        throw new Error(t`Insufficient Credit balance`);
      }

      const limits = await hzSdk.credit.getFeeClaimLimits(account as Address);
      if (amountUnits > limits.totalClaimableCredit) {
        throw new Error(t`Claim amount exceeds your claimable USDT`);
      }
      if (amountUnits > limits.maxClaimableCredit) {
        throw new Error(t`Claim amount exceeds the current vault reserves`);
      }

      await hzSdk.credit.getFeeClaimPreview(amountUnits, account as Address);

      if (allowance < amountUnits) {
        const approveResult = await executeTransaction({
          toast: {
            title: t`Credit Fee Rebate`,
            description: t`Approving Credit`,
            successDescription: t`Credit approved`,
            errorDescription: t`Approval failed`,
            id: 'toast-credit-fee-rebate-approve',
          },
          executeTransaction: () => hzSdk.credit.approveFeeClaim(amountUnits),
          refetchBalancesAfterSuccess: false,
        });

        if (!approveResult.success) {
          throw approveResult.error;
        }

        await hzSdk.credit.getFeeClaimPreview(amountUnits, account as Address);
      }

      const claimResult = await executeTransaction({
        toast: {
          title: t`Credit Fee Rebate`,
          description: t`Claiming Fee Rebate`,
          successDescription: t`Fee rebate claimed successfully`,
          errorDescription: t`Claim failed, please try again`,
          id: 'toast-credit-fee-rebate-claim',
        },
        executeTransaction: () => hzSdk.credit.claimFeeRebate(amountUnits),
        onSuccess: async () => {
          refetchCreditBalanceAfterClaimReceipt(queryClient, account);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['tokenBalance'] }),
            queryClient.invalidateQueries({
              queryKey: ['credit', 'fee-claim-limits'],
            }),
            queryClient.invalidateQueries({
              queryKey: ['credit', 'fee-claim-preview'],
            }),
          ]);
        },
      });

      if (!claimResult.success) {
        throw claimResult.error;
      }
    },
  });
};

export const useCreditFeeClaimLimits = () => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();

  return useQuery({
    queryKey: ['credit', 'fee-claim-limits', hzSdk?.chainId, account],
    enabled: !!hzSdk && !!account,
    queryFn: () => hzSdk!.credit.getFeeClaimLimits(account as Address),
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
};

export const useCreditFeeClaimPreview = (creditAmount: bigint) => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [
      'credit',
      'fee-claim-preview',
      hzSdk?.chainId,
      account,
      creditAmount.toString(),
    ],
    enabled: !!hzSdk && !!account && creditAmount > 0n,
    queryFn: async () => {
      const { claimTokens, tokenAmounts, creditAmounts } =
        await hzSdk!.credit.getFeeClaimPreview(
          creditAmount,
          account as Address,
        );
      const metadata = await Promise.all(
        claimTokens.map((claimToken) =>
          queryClient.fetchQuery({
            queryKey: ['token-metadata', hzSdk!.chainId, claimToken],
            staleTime: Infinity,
            queryFn: async () => {
              const [wrapperSymbol, decimals] = await Promise.all([
                hzSdk!.publicClient.readContract({
                  address: claimToken,
                  abi: erc20Abi,
                  functionName: 'symbol',
                }),
                hzSdk!.publicClient.readContract({
                  address: claimToken,
                  abi: erc20Abi,
                  functionName: 'decimals',
                }),
              ]);

              return {
                wrapperSymbol,
                payoutSymbol:
                  CREDIT_PAYOUT_SYMBOL_BY_WRAPPER_SYMBOL[wrapperSymbol] ??
                  wrapperSymbol,
                decimals,
              };
            },
          }),
        ),
      );

      return claimTokens.map((claimToken, index) => ({
        claimToken,
        tokenAmount: tokenAmounts[index]!,
        creditAmount: creditAmounts[index]!,
        ...metadata[index]!,
      }));
    },
  });
};

export const useCreditTokenBalance = () => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const creditToken = hzSdk
    ? getContract(hzSdk.chainId, 'CreditToken')
    : undefined;

  return useTokenBalance(creditToken, {
    account,
    enabled: !!account,
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
};

export const useCreditAllowanceForFeeClaimVault = () => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();

  return useQuery({
    queryKey: ['credit', 'fee-claim-allowance', hzSdk?.chainId, account],
    enabled: !!hzSdk && !!account,
    queryFn: async () => {
      if (!hzSdk || !account) return 0n;

      return hzSdk.credit.getFeeClaimAllowance(account as Address);
    },
    staleTime: DYNAMIC_DATA_CACHE_TIME,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
};
