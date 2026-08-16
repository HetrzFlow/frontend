import { msg } from '@lingui/core/macro';
import type { I18n, MessageDescriptor } from '@lingui/core';

export const translateSwapMessage = (
  i18n: I18n,
  descriptor: MessageDescriptor,
  values: Record<string, string | number>,
) => i18n._(descriptor.id, values, { message: descriptor.message });

export const swapMessages = {
  routeStreams: msg({ message: '{n} Streams' }),
  addFavorite: msg({ message: 'Add {symbol} to favorites' }),
  removeFavorite: msg({ message: 'Remove {symbol} from favorites' }),
  swapSlippage: msg({ message: 'Swap Slippage', context: 'Swap' }),
  minCollateral: msg({ message: 'Min. Collateral', context: 'Swap' }),
  connectWallet: msg({ message: 'Connect Wallet', context: 'Swap' }),
  enterAmount: msg({ message: 'Enter an Amount', context: 'Swap' }),
  insufficientToken: msg({
    message: 'Insufficient {token}',
    context: 'Swap',
  }),
  insufficientBnb: msg({ message: 'Insufficient BNB', context: 'Swap' }),
  approving: msg({ message: 'Approving…', context: 'Swap' }),
  creatingOrder: msg({ message: 'Creating order', context: 'Swap' }),
  swapAndLong: msg({ message: 'Swap & Long {market}', context: 'Swap' }),
  swapAndShort: msg({ message: 'Swap & Short {market}', context: 'Swap' }),
  withinDifference: msg({
    message: 'Within {difference}%',
    context: 'Swap',
  }),
  worseThanPyth: msg({
    message: '{difference}% worse than Pyth',
    context: 'Swap',
  }),
  highPriceDifferenceDescription: msg({
    message:
      'The exchange rate for this swap differs from the market price by {difference}%. Please review the rate before confirming.',
    context: 'Swap',
  }),
  confirmSwap: msg({ message: 'Confirm Swap', context: 'Swap' }),
  referenceMarketClosed: msg({
    message:
      'The reference market is currently closed. Price comparison resumes when it reopens; your swap is not affected.',
    context: 'Swap',
  }),
  maxSlippage: msg({ message: 'Max Slippage', context: 'Swap' }),
  custom: msg({ message: 'Custom', context: 'Swap' }),
  done: msg({ message: 'Done', context: 'Swap' }),
  lowSlippageWarning: msg({
    message:
      'Low slippage may cause the swap to fail while still incurring gas fees.',
    context: 'Swap',
  }),
  highSlippageWarning: msg({
    message:
      'High slippage may result in an unfavorable execution price or increase exposure to MEV.',
    context: 'Swap',
  }),
  viaProvider: msg({ message: 'via {provider}', context: 'Swap' }),
  unknownDex: msg({ message: 'Unknown DEX', context: 'Swap' }),
  swapSuccessful: msg({ message: 'Swap successful', context: 'Swap' }),
  swapTransactionSummary: msg({
    message: 'Swap {payAmount} {payToken} for {receiveAmount} {receiveToken}',
    context: 'Swap transaction toast',
  }),
  orderRequestSent: msg({
    message: 'Order request sent',
    context: 'Swap transaction toast',
  }),
  viewTransaction: msg({
    message: 'View transaction',
    context: 'Swap transaction toast',
  }),
  swappingTokens: msg({
    message: 'Swapping {payToken} for {receiveToken}',
    context: 'Swap',
  }),
  approvalRejected: msg({ message: 'Approval rejected.', context: 'Swap' }),
  approvalFailed: msg({
    message: 'Approval failed. Please try again.',
    context: 'Swap',
  }),
  signatureRejected: msg({
    message: 'Signature request rejected.',
    context: 'Swap',
  }),
  slippageFailure: msg({
    message:
      'Swap failed: Slippage limit exceeded. Your tokens were not swapped, but gas fees were incurred.',
    context: 'Swap',
  }),
  outOfGasFailure: msg({
    message:
      'Swap failed: Transaction ran out of gas. Your tokens were not swapped, but gas fees were incurred.',
    context: 'Swap',
  }),
  swapFailed: msg({
    message: 'Swap failed. Please try again.',
    context: 'Swap',
  }),
  quoteUnavailable: msg({ message: 'Quote unavailable' }),
  paid: msg({ message: 'Paid', context: 'Swap history' }),
  received: msg({ message: 'Received', context: 'Swap history' }),
};
