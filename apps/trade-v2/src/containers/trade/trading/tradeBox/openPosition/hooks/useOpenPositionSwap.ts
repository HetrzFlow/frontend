'use client';

import { useCallback, useMemo } from 'react';

import { SOURCE_BSC_MAINNET } from '@hertzflow/sdk-v2/configs/chains';
import {
  getInternalUsdParamsForInst,
  getTradePayTokenAddress,
} from '@hertzflow/sdk-v2/configs/internalUsd';
import { formatUnits, zeroAddress } from 'viem';
import { calc } from '@repo/lib/calc';
import {
  CREDIT_MARKET_CATEGORY,
  type Inst,
  useHzSdk,
  useInstStore,
} from '@/common';
import {
  getBnbGasReserve,
  getBnbMaxAmount,
  getFormattedMinimumReceived,
  getSwapPrice,
  getSwapPriceDifference,
  isSwapBalanceInsufficient,
} from '@/components/Swap/swapPanelModel';
import { useExternalSwap } from '@/components/Swap/useExternalSwap';
import { BNB_TOKEN, type SwapToken } from '@/components/Swap/useSwapTokens';
import { ENABLE_SWAP } from '@/constants/common';
import { usePreferenceStore } from '@/stores/trade/preference';
import type { PayToken, PositionForm } from '../../../store';

const sameAddress = (left?: string, right?: string) =>
  !!left && !!right && left.toLowerCase() === right.toLowerCase();

const getCoinByAddress = <T extends { address?: string }>(
  coins: Record<string, T>,
  address?: string,
) => {
  if (!address) return undefined;
  return (
    coins[address] ??
    Object.values(coins).find((coin) => sameAddress(coin.address, address))
  );
};

const toSwapToken = ({
  address,
  token,
  chainId,
}: {
  address: string;
  token: {
    symbol: string;
    name?: string;
    decimals?: number;
    decimal?: number;
    logoURI?: string;
    icon?: string;
    price?: string;
    balance?: string;
  };
  chainId: number;
}): SwapToken => ({
  chainId,
  address: sameAddress(address, zeroAddress) ? BNB_TOKEN.address : address,
  symbol: token.symbol,
  name: token.name || token.symbol,
  decimals: token.decimals ?? token.decimal ?? 18,
  logoURI: token.logoURI || token.icon || '',
  price: token.price || '',
  balance: token.balance,
});

export const useOpenPositionSwap = ({
  inst,
  isLong,
  paySz,
}: {
  inst?: Inst;
  isLong: boolean;
  paySz: PositionForm['paySz'];
}) => {
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());
  const slippage = usePreferenceStore((state) => state.swapSlippage);
  const setSlippage = usePreferenceStore((state) => state.setSwapSlippage);
  const collateralTokenAddress = isLong
    ? inst?.longTokenAddress
    : inst?.shortTokenAddress;
  const internalUsd = getInternalUsdParamsForInst(hzSdk?.chainId, inst);
  const underlyingTokenAddress = internalUsd?.underlyingTokenAddress;
  const defaultPayTokenAddress = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress,
  });
  const payTokenAddress = paySz.coin || defaultPayTokenAddress;
  const payCoin = getCoinByAddress(coins, payTokenAddress);
  const receiveCoin = getCoinByAddress(coins, underlyingTokenAddress);
  const chainId = hzSdk?.chainId ?? SOURCE_BSC_MAINNET;
  const payToken = useMemo(
    () =>
      payTokenAddress && (paySz.token || payCoin)
        ? toSwapToken({
            address: payTokenAddress,
            token: paySz.token || payCoin!,
            chainId,
          })
        : undefined,
    [chainId, payCoin, paySz.token, payTokenAddress],
  );
  const receiveToken = useMemo(
    () =>
      underlyingTokenAddress && receiveCoin
        ? toSwapToken({
            address: underlyingTokenAddress,
            token: receiveCoin,
            chainId,
          })
        : undefined,
    [chainId, receiveCoin, underlyingTokenAddress],
  );
  const isSwapPayment =
    ENABLE_SWAP &&
    hzSdk?.chainId === SOURCE_BSC_MAINNET &&
    inst?.category !== CREDIT_MARKET_CATEGORY &&
    !!payTokenAddress &&
    !!underlyingTokenAddress &&
    !sameAddress(payTokenAddress, underlyingTokenAddress);
  const externalSwap = useExternalSwap({
    payToken,
    receiveToken,
    payAmount: paySz.value || '',
    slippage,
    quoteKind: 'order',
    enabled: isSwapPayment,
  });
  const payPrice = getSwapPrice(externalSwap.referencePrices, payToken);
  const receivePrice = getSwapPrice(externalSwap.referencePrices, receiveToken);
  const priceDifference = getSwapPriceDifference({
    amountIn: externalSwap.quotePayAmount,
    amountOut: externalSwap.receiveAmount,
    priceIn: payPrice,
    priceOut: receivePrice,
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
  const isNativePayment = payToken?.address === BNB_TOKEN.address;
  const isInsufficientBalance = isSwapBalanceInsufficient(
    paySz.value || '',
    externalSwap.payBalance,
  );
  const isInsufficientGas = isNativePayment
    ? calc(paySz.value || 0).gt(bnbMaxAmount) ||
      (!paySz.value && calc(bnbMaxAmount).lte(0))
    : !!paySz.value &&
      calc(externalSwap.nativeBalance).lt(formatUnits(gasReserve, 18));
  const hasReferencePrice =
    priceDifference.status === 'within' || priceDifference.status === 'worse';
  const isQuoteUnavailable =
    isSwapPayment &&
    !!paySz.value &&
    !externalSwap.isLoading &&
    (externalSwap.routeStatus === 'no-route' ||
      externalSwap.routeStatus === 'error' ||
      (!!externalSwap.quote && !hasReferencePrice));
  const livePayToken: PayToken | undefined = payToken
    ? {
        name: payToken.name,
        symbol: payToken.symbol,
        decimals: payToken.decimals,
        decimal: payToken.decimals,
        logoURI: payToken.logoURI,
        price: payPrice?.status === 'normal' ? payPrice.price : payToken.price,
        balance: externalSwap.payBalance,
      }
    : undefined;
  const getFreshValidatedQuote = useCallback(async () => {
    if (!payToken || !receiveToken) {
      throw new Error('Swap tokens are unavailable');
    }

    const freshData = await externalSwap.getFreshQuoteData();
    const freshPayPrice = getSwapPrice(freshData.referencePrices, payToken);
    const freshReceivePrice = getSwapPrice(
      freshData.referencePrices,
      receiveToken,
    );
    const freshPriceDifference = getSwapPriceDifference({
      amountIn: formatUnits(freshData.quote.amountIn, payToken.decimals),
      amountOut: formatUnits(freshData.quote.amountOut, receiveToken.decimals),
      priceIn: freshPayPrice,
      priceOut: freshReceivePrice,
    });

    return {
      quote: freshData.quote,
      priceDifference: freshPriceDifference,
    };
  }, [externalSwap, payToken, receiveToken]);

  return {
    isSwapPayment,
    payToken,
    receiveToken,
    payAmount: paySz.value || '',
    livePayToken,
    underlyingTokenAddress,
    defaultPayTokenAddress,
    quote: externalSwap.quote,
    quotedCollateralAmount: externalSwap.receiveAmount,
    minimumCollateral: getFormattedMinimumReceived(
      externalSwap.minimumReceived,
      receiveToken,
    ),
    routeStatus: externalSwap.routeStatus,
    routeStreams: externalSwap.routeStreams,
    routeSummary: externalSwap.routeSummary,
    priceDifference,
    slippage,
    isLoading: externalSwap.isLoading,
    isQuoteUnavailable,
    isInsufficientBalance,
    isInsufficientGas,
    canSubmit:
      !isSwapPayment ||
      (externalSwap.canSubmit && hasReferencePrice && !isQuoteUnavailable),
    bnbMaxAmount,
    maxPayAmount: isSwapPayment && isNativePayment ? bnbMaxAmount : undefined,
    setSlippage,
    refreshQuote: externalSwap.refreshQuote,
    getFreshQuote: externalSwap.getFreshQuote,
    getFreshValidatedQuote,
  };
};

export type OpenPositionSwapController = ReturnType<typeof useOpenPositionSwap>;
