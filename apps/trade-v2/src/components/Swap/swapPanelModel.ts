import { formatUnits, parseUnits } from 'viem';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import type { SwapPrice } from '@/services/rest/swap';

import { formatSwapTokenAmount, formatSwapUsdAmount } from './format';
import {
  BNB_TOKEN,
  BTCB_TOKEN,
  type SwapToken,
  USDT_TOKEN,
} from './useSwapTokens';

export type SwapPanelVariant = 'trade' | 'widget';

export type SwapFormState = {
  selectedPayToken?: SwapToken;
  receiveToken: SwapToken;
  payAmount: string;
  isRateInverted: boolean;
  isPairTouched: boolean;
};

export type SwapFormAction =
  | {
      type: 'pay-amount-changed';
      value: string;
      currentPayToken?: SwapToken;
    }
  | {
      type: 'pay-token-selected';
      token: SwapToken;
      currentPayToken?: SwapToken;
    }
  | {
      type: 'receive-token-selected';
      token: SwapToken;
      currentPayToken?: SwapToken;
    }
  | { type: 'reverse'; currentPayToken?: SwapToken }
  | { type: 'toggle-rate-direction' }
  | { type: 'sync-default-receive'; token: SwapToken }
  | { type: 'reset'; receiveToken: SwapToken };

export type SwapCtaStatus =
  | 'insufficient'
  | 'insufficient-gas'
  | 'loading'
  | 'submitting'
  | 'approve'
  | 'confirm'
  | 'unavailable'
  | 'swap';

export type SwapPrimaryAction = 'connect-wallet' | 'enter-amount' | 'swap';

export const getSwapPrimaryAction = (
  isConnected: boolean,
  payAmount: string,
): SwapPrimaryAction => {
  if (!isConnected) return 'connect-wallet';
  return Number(payAmount) > 0 ? 'swap' : 'enter-amount';
};

export const shouldAutoExpandSwapDetails = (
  payAmount: string,
  receiveAmount: string,
) => Number(payAmount) > 0 && !!receiveAmount;

export const isSwapBalanceInsufficient = (
  payAmount: string,
  payBalance: string,
) => {
  const amount = calc(payAmount || 0);
  return amount.isFinite() && amount.gt(payBalance || 0);
};

export type SwapPriceDifference = {
  status: 'unavailable' | 'market-closed' | 'within' | 'worse';
  percentage: string;
  isHigh: boolean;
};

export const createInitialSwapFormState = (
  receiveToken = USDT_TOKEN,
): SwapFormState => ({
  receiveToken,
  payAmount: '',
  isRateInverted: false,
  isPairTouched: false,
});

export const isSameSwapToken = (left?: SwapToken, right?: SwapToken) =>
  !!left && !!right && left.address === right.address;

export const truncateSwapInputAmount = (value: string, decimals?: number) => {
  if (!Number.isInteger(decimals) || decimals === undefined || decimals < 0) {
    return value;
  }

  const [integer = '', fraction] = value.split('.');
  if (fraction === undefined) return value;
  if (decimals === 0) return integer;
  return `${integer}.${fraction.slice(0, decimals)}`;
};

export const resolvePayToken = (
  receiveToken: SwapToken,
  selectedPayToken?: SwapToken,
) =>
  selectedPayToken ??
  (!isSameSwapToken(BTCB_TOKEN, receiveToken) ? BTCB_TOKEN : USDT_TOKEN);

export const resolveMarketReceiveToken = (
  marketBaseSymbol: string | undefined,
  tokens: SwapToken[],
) => {
  if (!marketBaseSymbol) return USDT_TOKEN;

  const symbol = marketBaseSymbol.toUpperCase();
  const matches = new Map<string, SwapToken>();
  for (const token of tokens) {
    if (token.symbol.toUpperCase() === symbol) {
      matches.set(token.address.toLowerCase(), token);
    }
  }

  return matches.size === 1
    ? ([...matches.values()][0] ?? USDT_TOKEN)
    : USDT_TOKEN;
};

export const MIN_BNB_GAS_RESERVE = 1_000_000_000_000_000n;

export const getBnbGasReserve = (
  gasEstimate?: bigint,
  gasPrice?: bigint,
) => {
  const estimated =
    gasEstimate && gasPrice
      ? (gasEstimate * gasPrice * 3n + 1n) / 2n
      : 0n;
  return estimated > MIN_BNB_GAS_RESERVE
    ? estimated
    : MIN_BNB_GAS_RESERVE;
};

export const getBnbMaxAmount = ({
  balance,
  gasEstimate,
  gasPrice,
}: {
  balance: string;
  gasEstimate?: bigint;
  gasPrice?: bigint;
}) => {
  try {
    const balanceWei = parseUnits(balance || '0', BNB_TOKEN.decimals);
    const reserve = getBnbGasReserve(gasEstimate, gasPrice);
    return formatUnits(
      balanceWei > reserve ? balanceWei - reserve : 0n,
      BNB_TOKEN.decimals,
    );
  } catch {
    return '0';
  }
};

export const swapFormReducer = (
  state: SwapFormState,
  action: SwapFormAction,
): SwapFormState => {
  switch (action.type) {
    case 'pay-amount-changed':
      return {
        ...state,
        selectedPayToken: state.selectedPayToken ?? action.currentPayToken,
        payAmount: action.value,
        isPairTouched: true,
      };
    case 'pay-token-selected':
      return {
        ...state,
        selectedPayToken: action.token,
        receiveToken:
          isSameSwapToken(action.token, state.receiveToken) &&
          action.currentPayToken
            ? action.currentPayToken
            : state.receiveToken,
        payAmount: '',
        isPairTouched: true,
      };
    case 'receive-token-selected':
      return {
        ...state,
        selectedPayToken: isSameSwapToken(action.token, action.currentPayToken)
          ? state.receiveToken
          : state.selectedPayToken,
        receiveToken: action.token,
        payAmount: '',
        isPairTouched: true,
      };
    case 'reverse':
      return action.currentPayToken
        ? {
            ...state,
            selectedPayToken: state.receiveToken,
            receiveToken: action.currentPayToken,
            payAmount: '',
            isRateInverted: false,
            isPairTouched: true,
          }
        : state;
    case 'toggle-rate-direction':
      return { ...state, isRateInverted: !state.isRateInverted };
    case 'sync-default-receive':
      return !state.isPairTouched && !state.payAmount
        ? { ...state, receiveToken: action.token }
        : state;
    case 'reset':
      return createInitialSwapFormState(action.receiveToken);
  }
};

export const getSwapUsdValue = (amount: string, price?: string) => {
  if (!amount) return '$0.00';
  if (!price) return '-';
  return formatSwapUsdAmount(calc(amount).times(price).toString());
};

export const getSwapPrice = (
  prices: readonly SwapPrice[],
  token?: SwapToken,
) => {
  if (!token) return;

  return prices.find(
    (price) => price.address === token.address.toLowerCase(),
  );
};

export const getSwapPriceDifference = ({
  amountIn,
  amountOut,
  priceIn,
  priceOut,
}: {
  amountIn: string;
  amountOut: string;
  priceIn?: SwapPrice;
  priceOut?: SwapPrice;
}): SwapPriceDifference => {
  if (priceIn?.status === 'no_feed' || priceOut?.status === 'no_feed') {
    return {
      status: 'unavailable',
      percentage: '',
      isHigh: false,
    };
  }

  if (
    priceIn?.status === 'market_closed' ||
    priceOut?.status === 'market_closed'
  ) {
    return {
      status: 'market-closed',
      percentage: '',
      isHigh: false,
    };
  }

  if (
    !amountIn ||
    !amountOut ||
    priceIn?.status !== 'normal' ||
    priceOut?.status !== 'normal' ||
    !priceIn.price ||
    !priceOut.price
  ) {
    return {
      status: 'unavailable',
      percentage: '',
      isHigh: false,
    };
  }

  const referenceOut = calc(amountIn).times(priceIn.price).div(priceOut.price);
  if (!referenceOut.isFinite() || referenceOut.lte(0)) {
    return {
      status: 'unavailable',
      percentage: '',
      isHigh: false,
    };
  }

  const worseDifference = calc.max(
    0,
    calc(1).minus(calc(amountOut).div(referenceOut)),
  );

  return {
    status: worseDifference.gt(0.005) ? 'worse' : 'within',
    percentage: worseDifference.times(100).toFixed(2),
    isHigh: worseDifference.gte(0.1),
  };
};

export const getFormattedReceiveAmount = (receiveAmount: string) =>
  receiveAmount ? formatSwapTokenAmount(receiveAmount) : '';

export const getSwapRate = ({
  payToken,
  receiveToken,
  payAmount,
  receiveAmount,
  isRateInverted,
}: {
  payToken?: SwapToken;
  receiveToken?: SwapToken;
  payAmount: string;
  receiveAmount: string;
  isRateInverted: boolean;
}) => {
  if (!payToken || !receiveToken || !payAmount || !receiveAmount) return '--';

  const value = calc(receiveAmount).div(payAmount);
  if (!value?.isFinite()) return '--';

  const displayValue = isRateInverted ? calc(1).div(value) : value;
  return displayValue.isFinite()
    ? formatSwapTokenAmount(displayValue.toString())
    : '--';
};

export const getFormattedMinimumReceived = (
  minimumReceived: string,
  receiveToken?: SwapToken,
) =>
  minimumReceived && receiveToken
    ? `${formatSwapTokenAmount(minimumReceived, ROUND_MODE.DOWN)} ${receiveToken.symbol}`
    : '--';

export const getSwapCtaStatus = ({
  isLoading,
  isSubmitting,
  needsApproval,
  isInsufficientBalance = false,
  isInsufficientGas = false,
  isHighPriceDifference = false,
  isQuoteUnavailable = false,
}: {
  isLoading: boolean;
  isSubmitting: boolean;
  needsApproval: boolean;
  isInsufficientBalance?: boolean;
  isInsufficientGas?: boolean;
  isHighPriceDifference?: boolean;
  isQuoteUnavailable?: boolean;
}): SwapCtaStatus => {
  if (isLoading) return 'loading';
  if (isInsufficientBalance) return 'insufficient';
  if (isInsufficientGas) return 'insufficient-gas';
  if (isSubmitting) return 'submitting';
  if (isQuoteUnavailable) return 'unavailable';
  if (needsApproval) return 'approve';
  if (isHighPriceDifference) return 'confirm';
  return 'swap';
};
