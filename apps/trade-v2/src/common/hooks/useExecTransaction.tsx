'use client';
import { FC, ReactNode, useCallback, useId } from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { createRevertedTransactionError } from '@hertzflow/sdk-v2/utils/callContract';
import { parseError, TxErrorType } from '@hertzflow/sdk-v2/utils/errors/index';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { BaseError, type TransactionReceipt } from 'viem';
// import { UseMutationResult } from '@repo/lib/queryClient';
import { cn, LinkIcon, tradeToast } from '@repo/ui';
import { useActiveWallet } from '../chainClient';
import {
  useHzSdk,
  useCurrentAccountAddress,
  useBalancesQuery,
} from '../chainClient/hooks';

interface OrderToastContentProps {
  isLong: boolean;
  size: string;
  px: string;
  href?: string;
}

export const OrderToastContent: FC<OrderToastContentProps> = ({
  isLong,
  size,
  px,
  href,
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
        <div className="">
          <span className="font-plex">{size}</span>
        </div>
        <span className="text-t-270">@</span>
        <span className="">{px}</span>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          className="text-accent cursor-pointer"
          rel="noreferrer noopener"
        >
          <LinkIcon size={16} />
        </a>
      ) : null}
    </div>
  );
};

// interface SwapToastContentProps {
//   paySz: string;
//   payCoinSymbol: string;
//   payCoinIconSrc: string;
//   receiveCoinIconSrc: string;
//   receiveCoinSymbol: string;
//   receiveSz: string;
// }

// const SwapToastContent: FC<SwapToastContentProps> = ({
//   paySz,
//   payCoinSymbol,
//   payCoinIconSrc,
//   receiveCoinIconSrc,
//   receiveCoinSymbol,
//   receiveSz,
// }) => {
//   return (
//     <div className="text-t-1100 flex w-max items-center justify-between gap-2 text-sm">
//       <div className="flex items-center gap-2">
//         <CoinIcon size={20} src={payCoinIconSrc} alt={payCoinSymbol} />
//         <div className="decoration-t-430 underline decoration-dotted underline-offset-2">
//           <span className="font-plex">{paySz}</span> {payCoinSymbol}
//         </div>
//       </div>
//       <ArrowRightShortIcon size={10} className="" />
//       <div className="flex items-center gap-2">
//         <CoinIcon size={20} src={receiveCoinIconSrc} alt={receiveCoinSymbol} />
//         <div className="decoration-t-430 underline decoration-dotted underline-offset-2">
//           <span className="font-plex"> {receiveSz}</span> {receiveCoinSymbol}
//         </div>
//       </div>
//     </div>
//   );
// };

// type Result = {
//   digest: string;
//   rawEffects?: number[];
//   effects: string;
//   bytes: string;
//   signature: string;
//   events?: any[] | null | undefined; // TODO: EVM - Replace with EVM event type
//   status?: 'failed' | 'success';
//   toastId?: string | number;
// };

// type ToastOptionsType = {
//   showDefaultSuccess?: boolean;
//   ordType: 'market' | 'limit' | 'swap';
//   title?: string;
//   icon?: ReactNode;
//   orderProps?: OrderToastContentProps;
//   swapProps?: SwapToastContentProps;
//   resultContent?: ReactNode;
//   resultDescription?: string;
//   errorDescription?: string;
// };

// type ResultType = Omit<UseMutationResult<Result, Error, any>, 'mutate'> & {
//   mutate: (
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     variables: Parameters<UseMutationResult<Result, Error, any>['mutate']>[0],
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     options: Parameters<UseMutationResult<Result, Error, any>['mutate']>[1],
//     toastOptions?: ToastOptionsType,
//   ) => void;
// };

const handleErrorMsg = (error: CustomError | BaseError | Error) => {
  let txHash;

  const customError = error as CustomError;
  const isTxReverted = customError.errorType;
  if (isTxReverted) {
    txHash = customError.txHash;
  }

  const parsedError = parseError(error);
  let errorMessage =
    parsedError?.shortMessage || error.message?.split('\n')[0]?.trim() || '';
  let rpcMessage = parsedError?.rpcMessage;
  const isContractRevert = Boolean(
    isTxReverted || parsedError?.reason || parsedError?.contractError,
  );

  if (parsedError?.txErrorType === TxErrorType.NotEnoughFunds) {
    errorMessage = i18n._(msg`Insufficient gas token for keeper execution.`);
    rpcMessage = undefined;
  }

  return {
    txHash,
    message: errorMessage,
    rpcMessage,
    isContractRevert,
    isUserRejectError: parsedError?.isUserRejectedError,
  };
};

type CustomError = {
  errorType: 'reverted';
  message?: string;
  txHash?: string;
};

export interface CustomTransactionOptions<TContext = unknown> {
  // Toast configuration
  toast?: {
    title?: string;
    description?: string;
    icon?: ReactNode;
    loadingContent?: ReactNode;
    successDescription?: string;
    errorContent?: ReactNode;
    errorDescription?: string;
    showDefaultLoading?: boolean;
    showDefaultSuccess?: boolean;
    showDefaultError?: boolean;
    showClose?: boolean;
    id?: string;
  };
  refetchBalancesAfterSuccess?: boolean;
  waitTransaction?: boolean;
  // Transaction execution function
  executeTransaction: () => Promise<string>;
  // Callback after the wallet submits the transaction, before confirmation
  onSubmitted?: (txHash: string) => void | Promise<void>;
  // Callback after successful transaction
  onSuccess?: (txHash: string) => void | Promise<void>;
  // Callback after failed transaction
  onError?: (error: CustomError | BaseError | Error) => void | Promise<void>;
  // Final callback (called regardless of success or failure)
  onSettled?: () => void | Promise<void>;
  // Additional context data (passed to onSuccess and other callbacks)
  context?: TContext;
}

export const useCustomSignAndExecuteTransaction = () => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const userAddress = useCurrentAccountAddress();
  const { refetch: refetchBalances } = useBalancesQuery(userAddress || '');
  const { wallet } = useActiveWallet();
  const defaultToastId = useId();

  const executeTransaction = useCallback(
    async <TContext = unknown,>(
      options: CustomTransactionOptions<TContext>,
    ) => {
      const {
        toast: toastOptions,
        executeTransaction: executeTx,
        onSubmitted,
        onSuccess,
        onError,
        onSettled,
        waitTransaction = true,
        refetchBalancesAfterSuccess = true,
      } = options;

      // Check and switch chain if needed
      const expectedChainId = hzSdk?.chainId;
      try {
        if (expectedChainId && wallet && 'switchChain' in wallet) {
          await wallet.switchChain(expectedChainId);
        }
      } catch (error) {
        const errorObj = error as Error;
        // Show error toast for chain switch failure
        if (toastOptions && toastOptions.showDefaultError !== false) {
          tradeToast(
            {
              type: 'error',
              title: toastOptions.title,
              icon: toastOptions.icon,
              description: t`Failed to switch network`,
              content: (
                <p className="line-clamp-4">
                  {t`Please switch to the correct network and try again.`}
                  <br />
                  {errorObj.message}
                </p>
              ),
            },
            {
              id: toastOptions.id || defaultToastId,
            },
          );
        }
        if (onError) {
          await onError(errorObj);
        }
        if (onSettled) {
          await onSettled();
        }
        return { txHash: undefined, success: false, error: errorObj };
      }

      // Generate unique toast ID
      const toastId = toastOptions?.id || defaultToastId;

      // Show loading toast
      if (toastOptions && toastOptions.showDefaultLoading !== false) {
        tradeToast(
          {
            type: 'loading',
            description: toastOptions.description || t`Submitting`,
            title: toastOptions.title,
            icon: toastOptions.icon,
            content: toastOptions.loadingContent,
            showClose: toastOptions.showClose,
          },
          {
            id: toastId,
            duration: Infinity,
          },
        );
      }

      try {
        // Execute transaction
        const txHash = await executeTx();
        if (onSubmitted) {
          await onSubmitted(txHash);
        }

        let receipt: TransactionReceipt | undefined;
        if (waitTransaction) {
          receipt = await hzSdk?.publicClient?.waitForTransactionReceipt({
            hash: txHash as `0x${string}`,
          });
          if (receipt?.status === 'reverted') {
            throw await createRevertedTransactionError({
              sdk: hzSdk,
              receipt,
              txHash,
            });
          }
        }

        // Refresh balance data
        if (refetchBalancesAfterSuccess) {
          refetchBalances();
        }

        // Get explorer URL
        const explorerHost = hzSdk
          ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
          : '';

        // Show success toast
        if (toastOptions && toastOptions.showDefaultSuccess !== false) {
          const description = toastOptions.successDescription || t`Completed`;
          tradeToast(
            {
              type: 'success',
              title: toastOptions.title,
              description:
                txHash && explorerHost ? (
                  <div className="flex items-center gap-1">
                    {description}
                    <a
                      href={`${explorerHost}/tx/${txHash}`}
                      target="_blank"
                      className="text-accent cursor-pointer"
                      rel="noreferrer noopener"
                    >
                      <LinkIcon size={16} />
                    </a>
                  </div>
                ) : (
                  description
                ),
              showClose: true,
              icon: toastOptions.icon,
            },
            {
              id: toastId,
            },
          );
        }

        // Call success callback
        if (onSuccess) {
          await onSuccess(txHash);
        }

        return { txHash, receipt, success: true };
      } catch (error) {
        const {
          txHash,
          message,
          rpcMessage,
          isContractRevert,
          isUserRejectError,
        } = handleErrorMsg(error as CustomError | BaseError | Error);

        const isTimeout = message === 'timeout';
        // Show error toast
        if (toastOptions && toastOptions.showDefaultError !== false) {
          // For user-rejected transactions the wallet's own message is already
          // a complete sentence ("User rejected the request."), so use it as
          // the toast description and skip the duplicated content line.
          const description = isUserRejectError
            ? t`User rejected the request.`
            : isTimeout
              ? t`Pending`
              : toastOptions.errorDescription || t`Failed`;
          // Get explorer URL
          const explorerHost = hzSdk
            ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
            : '';
          tradeToast(
            {
              type: 'error',
              title: toastOptions.title,
              icon: toastOptions.icon,
              description:
                txHash && explorerHost && !isUserRejectError ? (
                  <div className="flex items-center gap-1">
                    {description}
                    <a
                      href={`${explorerHost}/tx/${txHash}`}
                      target="_blank"
                      className="text-accent cursor-pointer"
                      rel="noreferrer noopener"
                    >
                      <LinkIcon size={16} />
                    </a>
                  </div>
                ) : (
                  description
                ),
              content: isUserRejectError
                ? undefined
                : toastOptions.errorContent || (
                    <p className="line-clamp-4">
                      {isTimeout ? (
                        t`Transaction pending. Please refresh the page to check the latest status in history.`
                      ) : (
                        <>
                          {message}
                          {rpcMessage && !isContractRevert ? (
                            <>
                              <br />
                              {rpcMessage}
                            </>
                          ) : null}
                        </>
                      )}
                    </p>
                  ),
            },
            {
              id: toastId,
            },
          );
        }

        // Call error callback
        if (onError) {
          await onError(error as CustomError | BaseError | Error);
        }

        return { txHash, success: false, error: error };
      } finally {
        // Call settled callback
        if (onSettled) {
          await onSettled();
        }
      }
    },
    [t, hzSdk, refetchBalances, wallet, defaultToastId],
  );

  return { executeTransaction };
};
