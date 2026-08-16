'use client';

import { useEffect, useReducer, useState } from 'react';

import { formatUnits } from 'viem';
import { calc } from '@repo/lib/calc';
import {
  DEFAULT_SWAP_SLIPPAGE,
  usePreferenceStore,
} from '@/stores/trade/preference';

import {
  createInitialSwapFormState,
  getBnbGasReserve,
  getBnbMaxAmount,
  getFormattedMinimumReceived,
  getFormattedReceiveAmount,
  getSwapCtaStatus,
  getSwapPrice,
  getSwapPriceDifference,
  getSwapRate,
  getSwapUsdValue,
  isSwapBalanceInsufficient,
  isSameSwapToken,
  resolveMarketReceiveToken,
  resolvePayToken,
  swapFormReducer,
  truncateSwapInputAmount,
  type SwapPanelVariant,
} from './swapPanelModel';
import { useExternalSwap } from './useExternalSwap';
import {
  BNB_TOKEN,
  useSwapTokens,
  type SwapToken,
} from './useSwapTokens';

type UseSwapPanelOptions = {
  defaultReceiveSymbol?: string;
  defaultReceiveToken?: SwapToken;
  quickTokenPreset?: SwapToken[];
};

export const useSwapPanel = (
  variant: SwapPanelVariant,
  {
    defaultReceiveSymbol,
    defaultReceiveToken: explicitDefaultReceiveToken,
    quickTokenPreset,
  }: UseSwapPanelOptions = {},
) => {
  const { quickTokens, recommended } = useSwapTokens('', quickTokenPreset);
  const defaultReceiveToken =
    explicitDefaultReceiveToken ??
    resolveMarketReceiveToken(defaultReceiveSymbol, [
      ...quickTokens,
      ...recommended,
    ]);
  const [form, dispatch] = useReducer(
    swapFormReducer,
    defaultReceiveToken,
    createInitialSwapFormState,
  );
  const [isBnbMax, setIsBnbMax] = useState(false);
  const slippage = usePreferenceStore((state) => state.swapSlippage);
  const setSlippage = usePreferenceStore((state) => state.setSwapSlippage);
  const payToken = resolvePayToken(form.receiveToken, form.selectedPayToken);
  const externalSwap = useExternalSwap({
    payToken,
    receiveToken: form.receiveToken,
    payAmount: form.payAmount,
    slippage,
    onSuccess: () => {
      setIsBnbMax(false);
      dispatch({
        type: 'reset',
        receiveToken: defaultReceiveToken,
      });
    },
  });
  const gasReserve = getBnbGasReserve(
    externalSwap.gasEstimate,
    externalSwap.gasPrice,
  );
  const bnbMaxAmount = getBnbMaxAmount({
    balance: externalSwap.nativeBalance,
    gasEstimate: externalSwap.gasEstimate,
    gasPrice: externalSwap.gasPrice,
  });

  useEffect(() => {
    dispatch({
      type: 'sync-default-receive',
      token: defaultReceiveToken,
    });
  }, [defaultReceiveToken]);

  useEffect(() => {
    if (
      isBnbMax &&
      isSameSwapToken(payToken, BNB_TOKEN) &&
      calc(form.payAmount || 0).gt(bnbMaxAmount)
    ) {
      dispatch({
        type: 'pay-amount-changed',
        value: bnbMaxAmount,
        currentPayToken: payToken,
      });
    }
  }, [bnbMaxAmount, form.payAmount, isBnbMax, payToken]);
  const payPrice = getSwapPrice(externalSwap.referencePrices, payToken);
  const receivePrice = getSwapPrice(
    externalSwap.referencePrices,
    form.receiveToken,
  );
  const priceDifference = getSwapPriceDifference({
    amountIn: externalSwap.quotePayAmount,
    amountOut: externalSwap.receiveAmount,
    priceIn: payPrice,
    priceOut: receivePrice,
  });
  const payUsdPrice = payPrice?.status === 'normal' ? payPrice.price : undefined;
  const receiveUsdPrice =
    receivePrice?.status === 'normal' ? receivePrice.price : undefined;
  const receiveAmount = externalSwap.receiveAmount;
  const isInsufficientBalance = isSwapBalanceInsufficient(
    form.payAmount,
    externalSwap.payBalance,
  );
  const isInsufficientGas = isSameSwapToken(payToken, BNB_TOKEN)
    ? calc(form.payAmount || 0).gt(bnbMaxAmount) ||
      (!form.payAmount && calc(bnbMaxAmount).lte(0))
    : !!form.payAmount &&
      calc(externalSwap.nativeBalance).lt(formatUnits(gasReserve, 18));
  const isQuoteUnavailable =
    !!form.payAmount &&
    (externalSwap.routeStatus === 'no-route' ||
      externalSwap.routeStatus === 'error');
  const actionButtonStatus = getSwapCtaStatus({
    isLoading: externalSwap.isLoading,
    isSubmitting: externalSwap.isSubmitting,
    needsApproval: false,
    isInsufficientBalance,
    isInsufficientGas,
    isHighPriceDifference: priceDifference.isHigh,
    isQuoteUnavailable,
  });

  return {
    model: {
      tokenFields: {
        variant,
        payAmount: form.payAmount,
        payUsdValue: getSwapUsdValue(form.payAmount, payUsdPrice),
        payBalance: externalSwap.payBalance,
        payToken,
        payTokenLoading: false,
        receiveAmount: getFormattedReceiveAmount(receiveAmount),
        receivePlaceholder: externalSwap.routeStatus === 'idle' ? '0.00' : '--',
        receiveLoading: externalSwap.isLoading && !receiveAmount,
        receiveStale: externalSwap.isLoading && !!receiveAmount,
        receiveUsdValue: getSwapUsdValue(receiveAmount, receiveUsdPrice),
        receiveToken: form.receiveToken,
        disabled: externalSwap.isSubmitting,
      },
      actionButton: {
        status: actionButtonStatus,
        disabled:
          !externalSwap.canSubmit ||
          isInsufficientBalance ||
          isInsufficientGas ||
          isQuoteUnavailable,
        payTokenSymbol: payToken?.symbol,
      },
      quote: {
        slippage,
        rate: getSwapRate({
          payToken,
          receiveToken: form.receiveToken,
          payAmount: externalSwap.quotePayAmount,
          receiveAmount,
          isRateInverted: form.isRateInverted,
        }),
        isRateInverted: form.isRateInverted,
        minimumReceived: getFormattedMinimumReceived(
          externalSwap.minimumReceived,
          form.receiveToken,
        ),
        routeStatus: externalSwap.routeStatus,
        routeStreams: externalSwap.routeStreams,
        routeSummary: externalSwap.routeSummary,
        payToken,
        receiveToken: form.receiveToken,
        payAmount: form.payAmount,
        receiveAmount,
        priceDifference,
        isLoading: externalSwap.isLoading,
        disabled: externalSwap.isSubmitting || externalSwap.isLoading,
      },
    },
    actions: {
      changePayAmount: (value: string) => {
        setIsBnbMax(false);
        dispatch({
          type: 'pay-amount-changed',
          value: truncateSwapInputAmount(value, payToken?.decimals),
          currentPayToken: payToken,
        });
      },
      changePayAmountByPercent: (value: string) => {
        const isMax =
          isSameSwapToken(payToken, BNB_TOKEN) &&
          calc(value || 0).eq(externalSwap.payBalance || 0);
        setIsBnbMax(isMax);
        dispatch({
          type: 'pay-amount-changed',
          value: truncateSwapInputAmount(
            isMax ? bnbMaxAmount : value,
            payToken?.decimals,
          ),
          currentPayToken: payToken,
        });
      },
      selectPayToken: (token: typeof form.receiveToken) => {
        setIsBnbMax(false);
        setSlippage(DEFAULT_SWAP_SLIPPAGE);
        dispatch({
          type: 'pay-token-selected',
          token,
          currentPayToken: payToken,
        });
      },
      selectReceiveToken: (token: typeof form.receiveToken) => {
        setIsBnbMax(false);
        setSlippage(DEFAULT_SWAP_SLIPPAGE);
        dispatch({
          type: 'receive-token-selected',
          token,
          currentPayToken: payToken,
        });
      },
      reverseTokens: () => {
        setIsBnbMax(false);
        setSlippage(DEFAULT_SWAP_SLIPPAGE);
        dispatch({ type: 'reverse', currentPayToken: payToken });
      },
      toggleRateDirection: () => dispatch({ type: 'toggle-rate-direction' }),
      setSlippage,
      refreshQuote: externalSwap.refreshQuote,
      submit: externalSwap.submit,
    },
  };
};

export type SwapPanelController = ReturnType<typeof useSwapPanel>;
