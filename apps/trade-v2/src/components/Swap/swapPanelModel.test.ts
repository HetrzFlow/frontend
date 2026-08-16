import assert from 'node:assert/strict';
import test from 'node:test';

import { i18n } from '@repo/i18n/client';

import {
  createInitialSwapFormState,
  getBnbGasReserve,
  getBnbMaxAmount,
  getFormattedMinimumReceived,
  getFormattedReceiveAmount,
  getSwapCtaStatus,
  getSwapPrice,
  getSwapPriceDifference,
  getSwapPrimaryAction,
  getSwapRate,
  getSwapUsdValue,
  isSwapBalanceInsufficient,
  resolvePayToken,
  resolveMarketReceiveToken,
  shouldAutoExpandSwapDetails,
  swapFormReducer,
  truncateSwapInputAmount,
} from './swapPanelModel';
import {
  BTCB_TOKEN,
  GENESIS_QUICK_SWAP_TOKENS,
  GENESIS_SWAP_TOKENS_BY_SYMBOL,
  QUICK_SWAP_TOKENS,
  USD1_TOKEN,
  USDT_TOKEN,
  U_TOKEN,
  type SwapToken,
} from './useSwapTokens';

test('truncates pay input to token decimals without padding zeros', () => {
  assert.equal(
    truncateSwapInputAmount('1.12312312312345678999', 18),
    '1.123123123123456789',
  );
  assert.equal(
    truncateSwapInputAmount('1.1231231231234566', 18),
    '1.1231231231234566',
  );
  assert.equal(truncateSwapInputAmount('1.9', 0), '1');
});

test('prioritizes wallet connection and empty amount CTA states', () => {
  assert.equal(getSwapPrimaryAction(false, ''), 'connect-wallet');
  assert.equal(getSwapPrimaryAction(false, '1'), 'connect-wallet');
  assert.equal(getSwapPrimaryAction(true, ''), 'enter-amount');
  assert.equal(getSwapPrimaryAction(true, '0'), 'enter-amount');
  assert.equal(getSwapPrimaryAction(true, '0.000'), 'enter-amount');
  assert.equal(getSwapPrimaryAction(true, '1'), 'swap');
});

test('auto-expands swap details only after a valid input has quote data', () => {
  assert.equal(shouldAutoExpandSwapDetails('', ''), false);
  assert.equal(shouldAutoExpandSwapDetails('1', ''), false);
  assert.equal(shouldAutoExpandSwapDetails('0', '1'), false);
  assert.equal(shouldAutoExpandSwapDetails('1', '0.5'), true);
});

test('detects an insufficient pay-token balance', () => {
  assert.equal(isSwapBalanceInsufficient('', '0'), false);
  assert.equal(isSwapBalanceInsufficient('12', '0'), true);
  assert.equal(isSwapBalanceInsufficient('1', '1'), false);
  assert.equal(isSwapBalanceInsufficient('1.000001', '1'), true);
});

i18n.loadAndActivate({ locale: 'en', messages: {} });

const token = (symbol: string, address: string, price = ''): SwapToken => ({
  chainId: 56,
  address,
  name: symbol,
  symbol,
  decimals: 18,
  logoURI: '',
  price,
});

const usdt = token('USDT', '0x1', '1');
const pay = token('PAY', '0x2', '2');
const alternate = token('ALT', '0x3', '4');

test('resolves BTCB by default and keeps an explicit selection', () => {
  assert.equal(resolvePayToken(usdt)?.symbol, 'BTC');
  assert.equal(resolvePayToken(usdt, alternate), alternate);
  assert.equal(resolvePayToken(BTCB_TOKEN), USDT_TOKEN);
});

test('maps a unique market token and falls back to USDT', () => {
  assert.equal(
    resolveMarketReceiveToken('ETH', QUICK_SWAP_TOKENS).symbol,
    'ETH',
  );
  assert.equal(
    resolveMarketReceiveToken('BTC', QUICK_SWAP_TOKENS),
    BTCB_TOKEN,
  );
  assert.equal(
    resolveMarketReceiveToken('UNKNOWN', QUICK_SWAP_TOKENS),
    USDT_TOKEN,
  );
  assert.equal(
    resolveMarketReceiveToken('ALT', [alternate, token('ALT', '0x4')]),
    USDT_TOKEN,
  );
});

test('puts official Genesis tokens first and resolves each vault asset', () => {
  assert.deepEqual(GENESIS_QUICK_SWAP_TOKENS.slice(0, 2), [
    USD1_TOKEN,
    U_TOKEN,
  ]);
  assert.equal(
    USD1_TOKEN.address,
    '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d',
  );
  assert.equal(
    U_TOKEN.address,
    '0xce24439f2d9c6a2289f741120fe202248b666666',
  );
  assert.equal(
    resolveMarketReceiveToken('USD1', GENESIS_QUICK_SWAP_TOKENS),
    USD1_TOKEN,
  );
  assert.equal(
    resolveMarketReceiveToken('U', GENESIS_QUICK_SWAP_TOKENS),
    U_TOKEN,
  );
  assert.equal(GENESIS_SWAP_TOKENS_BY_SYMBOL.USD1, USD1_TOKEN);
  assert.equal(GENESIS_SWAP_TOKENS_BY_SYMBOL.U, U_TOKEN);
  assert.equal(GENESIS_SWAP_TOKENS_BY_SYMBOL.USDT, USDT_TOKEN);
});

test('first input locks the current default token and success clears amount', () => {
  const initial = createInitialSwapFormState(usdt);
  const entered = swapFormReducer(initial, {
    type: 'pay-amount-changed',
    value: '12.3',
    currentPayToken: pay,
  });

  assert.equal(entered.selectedPayToken, pay);
  assert.equal(entered.payAmount, '12.3');
  const reset = swapFormReducer(entered, {
    type: 'reset',
    receiveToken: alternate,
  });
  assert.equal(reset.payAmount, '');
  assert.equal(reset.receiveToken, alternate);
  assert.equal(reset.isPairTouched, false);
});

test('syncs market receive only before the user touches the pair', () => {
  const initial = createInitialSwapFormState(usdt);
  const synced = swapFormReducer(initial, {
    type: 'sync-default-receive',
    token: alternate,
  });
  assert.equal(synced.receiveToken, alternate);

  const entered = swapFormReducer(synced, {
    type: 'pay-amount-changed',
    value: '1',
    currentPayToken: pay,
  });
  assert.equal(
    swapFormReducer(entered, {
      type: 'sync-default-receive',
      token: usdt,
    }).receiveToken,
    alternate,
  );
});

test('reserves the greater of 1.5x estimated gas and 0.001 BNB', () => {
  assert.equal(getBnbGasReserve(), 1_000_000_000_000_000n);
  assert.equal(
    getBnbGasReserve(100_000n, 10_000_000_000n),
    1_500_000_000_000_000n,
  );
  assert.equal(getBnbMaxAmount({ balance: '1' }), '0.999');
  assert.equal(getBnbMaxAmount({ balance: '0.001' }), '0');
});

test('selecting a conflicting pay or receive token swaps the other side', () => {
  const state = {
    ...createInitialSwapFormState(usdt),
    selectedPayToken: pay,
    payAmount: '1',
  };
  const selectedPay = swapFormReducer(state, {
    type: 'pay-token-selected',
    token: usdt,
    currentPayToken: pay,
  });

  assert.equal(selectedPay.selectedPayToken, usdt);
  assert.equal(selectedPay.receiveToken, pay);
  assert.equal(selectedPay.payAmount, '');

  const selectedReceive = swapFormReducer(state, {
    type: 'receive-token-selected',
    token: pay,
    currentPayToken: pay,
  });
  assert.equal(selectedReceive.selectedPayToken, usdt);
  assert.equal(selectedReceive.receiveToken, pay);
});

test('selecting a different token keeps the opposite side unchanged', () => {
  const state = {
    ...createInitialSwapFormState(usdt),
    selectedPayToken: pay,
    payAmount: '1',
  };
  const selected = swapFormReducer(state, {
    type: 'pay-token-selected',
    token: alternate,
    currentPayToken: pay,
  });

  assert.equal(selected.selectedPayToken, alternate);
  assert.equal(selected.receiveToken, usdt);
  assert.equal(selected.payAmount, '');
});

test('reversing swaps tokens, clears amount, and resets rate direction', () => {
  const reversed = swapFormReducer(
    {
      ...createInitialSwapFormState(usdt),
      selectedPayToken: pay,
      payAmount: '1',
      isRateInverted: true,
    },
    { type: 'reverse', currentPayToken: pay },
  );

  assert.equal(reversed.selectedPayToken, usdt);
  assert.equal(reversed.receiveToken, pay);
  assert.equal(reversed.payAmount, '');
  assert.equal(reversed.isRateInverted, false);
});

test('formats rate, USD values, receive amount, and minimum received', () => {
  assert.equal(getSwapUsdValue('', '2'), '$0.00');
  assert.equal(getSwapUsdValue('2', '2'), '$4.00');
  assert.equal(getSwapUsdValue('2'), '-');
  assert.equal(getFormattedReceiveAmount('0.00643300'), '0.006433');
  assert.equal(getFormattedMinimumReceived('1.239', usdt), '1.23 USDT');
  assert.equal(
    getSwapRate({
      payToken: pay,
      receiveToken: usdt,
      payAmount: '',
      receiveAmount: '',
      isRateInverted: false,
    }),
    '--',
  );
  assert.equal(
    getSwapRate({
      payToken: pay,
      receiveToken: usdt,
      payAmount: '2',
      receiveAmount: '8',
      isRateInverted: true,
    }),
    '0.25',
  );
});

test('derives Pyth price difference states and thresholds', () => {
  const price = (
    value: string,
    status: 'normal' | 'market_closed' | 'no_feed' = 'normal',
  ) => ({
    address: '0x1',
    price: value,
    publishTime: 1,
    status,
  });

  assert.deepEqual(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '0.995',
      priceIn: price('1'),
      priceOut: price('1'),
    }),
    {
      status: 'within',
      percentage: '0.50',
      isHigh: false,
    },
  );
  assert.deepEqual(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '0.994999',
      priceIn: price('1'),
      priceOut: price('1'),
    }),
    {
      status: 'worse',
      percentage: '0.50',
      isHigh: false,
    },
  );
  assert.deepEqual(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '0.90004',
      priceIn: price('1'),
      priceOut: price('1'),
    }),
    {
      status: 'worse',
      percentage: '10.00',
      isHigh: false,
    },
  );
  assert.deepEqual(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '0.994',
      priceIn: price('1'),
      priceOut: price('1'),
    }),
    {
      status: 'worse',
      percentage: '0.60',
      isHigh: false,
    },
  );
  assert.deepEqual(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '0.9',
      priceIn: price('1'),
      priceOut: price('1'),
    }),
    {
      status: 'worse',
      percentage: '10.00',
      isHigh: true,
    },
  );
  assert.equal(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '1',
      priceIn: price('', 'market_closed'),
      priceOut: price('1'),
    }).status,
    'market-closed',
  );
  assert.equal(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '1',
      priceIn: price('', 'no_feed'),
      priceOut: price('1'),
    }).status,
    'unavailable',
  );
  assert.equal(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '1',
      priceIn: price('', 'market_closed'),
      priceOut: price('', 'no_feed'),
    }).status,
    'unavailable',
  );

  assert.deepEqual(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '1.2',
      priceIn: price('1'),
      priceOut: price('1'),
    }),
    {
      status: 'within',
      percentage: '0.00',
      isHigh: false,
    },
  );
  assert.deepEqual(
    getSwapPriceDifference({
      amountIn: '1',
      amountOut: '2.01',
      priceIn: price('1'),
      priceOut: price('1'),
    }),
    {
      status: 'within',
      percentage: '0.00',
      isHigh: false,
    },
  );
});

test('preserves the Pyth no-feed state instead of substituting token price', () => {
  assert.deepEqual(
    getSwapPrice(
      [
        {
          address: pay.address,
          price: '',
          publishTime: 0,
          status: 'no_feed',
        },
      ],
      pay,
    ),
    {
      address: pay.address,
      price: '',
      publishTime: 0,
      status: 'no_feed',
    },
  );
});

test('prioritizes quote loading before balance errors', () => {
  assert.equal(
    getSwapCtaStatus({
      isLoading: true,
      isSubmitting: false,
      needsApproval: false,
      isInsufficientBalance: true,
    }),
    'loading',
  );
  assert.equal(
    getSwapCtaStatus({
      isLoading: true,
      isSubmitting: true,
      needsApproval: true,
    }),
    'loading',
  );
  assert.equal(
    getSwapCtaStatus({
      isLoading: false,
      isSubmitting: true,
      needsApproval: true,
    }),
    'submitting',
  );
  assert.equal(
    getSwapCtaStatus({
      isLoading: false,
      isSubmitting: false,
      needsApproval: true,
    }),
    'approve',
  );
  assert.equal(
    getSwapCtaStatus({
      isLoading: false,
      isSubmitting: false,
      needsApproval: false,
      isHighPriceDifference: true,
    }),
    'confirm',
  );
  assert.equal(
    getSwapCtaStatus({
      isLoading: false,
      isSubmitting: false,
      needsApproval: false,
      isQuoteUnavailable: true,
    }),
    'unavailable',
  );
});
