import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPoolTradeValidationResult,
  PoolTradeButtonState,
  type PoolTradeValidationParams,
} from './usePoolTradeValidation';

const USDT_DECIMALS = 6;
const USD_DECIMALS = 30;
const USD_SCALE = 10n ** BigInt(USD_DECIMALS);

const baseParams: PoolTradeValidationParams = {
  connectionStatus: 'connected',
  isDeposit: true,
  inputValue: '',
  payTokenDecimals: USDT_DECIMALS,
  payTokenSymbol: 'USDT',
  buttonTokenSymbol: 'USDT',
  walletBalance: 1_000_000n * 10n ** BigInt(USDT_DECIMALS),
  allowance: 1_000_000n * 10n ** BigInt(USDT_DECIMALS),
  remainingCapacity: 0n,
  inputUsdValue: 0n,
  isApproving: false,
  isQuoteReady: false,
  isApprovalReady: true,
  isSubmitReady: false,
  isSubmitting: false,
  isPaused: false,
};

test('empty input keeps loading while capacity is unavailable', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    remainingCapacity: undefined,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.CALCULATING);
  assert.equal(result.buttonText, 'Finalizing Quote');
  assert.equal(result.isDisabled, true);
  assert.equal(result.isLoading, true);
});

test('empty deposit input with zero capacity shows deposit cap reached', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '',
    remainingCapacity: 0n,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT);
  assert.equal(result.buttonText, 'Deposit Cap Reached');
  assert.equal(result.isDisabled, true);
});

test('positive deposit input with zero capacity shows deposit cap reached', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '1',
    inputAmount: 1n * 10n ** BigInt(USDT_DECIMALS),
    inputUsdValue: 1n * USD_SCALE,
    remainingCapacity: 0n,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT);
  assert.equal(result.buttonText, 'Deposit Cap Reached');
  assert.equal(result.isDisabled, true);
});

test('withdraw input with zero capacity shows withdraw cap reached', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    isDeposit: false,
    inputValue: '',
    remainingCapacity: 0n,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.ABOVE_WITHDRAW_LIMIT);
  assert.equal(result.buttonText, 'Withdraw Cap Reached');
  assert.equal(result.isDisabled, true);
});

test('usd limit copy wins when usd and token amount are both exceeded', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '110',
    inputAmount: 110n * 10n ** BigInt(USDT_DECIMALS),
    inputUsdValue: 110n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    remainingAmountCapacity: 105n * 10n ** BigInt(USDT_DECIMALS),
    isQuoteReady: true,
    isSubmitReady: true,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT);
  assert.equal(result.buttonText, 'Above Deposit Limit $100');
});

test('withdraw usd limit copy uses remaining capacity', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    isDeposit: false,
    inputValue: '110',
    inputAmount: 110n * 10n ** BigInt(USDT_DECIMALS),
    inputUsdValue: 110n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    isQuoteReady: true,
    isSubmitReady: true,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.ABOVE_WITHDRAW_LIMIT);
  assert.equal(result.buttonText, 'Above Withdraw Limit $100');
});

test('projected vault market cap overflow shows usd deposit limit copy', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '90',
    inputAmount: 90n * 10n ** BigInt(USDT_DECIMALS),
    inputUsdValue: 90n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    projectedCapacityExceeded: true,
    isQuoteReady: true,
    isSubmitReady: true,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT);
  assert.equal(result.buttonText, 'Above Deposit Limit $100');
});

test('conservative token cap copy wins before projected usd cap copy', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '90',
    inputAmount: 90n * 10n ** BigInt(USDT_DECIMALS),
    inputUsdValue: 90n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    remainingAmountCapacity: 80n * 10n ** BigInt(USDT_DECIMALS),
    projectedCapacityExceeded: true,
    isQuoteReady: true,
    isSubmitReady: true,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT);
  assert.equal(result.buttonText, 'Above Deposit Limit 80 USDT');
});

test('unsupported split first deposit is disabled without loading', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '1',
    inputAmount: 1n * 10n ** BigInt(USDT_DECIMALS),
    inputUsdValue: 1n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    isFirstDepositSplitUnsupported: true,
    isQuoteReady: true,
    isSubmitReady: false,
  });

  assert.equal(
    result.buttonState,
    PoolTradeButtonState.FIRST_DEPOSIT_SPLIT_UNSUPPORTED,
  );
  assert.equal(result.buttonText, 'First Deposit Cannot Be Split');
  assert.equal(result.isDisabled, true);
  assert.equal(result.isLoading, false);
});

test('approval is available while transaction parameters are still loading', () => {
  const inputAmount = 10n * 10n ** BigInt(USDT_DECIMALS);
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '10',
    inputAmount,
    inputUsdValue: 10n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    allowance: 0n,
    isQuoteReady: true,
    isSubmitReady: false,
    approveText: 'Approve USDT Spending',
  });

  assert.equal(result.buttonState, PoolTradeButtonState.NEED_APPROVE);
  assert.equal(result.buttonText, 'Approve USDT Spending');
  assert.equal(result.isDisabled, false);
  assert.equal(result.isLoading, false);
});

test('approved trade reports transaction preparation separately from quote', () => {
  const inputAmount = 10n * 10n ** BigInt(USDT_DECIMALS);
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '10',
    inputAmount,
    inputUsdValue: 10n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    allowance: inputAmount,
    isQuoteReady: true,
    isSubmitReady: false,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.CALCULATING);
  assert.equal(result.buttonText, 'Preparing Transaction');
  assert.equal(result.isDisabled, true);
  assert.equal(result.isLoading, true);
});

test('predeposit blocks deposits below the minimum deposit delta', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '9',
    inputAmount: 9n * 10n ** BigInt(USDT_DECIMALS),
    inputUsdValue: 9n * USD_SCALE,
    depositDeltaUsd: 9n * USD_SCALE,
    minimumDepositDeltaUsd: 10n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    isQuoteReady: true,
    isSubmitReady: true,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.BELOW_MIN_DEPOSIT);
  assert.equal(result.buttonText, 'Min Net Deposit After Fees 10 USD');
  assert.equal(result.isDisabled, true);
  assert.equal(result.isLoading, false);
});

test('predeposit allows a deposit at the minimum deposit delta', () => {
  const result = getPoolTradeValidationResult({
    ...baseParams,
    inputValue: '10',
    inputAmount: 10n * 10n ** BigInt(USDT_DECIMALS),
    inputUsdValue: 10n * USD_SCALE,
    depositDeltaUsd: 10n * USD_SCALE,
    minimumDepositDeltaUsd: 10n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    isQuoteReady: true,
    isSubmitReady: true,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.DEPOSIT_READY);
  assert.equal(result.isDisabled, false);
});

test('withdraw button uses the underlying token symbol', () => {
  const inputAmount = 10n * 10n ** BigInt(USDT_DECIMALS);
  const result = getPoolTradeValidationResult({
    ...baseParams,
    isDeposit: false,
    payTokenSymbol: 'HzLP',
    buttonTokenSymbol: 'USDT',
    inputValue: '10',
    inputAmount,
    inputUsdValue: 10n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    isQuoteReady: true,
    isSubmitReady: true,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.WITHDRAW_READY);
  assert.equal(result.buttonText, 'Withdraw USDT');
});

test('withdrawing button uses the underlying token symbol', () => {
  const inputAmount = 10n * 10n ** BigInt(USDT_DECIMALS);
  const result = getPoolTradeValidationResult({
    ...baseParams,
    isDeposit: false,
    payTokenSymbol: 'HzV',
    buttonTokenSymbol: 'USDC',
    inputValue: '10',
    inputAmount,
    inputUsdValue: 10n * USD_SCALE,
    remainingCapacity: 100n * USD_SCALE,
    isQuoteReady: true,
    isApprovalReady: true,
    isSubmitReady: true,
    isSubmitting: true,
  });

  assert.equal(result.buttonState, PoolTradeButtonState.WITHDRAWING);
  assert.equal(result.buttonText, 'Withdrawing USDC');
});
