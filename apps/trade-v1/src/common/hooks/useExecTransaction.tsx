'use client';
import { FC, ReactNode, useCallback, useId, useRef } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { bcs } from '@mysten/sui/bcs';
import { SuiEvent } from '@mysten/sui/client';
import { fromBase64, toBase64 } from '@mysten/sui/utils';
import { UseMutationResult } from '@repo/lib/queryClient';
import { ArrowRightShortIcon, cn, toast, tradeToast } from '@repo/ui';
import CoinIcon from '../components/CoinIcon';
import { isDebugMode } from '../constants/common';
import { useWalletStore } from '../stores/walletStore';

interface OrderToastContentProps {
  isLong: boolean;
  size: string;
  px: string;
}

export const OrderToastContent: FC<OrderToastContentProps> = ({
  isLong,
  size,
  px,
}) => {
  const { t } = useLingui();
  return (
    <div className="text-t-1100 flex w-max items-center gap-2">
      <span
        className={cn(
          'flex h-5 items-center rounded-sm px-2.5 text-xs',
          isLong ? 'bg-up/20 text-up' : 'bg-down/20 text-down',
        )}
      >
        {isLong ? t`Long` : t`Short`}
      </span>
      <div className="font-plex flex items-center gap-1">
        <div className="decoration-t-430 underline decoration-dotted underline-offset-2">
          <span className="font-plex">{size}</span>
        </div>
        <span className="text-t-270">@</span>
        <span className="font-plex decoration-t-430 underline decoration-dotted underline-offset-2">
          {px}
        </span>
      </div>
    </div>
  );
};

interface SwapToastContentProps {
  paySz: string;
  payCoinSymbol: string;
  payCoinIconSrc: string;
  receiveCoinIconSrc: string;
  receiveCoinSymbol: string;
  receiveSz: string;
}

const SwapToastContent: FC<SwapToastContentProps> = ({
  paySz,
  payCoinSymbol,
  payCoinIconSrc,
  receiveCoinIconSrc,
  receiveCoinSymbol,
  receiveSz,
}) => {
  return (
    <div className="text-t-1100 flex w-max items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2">
        <CoinIcon size={20} src={payCoinIconSrc} alt={payCoinSymbol} />
        <div className="decoration-t-430 underline decoration-dotted underline-offset-2">
          <span className="font-plex">{paySz}</span> {payCoinSymbol}
        </div>
      </div>
      <ArrowRightShortIcon size={10} className="" />
      <div className="flex items-center gap-2">
        <CoinIcon size={20} src={receiveCoinIconSrc} alt={receiveCoinSymbol} />
        <div className="decoration-t-430 underline decoration-dotted underline-offset-2">
          <span className="font-plex"> {receiveSz}</span> {receiveCoinSymbol}
        </div>
      </div>
    </div>
  );
};

type Result = {
  digest: string;
  rawEffects?: number[];
  effects: string;
  bytes: string;
  signature: string;
  events?: SuiEvent[] | null | undefined;
  status?: 'failed' | 'success';
  toastId?: string | number;
};

type ToastOptionsType = {
  showDefaultSuccess?: boolean;
  ordType: 'market' | 'limit' | 'swap';
  title?: string;
  icon?: ReactNode;
  orderProps?: OrderToastContentProps;
  swapProps?: SwapToastContentProps;
  resultContent?: ReactNode;
  resultDescription?: string;
  errorDescription?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultType = Omit<UseMutationResult<Result, Error, any>, 'mutate'> & {
  mutate: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variables: Parameters<UseMutationResult<Result, Error, any>['mutate']>[0],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: Parameters<UseMutationResult<Result, Error, any>['mutate']>[1],
    toastOptions?: ToastOptionsType,
  ) => void;
};

const handleErrorMsg = (errMsg: string) => {
  let result = '';
  if (errMsg.includes('is not available for consumption, current version')) {
    result = i18n._(
      msg`Transaction failed due to network sync delay. Please retry in a few seconds.`,
    );
  } else if (errMsg.includes('Request to Enoki API failed')) {
    result = i18n._(
      msg`Social login is temporarily unavailable (Sui’s zkLogin service issue). Please try again later or use wallet login instead.`,
    );
  }
  return result;
};

export const useCustomSignAndExecuteTransaction = (
  params: Parameters<typeof useSignAndExecuteTransaction>[0] = {},
): ResultType => {
  const { t } = useLingui();
  const suiClient = useSuiClient();
  const mutateOptionsRef = useRef<
    Parameters<typeof useSignAndExecuteTransaction<Result>>[0]
  >({});
  const mutateData = useSignAndExecuteTransaction<Result>({
    ...params,
    execute: async ({ bytes, signature }) => {
      const { digest, rawEffects, events } =
        await suiClient.executeTransactionBlock({
          transactionBlock: bytes,
          signature,
          options: {
            showRawEffects: true,
            showEvents: true,
          },
        });

      return {
        digest,
        rawEffects,
        effects: toBase64(new Uint8Array(rawEffects!)),
        events,
        bytes,
        signature,
      };
    },
    onSuccess: (...results) => {
      params.onSuccess?.(...results);
      mutateOptionsRef.current?.onSuccess?.(...results);
    },
    onError: (...results) => {
      params.onError?.(...results);
      mutateOptionsRef.current?.onError?.(...results);
    },
    onSettled: (...results) => {
      params.onSettled?.(...results);
      mutateOptionsRef.current?.onSettled?.(...results);
    },
  });
  const explorerHost = useWalletStore((state) => state.getExplorerHost());

  const mutate = mutateData.mutate;
  const mutateAsync = mutateData.mutateAsync;

  const id = useId();

  const customMutate = useCallback(
    (
      variables: Parameters<typeof mutate>[0],
      options: Parameters<typeof mutate>[1] = {},
      toastOptions?: ToastOptionsType,
    ) => {
      if (toastOptions) {
        tradeToast(
          {
            type: 'loading',
            description:
              toastOptions.ordType === 'swap'
                ? t`Swapping tokens`
                : t`Submitting`,
            ...toastOptions,
          },
          {
            id,
            duration: Infinity,
          },
        );
      } else {
        toast.loading(t`Please confirm in your wallet.`, {
          id,
        });
      }
      options = options || {};
      const { onSuccess, onError, onSettled } = options;

      if (mutateOptionsRef.current) {
        mutateOptionsRef.current.onSuccess = (...results) => {
          const result = results[0];
          const { digest, effects: rawEffects } = result;
          result.toastId = id;
          const effects = bcs.TransactionEffects.parse(fromBase64(rawEffects));
          const status = effects[effects.$kind]?.status;
          if (status?.$kind === 'Failed') {
            if (toastOptions) {
              tradeToast(
                {
                  type: 'error',
                  description: (
                    <span className="decoration-t-430 underline decoration-dotted underline-offset-2">
                      {toastOptions.errorDescription || t`Failed`}
                    </span>
                  ),
                  showClose: true,
                  href: `${explorerHost}/txblock/${digest}`,
                  ...toastOptions,
                },
                {
                  id,
                },
              );
            }

            if (onSuccess) {
              result.status = 'failed';
              onSuccess(...results);
            }
            return;
          }

          suiClient
            .waitForTransaction({
              digest,
            })
            .finally(() => {
              if (toastOptions && toastOptions.showDefaultSuccess !== false) {
                const content =
                  toastOptions.resultContent ||
                  (toastOptions.ordType === 'swap' && toastOptions.swapProps ? (
                    <SwapToastContent {...toastOptions.swapProps} />
                  ) : toastOptions.ordType !== 'swap' &&
                    toastOptions.orderProps ? (
                    <OrderToastContent {...toastOptions.orderProps} />
                  ) : null);
                const description =
                  toastOptions.resultDescription || t`Completed`;
                tradeToast(
                  {
                    type: 'success',
                    description: content ? (
                      description
                    ) : (
                      <span className="decoration-t-430 underline decoration-dotted underline-offset-2">
                        {description}
                      </span>
                    ),
                    content: content,
                    showClose: true,
                    href: `${explorerHost}/txblock/${digest}`,
                    ...toastOptions,
                  },
                  { id },
                );
              }

              if (onSuccess) {
                onSuccess(...results);
              }
            });
        };

        mutateOptionsRef.current.onError = (...results) => {
          const error = results[0];

          const errorMsg = handleErrorMsg(error.message);

          const isUserRejection =
            error.message === 'User rejected the request.';

          if (toastOptions) {
            // use reject error, not use errorDescription
            const description = isUserRejection
              ? error.message
              : (toastOptions.errorDescription ?? t`Failed`);

            tradeToast(
              {
                type: 'error',
                description,
                showClose: true,
                content:
                  errorMsg ?? (isDebugMode() ? error.message : undefined),
                ...toastOptions,
              },
              { id },
            );
          }

          if (onError) {
            onError(...results);
          }
        };

        mutateOptionsRef.current.onSettled = (...results) => {
          if (onSettled) {
            onSettled(...results);
          }
        };
      }

      return mutate(variables, options);
    },
    [explorerHost, id, mutate, suiClient, t],
  );

  mutateData.mutateAsync = useCallback(
    async (...params) => {
      return mutateAsync(...params);
    },
    [mutateAsync],
  );

  return { ...mutateData, mutate: customMutate };
};
