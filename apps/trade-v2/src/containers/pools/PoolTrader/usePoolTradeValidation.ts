import { useMemo } from 'react';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { t } from '@lingui/core/macro';
import { formatUnits, parseUnits } from 'viem';
import { calc } from '@repo/lib/calc';
import { unitFormat } from '@repo/lib/format';
import type { ConnectionStatus } from '@/common/chainClient/hooks';

export enum PoolTradeButtonState {
  NOT_CONNECTED = 'NOT_CONNECTED',
  ENTER_AMOUNT = 'ENTER_AMOUNT',
  PRICE_UNAVAILABLE = 'PRICE_UNAVAILABLE',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ABOVE_DEPOSIT_LIMIT = 'ABOVE_DEPOSIT_LIMIT',
  ABOVE_WITHDRAW_LIMIT = 'ABOVE_WITHDRAW_LIMIT',
  NEED_APPROVE = 'NEED_APPROVE',
  APPROVING = 'APPROVING',
  CALCULATING = 'CALCULATING',
  DEPOSIT_READY = 'DEPOSIT_READY',
  WITHDRAW_READY = 'WITHDRAW_READY',
  DEPOSITING = 'DEPOSITING',
  WITHDRAWING = 'WITHDRAWING',
  POOL_PAUSED = 'POOL_PAUSED',
  PNL_FACTOR_EXCEEDED = 'PNL_FACTOR_EXCEEDED',
  FIRST_DEPOSIT_SPLIT_UNSUPPORTED = 'FIRST_DEPOSIT_SPLIT_UNSUPPORTED',
  BELOW_MIN_DEPOSIT = 'BELOW_MIN_DEPOSIT',
}

export type PoolTradeValidationParams = {
  marketLabel?: string;
  connectionStatus: ConnectionStatus;
  isDeposit: boolean;
  inputValue: string;
  payTokenDecimals: number;
  payTokenSymbol: string;
  buttonTokenSymbol: string;
  walletBalance: bigint;
  inputAmount?: bigint;
  allowance: bigint;
  remainingCapacity?: bigint;
  inputUsdValue?: bigint;
  depositDeltaUsd?: bigint;
  minimumDepositDeltaUsd?: bigint;
  remainingAmountCapacity?: bigint;
  isApproving: boolean;
  isQuoteReady: boolean;
  isApprovalReady: boolean;
  isSubmitReady: boolean;
  isSubmitting: boolean;
  isPaused: boolean | undefined;
  pnlFactorExceeded?: boolean;
  projectedCapacityExceeded?: boolean;
  isFirstDepositSplitUnsupported?: boolean;
  approveText?: string;
};

export type PoolTradeValidationResult = {
  buttonState: PoolTradeButtonState;
  buttonText: string;
  isDisabled: boolean;
  isLoading: boolean;
};

const USD_LIMIT_DISPLAY_DECIMALS = 2;

function formatTokenLimitAmount(value: bigint, decimals: number) {
  return Number(formatUnits(value, decimals)).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
}

function formatUsdLimitAmount(value: bigint) {
  return unitFormat(
    calc(value.toString(10)).div(calc(10).pow(USD_DECIMALS)).toString(),
    USD_LIMIT_DISPLAY_DECIMALS,
    {
      style: 'currency',
      currency: 'USD',
      showMinDecimalValue: true,
      stripTrailingZeros: true,
      minNumber: 100000,
    },
  );
}

export function getPoolTradeValidationResult(
  params: PoolTradeValidationParams,
): PoolTradeValidationResult {
  const {
    marketLabel,
    connectionStatus,
    isDeposit,
    inputValue,
    payTokenDecimals,
    payTokenSymbol,
    buttonTokenSymbol,
    walletBalance,
    inputAmount,
    allowance,
    remainingCapacity,
    inputUsdValue,
    depositDeltaUsd,
    minimumDepositDeltaUsd,
    remainingAmountCapacity,
    isApproving,
    isQuoteReady,
    isApprovalReady,
    isSubmitReady,
    isSubmitting,
    isPaused,
    pnlFactorExceeded,
    projectedCapacityExceeded,
    isFirstDepositSplitUnsupported,
    approveText,
  } = params;

  if (connectionStatus === 'unknown') {
    return {
      buttonState: PoolTradeButtonState.CALCULATING,
      buttonText: t`Finalizing Quote`,
      isDisabled: true,
      isLoading: true,
    };
  }
  if (connectionStatus === 'disconnected') {
    return {
      buttonState: PoolTradeButtonState.NOT_CONNECTED,
      buttonText: t`Connect Wallet`,
      isDisabled: false,
      isLoading: false,
    };
  }

  if (remainingCapacity === undefined) {
    return {
      buttonState: PoolTradeButtonState.CALCULATING,
      buttonText: t`Finalizing Quote`,
      isDisabled: true,
      isLoading: true,
    };
  }

  if (remainingCapacity <= 0n) {
    return {
      buttonState: isDeposit
        ? PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT
        : PoolTradeButtonState.ABOVE_WITHDRAW_LIMIT,
      buttonText: isDeposit ? t`Deposit Cap Reached` : t`Withdraw Cap Reached`,
      isDisabled: true,
      isLoading: false,
    };
  }

  const cleanedValue = inputValue.replace(/[^0-9.]/g, '');
  if (!cleanedValue || cleanedValue === '0' || cleanedValue === '0.00') {
    return {
      buttonState: PoolTradeButtonState.ENTER_AMOUNT,
      buttonText: t`Enter an Amount`,
      isDisabled: true,
      isLoading: false,
    };
  }

  let computedInputAmount = inputAmount ?? 0n;
  if (inputAmount === undefined) {
    try {
      computedInputAmount = parseUnits(cleanedValue, payTokenDecimals);
    } catch {
      computedInputAmount = 0n;
    }
  }

  if (computedInputAmount <= 0n) {
    return {
      buttonState: PoolTradeButtonState.ENTER_AMOUNT,
      buttonText: t`Enter an Amount`,
      isDisabled: true,
      isLoading: false,
    };
  }

  if (isDeposit && isPaused === undefined) {
    return {
      buttonState: PoolTradeButtonState.CALCULATING,
      buttonText: t`Finalizing Quote`,
      isDisabled: true,
      isLoading: true,
    };
  }
  if (isPaused) {
    return {
      buttonState: PoolTradeButtonState.POOL_PAUSED,
      buttonText: t`Pool is Paused`,
      isDisabled: true,
      isLoading: false,
    };
  }
  if (pnlFactorExceeded) {
    return {
      buttonState: PoolTradeButtonState.PNL_FACTOR_EXCEEDED,
      buttonText: isDeposit
        ? t`Deposit temporarily unavailable: trader PnL exceeds pool limit`
        : t`Withdrawal temporarily unavailable: trader PnL exceeds pool limit`,
      isDisabled: true,
      isLoading: false,
    };
  }
  if (inputUsdValue === undefined) {
    return {
      buttonState: PoolTradeButtonState.PRICE_UNAVAILABLE,
      buttonText: t`Price Unavailable`,
      isDisabled: true,
      isLoading: false,
    };
  }
  if (minimumDepositDeltaUsd !== undefined && depositDeltaUsd === undefined) {
    return {
      buttonState: PoolTradeButtonState.PRICE_UNAVAILABLE,
      buttonText: t`Price Unavailable`,
      isDisabled: true,
      isLoading: false,
    };
  }
  if (
    isDeposit &&
    minimumDepositDeltaUsd !== undefined &&
    depositDeltaUsd !== undefined &&
    depositDeltaUsd < minimumDepositDeltaUsd
  ) {
    return {
      buttonState: PoolTradeButtonState.BELOW_MIN_DEPOSIT,
      buttonText: t`Min Net Deposit After Fees 10 USD`,
      isDisabled: true,
      isLoading: false,
    };
  }
  const isAboveAmountCapacity =
    remainingAmountCapacity !== undefined &&
    computedInputAmount > remainingAmountCapacity;

  if (inputUsdValue > remainingCapacity) {
    const capFormatted = formatUsdLimitAmount(remainingCapacity);
    return {
      buttonState: isDeposit
        ? PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT
        : PoolTradeButtonState.ABOVE_WITHDRAW_LIMIT,
      buttonText: isDeposit
        ? t`Above Deposit Limit ${capFormatted}`
        : t`Above Withdraw Limit ${capFormatted}`,
      isDisabled: true,
      isLoading: false,
    };
  }

  if (isAboveAmountCapacity) {
    const capFormatted = formatTokenLimitAmount(
      remainingAmountCapacity,
      payTokenDecimals,
    );
    return {
      buttonState: isDeposit
        ? PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT
        : PoolTradeButtonState.ABOVE_WITHDRAW_LIMIT,
      buttonText: isDeposit
        ? t`Above Deposit Limit ${capFormatted} ${payTokenSymbol}`
        : t`Above Withdraw Limit ${capFormatted} ${payTokenSymbol}`,
      isDisabled: true,
      isLoading: false,
    };
  }
  if (isDeposit && projectedCapacityExceeded) {
    const capFormatted = formatUsdLimitAmount(remainingCapacity);
    return {
      buttonState: PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT,
      buttonText: t`Above Deposit Limit ${capFormatted}`,
      isDisabled: true,
      isLoading: false,
    };
  }
  if (isFirstDepositSplitUnsupported) {
    return {
      buttonState: PoolTradeButtonState.FIRST_DEPOSIT_SPLIT_UNSUPPORTED,
      buttonText: t`First Deposit Cannot Be Split`,
      isDisabled: true,
      isLoading: false,
    };
  }
  if (!isQuoteReady) {
    return {
      buttonState: PoolTradeButtonState.CALCULATING,
      buttonText: t`Finalizing Quote`,
      isDisabled: true,
      isLoading: true,
    };
  }
  if (!isApprovalReady) {
    return {
      buttonState: PoolTradeButtonState.CALCULATING,
      buttonText: t`Preparing Transaction`,
      isDisabled: true,
      isLoading: true,
    };
  }

  const needsApprove = allowance < computedInputAmount;
  if (isSubmitting) {
    return {
      buttonState: isDeposit
        ? PoolTradeButtonState.DEPOSITING
        : PoolTradeButtonState.WITHDRAWING,
      buttonText: isDeposit
        ? t`Depositing ${payTokenSymbol}`
        : t`Withdrawing ${buttonTokenSymbol}`,
      isDisabled: true,
      isLoading: true,
    };
  }
  if (isApproving && needsApprove) {
    return {
      buttonState: PoolTradeButtonState.APPROVING,
      buttonText: t`Approving`,
      isDisabled: true,
      isLoading: true,
    };
  }
  if (computedInputAmount > walletBalance) {
    return {
      buttonState: PoolTradeButtonState.INSUFFICIENT_BALANCE,
      buttonText: t`Insufficient Balance`,
      isDisabled: true,
      isLoading: false,
    };
  }
  if (needsApprove) {
    return {
      buttonState: PoolTradeButtonState.NEED_APPROVE,
      buttonText:
        approveText ??
        (marketLabel
          ? t`Approve HzLP: ${marketLabel} Spending`
          : t`Approve HzLP Spending`),
      isDisabled: false,
      isLoading: false,
    };
  }
  if (!isSubmitReady) {
    return {
      buttonState: PoolTradeButtonState.CALCULATING,
      buttonText: t`Preparing Transaction`,
      isDisabled: true,
      isLoading: true,
    };
  }
  return {
    buttonState: isDeposit
      ? PoolTradeButtonState.DEPOSIT_READY
      : PoolTradeButtonState.WITHDRAW_READY,
    buttonText: isDeposit
      ? t`Deposit ${payTokenSymbol}`
      : t`Withdraw ${buttonTokenSymbol}`,
    isDisabled: false,
    isLoading: false,
  };
}

export const usePoolTradeValidation = (
  params: PoolTradeValidationParams,
): PoolTradeValidationResult => {
  return useMemo(() => {
    return getPoolTradeValidationResult(params);
  }, [params]);
};
