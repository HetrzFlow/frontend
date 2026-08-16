'use client';

import { createElement, useCallback, useEffect, useState } from 'react';

import {
  getViemChain,
  SOURCE_BSC_MAINNET,
} from '@hertzflow/sdk-v2/configs/chains';
import { parseError } from '@hertzflow/sdk-v2/utils/errors/index';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { formatUnits, getAddress, isAddress, parseUnits } from 'viem';
import { useMutation, useQuery, useQueryClient } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient/hooks';
import { useTokenBalance } from '@/common/chainClient/hooks/useTokenBalance';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { useNativeBalance } from '@/common/hooks/useNativeBalance';
import { useGasPrice } from '@/common/services/rest/gas';
import { swapQueryKeys, useSwapPricesQuery } from '@/queries/bsc/swap';
import { fetchSwapPrices } from '@/services/rest/swap';

import { formatSwapTokenAmount } from './format';
import { swapMessages } from './messages';
import {
  getExternalSwapRouteStatus,
  getExternalSwapRouteSummary,
} from './routeState';
import { getBnbGasReserve } from './swapPanelModel';
import { SwapTransactionToast } from './SwapTransactionToast';
import {
  SWAP_REQUEST_ERROR_TOAST_ID,
  SWAP_TRANSACTION_TOAST_ID,
  type SwapTransactionToastData,
} from './swapTransactionToastModel';
import { BNB_TOKEN, type SwapToken } from './useSwapTokens';
import { getSwapTokenBalancesQueryKey } from './useSwapTokenValues';
import type { ExternalSwapQuoteRequest } from '@hertzflow/sdk-v2/types/externalSwap';

const QUOTE_REFRESH_INTERVAL = 10_000;

class QuoteUnavailableError extends Error {
  constructor() {
    super(i18n._(swapMessages.quoteUnavailable));
    this.name = 'QuoteUnavailableError';
  }
}

const getSwapTransactionErrorMessage = (
  error: Parameters<typeof parseError>[0],
) => {
  const parsedError = parseError(error);
  if (parsedError?.isUserRejectedError) {
    return i18n._(msg`User rejected the request.`);
  }

  const message =
    parsedError?.shortMessage ||
    (error instanceof Error ? error.message.split('\n')[0]?.trim() : '');

  return message || i18n._(swapMessages.swapFailed);
};

const showSwapTransactionToast = (data: SwapTransactionToastData) =>
  toast.custom(() => createElement(SwapTransactionToast, data), {
    id: SWAP_TRANSACTION_TOAST_ID,
    icon: null,
    duration:
      data.stage === 'confirmed'
        ? 3000
        : data.stage === 'error'
          ? 4000
          : Infinity,
    className:
      'swap-transaction-toast [&&&&]:!rounded-xl [&&&&]:!border-0 [&&&&]:!bg-[rgba(255,255,255,0.1)] [&&&&]:!shadow-[inset_0_0_0_1px_rgba(191,207,255,0.1)]',
  });

const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (!value) return;

    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
};

const getQuoteRequest = ({
  payToken,
  receiveToken,
  payAmount,
  slippage,
}: {
  payToken?: SwapToken;
  receiveToken?: SwapToken;
  payAmount: string;
  slippage: string;
}): ExternalSwapQuoteRequest | undefined => {
  if (
    !payToken ||
    !receiveToken ||
    !payAmount ||
    !isAddress(payToken.address) ||
    !isAddress(receiveToken.address)
  ) {
    return;
  }

  const slippageBps = Math.round(Number(slippage) * 10_000);
  if (
    !Number.isInteger(slippageBps) ||
    slippageBps < 0 ||
    slippageBps > 10_000
  ) {
    return;
  }

  try {
    const amountIn = parseUnits(payAmount, payToken.decimals);
    if (amountIn <= 0n) return;

    return {
      tokenIn: getAddress(payToken.address),
      tokenOut: getAddress(receiveToken.address),
      amountIn,
      slippageBps,
    };
  } catch {
    return;
  }
};

export const useExternalSwap = ({
  payToken,
  receiveToken,
  payAmount,
  slippage,
  onSuccess,
  quoteKind = 'swap',
  enabled = true,
}: {
  payToken?: SwapToken;
  receiveToken?: SwapToken;
  payAmount: string;
  slippage: string;
  onSuccess?: () => void;
  quoteKind?: 'swap' | 'order';
  enabled?: boolean;
}) => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();
  const queryClient = useQueryClient();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const isNativePayToken = payToken?.address === BNB_TOKEN.address;
  const payTokenAddress =
    payToken && !isNativePayToken && isAddress(payToken.address)
      ? getAddress(payToken.address)
      : undefined;
  const payTokenBalanceQuery = useTokenBalance(payTokenAddress, {
    enabled: enabled && !!payTokenAddress,
  });
  const nativeBalance = useNativeBalance();
  const gasPriceQuery = useGasPrice();
  const debouncedPayAmount = useDebouncedValue(payAmount, 300);
  const currentRequest = getQuoteRequest({
    payToken,
    receiveToken,
    payAmount,
    slippage,
  });
  const isDebouncing = !!currentRequest && payAmount !== debouncedPayAmount;
  const request = currentRequest
    ? getQuoteRequest({
        payToken,
        receiveToken,
        payAmount: debouncedPayAmount,
        slippage,
      })
    : undefined;
  const priceAddresses = [payToken?.address, receiveToken?.address].filter(
    (address): address is string => !!address,
  );
  const pricesQuery = useSwapPricesQuery(priceAddresses, enabled && !request);
  const quoteQueryKey = [
    'peach',
    'external-swap-quote',
    quoteKind,
    hzSdk?.chainId,
    request?.tokenIn,
    request?.tokenOut,
    request?.amountIn.toString(),
    request?.slippageBps,
  ] as const;
  const quoteRequestKey = quoteQueryKey.join('|');
  const [quotePollingDisabledKey, setQuotePollingDisabledKey] = useState<
    string | undefined
  >();
  const quotePollingEnabled = quotePollingDisabledKey !== quoteRequestKey;

  const quoteQuery = useQuery({
    queryKey: quoteQueryKey,
    enabled: enabled && !!hzSdk && !!request,
    queryFn: async ({ signal }) => {
      const [quote, referencePrices] = await Promise.all([
        quoteKind === 'order'
          ? hzSdk!.externalSwap.getOrderQuote(request!)
          : hzSdk!.externalSwap.getQuote(request!),
        fetchSwapPrices(priceAddresses, signal).catch(() => []),
      ]);
      return { quote, referencePrices };
    },
    staleTime: QUOTE_REFRESH_INTERVAL,
    refetchInterval: quotePollingEnabled ? QUOTE_REFRESH_INTERVAL : false,
    refetchOnWindowFocus: quotePollingEnabled,
    refetchOnReconnect: quotePollingEnabled,
    refetchOnMount: quotePollingEnabled,
    gcTime: QUOTE_REFRESH_INTERVAL,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (quoteQuery.error && !quoteQuery.isPlaceholderData) {
      setQuotePollingDisabledKey(quoteRequestKey);
    }
  }, [quoteQuery.error, quoteQuery.isPlaceholderData, quoteRequestKey]);

  const queryQuote = quoteQuery.data?.quote;
  const hasMatchingQuotePair =
    !!request &&
    !!queryQuote &&
    (queryQuote.tokenIn.toLowerCase() === request.tokenIn.toLowerCase() ||
      (quoteKind === 'order' && isNativePayToken)) &&
    queryQuote.tokenOut.toLowerCase() === request.tokenOut.toLowerCase();
  const liveQuoteData =
    currentRequest && hasMatchingQuotePair ? quoteQuery.data : undefined;
  const quote = liveQuoteData?.quote;
  const isQuoteUpdating =
    !!currentRequest &&
    (isDebouncing ||
      quoteQuery.isFetching ||
      quoteQuery.isPlaceholderData ||
      quote?.amountIn !== currentRequest.amountIn);
  const refreshQuote = async () => {
    if (!request) return pricesQuery.refetch();

    const result = await quoteQuery.refetch();
    if (!result.error) {
      setQuotePollingDisabledKey((disabledKey) =>
        disabledKey === quoteRequestKey ? undefined : disabledKey,
      );
    }
    return result;
  };
  const getFreshQuoteData = useCallback(async () => {
    if (!request) {
      throw new QuoteUnavailableError();
    }

    const result = await quoteQuery.refetch({ cancelRefetch: true });
    if (result.error) {
      throw new QuoteUnavailableError();
    }

    setQuotePollingDisabledKey((disabledKey) =>
      disabledKey === quoteRequestKey ? undefined : disabledKey,
    );

    const freshQuote = result.data?.quote;
    if (
      !freshQuote ||
      (freshQuote.tokenIn.toLowerCase() !== request.tokenIn.toLowerCase() &&
        !(quoteKind === 'order' && isNativePayToken)) ||
      freshQuote.tokenOut.toLowerCase() !== request.tokenOut.toLowerCase() ||
      freshQuote.amountIn !== request.amountIn
    ) {
      throw new QuoteUnavailableError();
    }

    return {
      quote: freshQuote,
      referencePrices: result.data?.referencePrices ?? [],
    };
  }, [isNativePayToken, quoteKind, quoteQuery, quoteRequestKey, request]);
  const getFreshQuote = useCallback(
    async () => (await getFreshQuoteData()).quote,
    [getFreshQuoteData],
  );
  const routeStreams = quote?.routeStreams ?? [];
  const payBalance = payToken
    ? isNativePayToken
      ? nativeBalance.balance.toString()
      : payTokenBalanceQuery.data !== undefined
        ? formatUnits(payTokenBalanceQuery.data, payToken.decimals)
        : '0'
    : '0';
  const routeStatus = getExternalSwapRouteStatus({
    hasInput: !!currentRequest,
    canFetch: !!hzSdk && !!currentRequest,
    isDebouncing,
    isFetching: quoteQuery.isFetching,
    hasQuote: !!quote,
    error: quoteQuery.error,
    isFrozen: isDebouncing,
  });
  const submitMutation = useMutation({
    mutationKey: ['peach', 'external-swap-submit', hzSdk?.chainId, account],
    mutationFn: async () => {
      if (
        !hzSdk ||
        !request ||
        !payToken ||
        !receiveToken ||
        !isAddress(account)
      ) {
        throw new Error('Swap prerequisites are not ready');
      }

      const [initialQuote, freshGasPrice] = await Promise.all([
        getFreshQuote(),
        hzSdk.utils.getGasPrice(),
      ]);
      let freshQuote = initialQuote;
      const gasReserve = getBnbGasReserve(
        freshQuote.gasEstimate,
        freshGasPrice,
      );
      const nativeBalanceWei = BigInt(nativeBalance.rawBalance || '0');
      const requiredNativeBalance = freshQuote.isNativeIn
        ? freshQuote.amountIn + gasReserve
        : gasReserve;
      if (nativeBalanceWei < requiredNativeBalance) {
        throw new Error(i18n._(swapMessages.insufficientBnb));
      }

      let plan = await hzSdk.externalSwap.buildSwapPlan({
        quote: freshQuote,
        owner: account,
      });

      if (plan.approval) {
        const approvalResult = await executeTransaction({
          toast: {
            title: i18n._(swapMessages.approving),
            description: i18n._(swapMessages.approving),
            successDescription: i18n._(swapMessages.done),
            id: 'toast-swap-approval',
          },
          refetchBalancesAfterSuccess: false,
          executeTransaction: () =>
            hzSdk.externalSwap.approveSwap({ quote: freshQuote }),
        });
        if (!approvalResult.success) return;

        freshQuote = await getFreshQuote();
        plan = await hzSdk.externalSwap.buildSwapPlan({
          quote: freshQuote,
          owner: account,
        });
        if (plan.approval) {
          throw new Error('Token approval was not confirmed');
        }
      }

      await hzSdk.externalSwap.simulateSwap({
        quote: freshQuote,
        owner: account,
      });

      const toastData = {
        payToken: {
          symbol: payToken.symbol,
          logoURI: payToken.logoURI,
        },
        receiveToken: {
          symbol: receiveToken.symbol,
          logoURI: receiveToken.logoURI,
        },
        payAmount: formatSwapTokenAmount(
          formatUnits(freshQuote.amountIn, payToken.decimals),
        ),
        receiveAmount: formatSwapTokenAmount(
          formatUnits(freshQuote.amountOut, receiveToken.decimals),
        ),
        explorerHost: getViemChain(hzSdk.config.chainId).blockExplorers?.default
          .url,
      };
      let submittedHash: string | undefined;

      showSwapTransactionToast({
        ...toastData,
        stage: 'submitting',
      });

      const swapResult = await executeTransaction({
        toast: {
          title: i18n._(swapMessages.confirmSwap),
          showDefaultLoading: false,
          showDefaultSuccess: false,
          showDefaultError: false,
          id: SWAP_TRANSACTION_TOAST_ID,
        },
        refetchBalancesAfterSuccess: false,
        executeTransaction: () =>
          hzSdk.externalSwap.executeSwap({ quote: freshQuote }),
        onSubmitted: (txHash) => {
          submittedHash = txHash;
          showSwapTransactionToast({
            ...toastData,
            stage: 'submitted',
            submittedHash: txHash,
          });
        },
        onError: (error) => {
          showSwapTransactionToast({
            ...toastData,
            stage: 'error',
            submittedHash,
            errorMessage: getSwapTransactionErrorMessage(error),
          });
        },
      });

      if (!swapResult.success) return;

      showSwapTransactionToast({
        ...toastData,
        stage: 'confirmed',
        submittedHash,
        confirmedHash:
          swapResult.receipt?.transactionHash ??
          submittedHash ??
          swapResult.txHash,
      });

      return swapResult.txHash;
    },
    onSuccess: async (txHash) => {
      if (!txHash || !hzSdk || !isAddress(account)) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['tokenBalance', hzSdk.chainId, account],
        }),
        queryClient.invalidateQueries({
          queryKey: ['balances', hzSdk.chainId, account],
        }),
        queryClient.invalidateQueries({
          queryKey: getSwapTokenBalancesQueryKey(hzSdk.chainId, account),
        }),
        queryClient.invalidateQueries({
          queryKey: swapQueryKeys.history(account),
          refetchType: 'none',
        }),
      ]);
      onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof QuoteUnavailableError) return;

      toast.error(
        error instanceof Error
          ? error.message
          : i18n._(swapMessages.swapFailed),
        { id: SWAP_REQUEST_ERROR_TOAST_ID },
      );
    },
  });
  const canSubmit =
    enabled &&
    hzSdk?.chainId === SOURCE_BSC_MAINNET &&
    isAddress(account) &&
    !!request &&
    !!quote &&
    quote.amountIn === currentRequest?.amountIn &&
    !isQuoteUpdating &&
    !submitMutation.isPending;

  return {
    quote,
    referencePrices: liveQuoteData?.referencePrices ?? pricesQuery.data ?? [],
    routeStreams,
    routeStatus,
    routeSummary: getExternalSwapRouteSummary(routeStreams),
    receiveAmount:
      quote && receiveToken
        ? formatUnits(quote.amountOut, receiveToken.decimals)
        : '',
    quotePayAmount:
      quote && payToken ? formatUnits(quote.amountIn, payToken.decimals) : '',
    minimumReceived:
      quote && receiveToken
        ? formatUnits(quote.minAmountOut, receiveToken.decimals)
        : '',
    gasEstimate: quote?.gasEstimate,
    gasPrice: gasPriceQuery.data,
    nativeBalance: nativeBalance.balance.toString(),
    payBalance,
    isLoading: isQuoteUpdating,
    isSubmitting: submitMutation.isPending,
    canSubmit,
    refreshQuote,
    getFreshQuote,
    getFreshQuoteData,
    submit: () => {
      if (canSubmit) {
        toast.dismiss(SWAP_REQUEST_ERROR_TOAST_ID);
        submitMutation.mutate();
      }
    },
  };
};
