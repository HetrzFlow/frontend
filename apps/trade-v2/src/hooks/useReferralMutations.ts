'use client';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Address, BaseError } from 'viem';
import { useMutation, useQueryClient } from '@repo/lib/queryClient';
import { tradeToast } from '@repo/ui';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { useInstStore } from '@/common/stores';

export { useBindReferralCode } from './useBindReferralCode';

const getTransactionErrorMessage = (error: unknown) => {
  const baseError = error as BaseError;

  if (baseError?.shortMessage) {
    return baseError.shortMessage;
  }

  const errorObject = error as Error;
  return errorObject?.message || 'Unknown error';
};

const isUserRejectedError = (error: unknown) =>
  getTransactionErrorMessage(error).includes('User rejected the request');

const showReferralMutationErrorToast = ({
  title,
  description,
  id,
}: {
  title: string;
  description: string;
  id: string;
}) => {
  tradeToast(
    {
      type: 'error',
      title,
      description,
    },
    {
      id,
    },
  );
};

const showReferralMutationError = ({
  title,
  description,
  id,
}: {
  title: string;
  description: string;
  id: string;
}) => {
  const error = new Error(description);
  showReferralMutationErrorToast({ title, description, id });

  return { txHash: undefined, success: false, error };
};

export const useChangeReferralCode = () => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const queryClient = useQueryClient();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();

  return useMutation({
    mutationKey: ['change-referral-code'],
    mutationFn: async (code: string) => {
      const title = i18n._(msg`Change Referral Code`);
      const errorDescription = i18n._(
        msg`Failed to change referral code. Please try again.`,
      );
      const toastId = 'toast-change-referral-code';

      if (!hzSdk) {
        return showReferralMutationError({
          title,
          description: i18n._(msg`SDK is not available`),
          id: toastId,
        });
      }

      if (!account) {
        return showReferralMutationError({
          title,
          description: i18n._(msg`Wallet is not connected`),
          id: toastId,
        });
      }

      return executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: i18n._(msg`Referral code changed successfully.`),
          errorDescription,
          id: toastId,
        },
        executeTransaction: async () => {
          // bindReferrer overwrites traderReferralCodes[account] on-chain,
          // so re-binding is the canonical way to switch referrer.
          return hzSdk.referral.bindReferrer(code);
        },
        onSuccess: () => {
          const invalidateAll = () =>
            Promise.all([
              queryClient.invalidateQueries({
                queryKey: ['user-referral-info'],
              }),
              queryClient.invalidateQueries({
                queryKey: ['rest', 'referral-profile'],
              }),
            ]);

          void invalidateAll();
          [1500, 4000, 8000].forEach((delay) => {
            setTimeout(() => {
              void invalidateAll();
            }, delay);
          });
        },
        onError: async (error) => {
          if (!isUserRejectedError(error)) {
            showReferralMutationErrorToast({
              title,
              description: errorDescription,
              id: toastId,
            });
          }
          console.error(
            '[Change Referral Code]',
            getTransactionErrorMessage(error),
            error,
          );
        },
      });
    },
  });
};

export const useRegisterReferralCode = () => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const queryClient = useQueryClient();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();

  return useMutation({
    mutationKey: ['register-referral-code'],
    mutationFn: async (code: string) => {
      const title = i18n._(msg`Create Referral Code`);
      const errorDescription = i18n._(msg`Failed`);
      const toastId = 'toast-create-referral-code';

      if (!hzSdk) {
        return showReferralMutationError({
          title,
          description: i18n._(msg`SDK is not available`),
          id: toastId,
        });
      }

      if (!account) {
        return showReferralMutationError({
          title,
          description: i18n._(msg`Wallet is not connected`),
          id: toastId,
        });
      }

      return executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: i18n._(msg`Referral code created successfully.`),
          errorDescription,
          id: toastId,
        },
        executeTransaction: async () => {
          return hzSdk.referral.registerCode(code);
        },
        onSuccess: async () => {
          const invalidateAll = () =>
            Promise.all([
              queryClient.invalidateQueries({
                queryKey: ['referral-code-owner'],
              }),
              queryClient.invalidateQueries({
                queryKey: ['rest', 'referral-codes'],
              }),
              queryClient.invalidateQueries({
                queryKey: ['rest', 'referral-profile'],
              }),
            ]);

          await invalidateAll();
          // Backend indexer may lag the on-chain confirmation; retry a few
          // times so the freshly-created code appears without a manual reload.
          [1500, 4000, 8000].forEach((delay) => {
            setTimeout(() => {
              void invalidateAll();
            }, delay);
          });
        },
      });
    },
  });
};

export const useClaimAffiliateRewards = () => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const insts = useInstStore((state) => state.getViewInstsArr());
  const queryClient = useQueryClient();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();

  return useMutation({
    mutationKey: ['claim-affiliate-rewards'],
    mutationFn: async () => {
      const title = i18n._(msg`Claim Referral Rewards`);
      const toastId = 'toast-claim-affiliate-rewards';
      const errorDescription = i18n._(
        msg`Failed to claim rewards. Please try again.`,
      );

      const showClaimError = (message: string) => {
        return showReferralMutationError({
          title,
          description: message,
          id: toastId,
        });
      };

      if (!hzSdk) {
        return showClaimError(i18n._(msg`SDK is not available`));
      }

      if (!account) {
        return showClaimError(i18n._(msg`Wallet is not connected`));
      }

      if (!insts.length) {
        return showClaimError(i18n._(msg`No claimable rewards`));
      }

      const latestRewards = await hzSdk.referral.getAffiliateRewards(insts);

      const markets: Address[] = [];
      const tokens: Address[] = [];
      for (const item of latestRewards) {
        if (item.affiliateRewardLong > 0n) {
          markets.push(item.marketAddress as Address);
          tokens.push(item.longTokenAddress as Address);
        }
        if (item.affiliateRewardShort > 0n) {
          markets.push(item.marketAddress as Address);
          tokens.push(item.shortTokenAddress as Address);
        }
      }

      if (markets.length === 0) {
        return showClaimError(i18n._(msg`No claimable rewards`));
      }

      return executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Claiming`),
          successDescription: i18n._(msg`Rewards claimed.`),
          errorDescription,
          id: toastId,
        },
        executeTransaction: async () => {
          return hzSdk.referral.claimAffiliateRewards(
            markets,
            tokens,
            account as Address,
          );
        },
        onSuccess: async () => {
          const invalidateAll = () =>
            Promise.all([
              queryClient.invalidateQueries({
                queryKey: ['referral', 'affiliate-rewards'],
              }),
              queryClient.invalidateQueries({
                queryKey: ['rest', 'referral-profile'],
              }),
            ]);

          await invalidateAll();

          [1500, 4000, 8000].forEach((delay) => {
            setTimeout(() => {
              void invalidateAll();
            }, delay);
          });
        },
        onError: async (error) => {
          if (!isUserRejectedError(error)) {
            showReferralMutationErrorToast({
              title,
              description: errorDescription,
              id: toastId,
            });
          }
          console.error(
            '[Claim Affiliate Rewards]',
            getTransactionErrorMessage(error),
            error,
          );
        },
      });
    },
  });
};
