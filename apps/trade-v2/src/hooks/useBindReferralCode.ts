'use client';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useMutation, useQueryClient } from '@repo/lib/queryClient';
import { tradeToast } from '@repo/ui';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';

export const useBindReferralCode = () => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const queryClient = useQueryClient();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();

  return useMutation({
    mutationKey: ['bind-referral-code'],
    mutationFn: async (code: string) => {
      const title = i18n._(msg`Bind Referral Code`);
      const errorDescription = i18n._(
        msg`Failed to bind referral code. Please try again.`,
      );
      const toastId = 'toast-bind-referral-code';

      const showBindError = (description: string) => {
        const error = new Error(description);
        tradeToast(
          {
            type: 'error',
            title,
            description,
          },
          {
            id: toastId,
          },
        );

        return { txHash: undefined, success: false, error };
      };

      if (!hzSdk) {
        return showBindError(i18n._(msg`SDK is not available`));
      }

      if (!account) {
        return showBindError(i18n._(msg`Wallet is not connected`));
      }

      return executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: i18n._(msg`Referral code bound successfully.`),
          errorDescription,
          id: toastId,
        },
        executeTransaction: async () => {
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
        onError: (error) => {
          const message =
            'shortMessage' in error && error.shortMessage
              ? error.shortMessage
              : error.message;
          if (message?.includes('User rejected the request')) {
            return;
          }

          tradeToast(
            {
              type: 'error',
              title,
              description: errorDescription,
            },
            {
              id: toastId,
            },
          );
        },
      });
    },
  });
};
