export const TEST_CONFIG = {
  TIMEOUT: 60000,
  INTEGRATION_TIMEOUT: 120000,
} as const;

export const TOKEN_CONSTANTS = {
  SUI: {
    TYPE: '0x2::sui::SUI',
    DECIMALS: 9,
    SYMBOL: 'SUI',
    PRICE_USD: '4.0',
  },
  BTC: {
    DECIMALS: 8,
    SYMBOL: 'BTC',
    PRICE_USD: '43000.0',
  },
} as const;

export const TEST_AMOUNTS = {
  ADD_LIQUIDITY: {
    SMALL: '0.0001',
    MEDIUM: '0.001',
    LARGE: '0.01',
    VERY_LARGE: '1000',
  },

  REMOVE_LIQUIDITY: {
    SMALL: '0.1',
    MEDIUM: '1',
    LARGE: '10',
  },

  SWAP: {
    TINY: '0.00005',
    SMALL: '0.0001',
    MEDIUM: '0.001',
    LARGE: '0.01',
  },

  POSITION: {
    SMALL: '0.001',
    MEDIUM: '0.01',
    LARGE: '0.1',
  },

  BTC: {
    TINY: '0.00001',
    SMALL: '0.0001',
    MEDIUM: '0.001',
  },

  INCREASE_ORDER: {
    SMALL: '0.001',
    MEDIUM: '0.01',
    LARGE: '0.1',
  },
} as const;

export const SLIPPAGE_VALUES = {
  VERY_LOW: 0.005,
  LOW: 0.01,
  MEDIUM: 0.02,
  HIGH: 0.05,
  VERY_HIGH: 0.1,
} as const;

export const LEVERAGE_VALUES = {
  MIN: 1,
  LOW: 2,
  MEDIUM: 5,
  HIGH: 10,
  MAX: 50,
} as const;

export const TEST_SCENARIOS = {
  SLIPPAGE_CASES: [
    { slippage: SLIPPAGE_VALUES.VERY_LOW, description: '0.5% ' },
    { slippage: SLIPPAGE_VALUES.LOW, description: '1% ' },
    { slippage: SLIPPAGE_VALUES.MEDIUM, description: '2% ' },
    { slippage: SLIPPAGE_VALUES.HIGH, description: '5% ' },
  ],

  AMOUNT_CASES_STATIC: [
    { amount: TEST_AMOUNTS.SWAP.SMALL, description: '0.0001 SUI ()' },
    { amount: TEST_AMOUNTS.SWAP.MEDIUM, description: '0.001 SUI ()' },
  ],

  AMOUNT_CASES: [
    { amount: TEST_AMOUNTS.SWAP.SMALL, description: '0.0001 SUI ()' },
    { amount: TEST_AMOUNTS.SWAP.MEDIUM, description: '0.001 SUI ()' },
    { amount: TEST_AMOUNTS.SWAP.LARGE, description: '0.01 SUI ()' },
  ],

  LEVERAGE_CASES: [
    LEVERAGE_VALUES.MIN,
    LEVERAGE_VALUES.LOW,
    LEVERAGE_VALUES.MEDIUM,
    LEVERAGE_VALUES.HIGH,
  ],

  BTC_AMOUNT_CASES: [
    TEST_AMOUNTS.BTC.TINY,
    TEST_AMOUNTS.BTC.SMALL,
    TEST_AMOUNTS.BTC.MEDIUM,
  ],
} as const;

export const EXPECTED_ERRORS = {
  BALANCE: [
    'Insufficient balance',
    'InsufficientBalance',
    'insufficient funds',
    'balance',
  ],

  LIQUIDITY: [
    'bag_balance_withdraw',
    '13906834406271614977',
    'increase_pool_amount',
    '13906835406999781389',
  ],

  CONTRACT_BUSINESS: [
    'Insufficient pool amount',
    'Request Already Exists',
    'Request Expired',
    'Increase Position Price Not Met',
    'Decrease Position Price Not Met',
    'Exceeded max global short size',
    'Exceeded max global long size',
    'Invalid Swap Same Token',
    'Position Not Found',
    'EExceedsMaxUsdAmount',
  ],

  SWAP_LIMITS: [
    'exceeds max swap in',
    'max_swap_in',
    'pool has no available liquidity',
    'input pool reached max USD limit',
  ],

  ADD_LIQUIDITY_LIMITS: [
    'EExceedsMaxUsdAmount',
    'exceeds max usd amount',
    'pool reached max USD limit',
    'max_usd_amount',
  ],

  POSITION_LIMITS: [
    'exceeds max swap in',
    'position size too large',
    'insufficient collateral',
    'max leverage exceeded',
  ],
} as const;

export const LIMIT_CHECK_CONFIG = {
  SWAP: {
    ZERO_MAX_INPUT_REASONS: [
      ' ()  (pool_amount <= reserved_amount)',
      ' ()  USD  (max_usd_amount)',
      ' swap ',
      '',
    ],

    SAFETY_MARGIN: 0.8,

    MIN_TEST_AMOUNT_THRESHOLD: 0.00001,
  },

  ADD_LIQUIDITY: {
    MAX_USD_LIMIT_REASONS: [' USD  (max_usd_amount)', ' USD  + ', '', ''],

    SAFETY_MARGIN: 0.9,

    MIN_TEST_AMOUNT_THRESHOLD: 0.0001,
  },

  POSITION: {
    FAILURE_REASONS: [' swap， swap ', '', '', ''],

    SAFETY_MARGIN: 0.8,

    MIN_TEST_AMOUNT_THRESHOLD: 0.0001,
  },

  COMMON: {
    ENABLE_LIMIT_CHECK_BY_DEFAULT: true,

    THROW_ON_LIMIT_EXCEEDED: true,
  },
} as const;

export const SWAP_LIMIT_CONFIG = LIMIT_CHECK_CONFIG.SWAP;

export const GAS_BUDGET = {
  LOW: 50000000,
  MEDIUM: 100000000,
  HIGH: 200000000,
} as const;

export const TYPE_ARGUMENTS = {
  ADD_LIQUIDITY_SUI: [TOKEN_CONSTANTS.SUI.TYPE] as [string],

  REMOVE_LIQUIDITY_SUI: [TOKEN_CONSTANTS.SUI.TYPE] as [string],

  SWAP_SUI_TO_BTC: (btcType: string) =>
    [TOKEN_CONSTANTS.SUI.TYPE, btcType] as [string, string],

  POSITION_SUI_BTC: (btcType: string) =>
    [TOKEN_CONSTANTS.SUI.TYPE, btcType, btcType] as [string, string, string],

  INCREASE_ORDER_SUI: [TOKEN_CONSTANTS.SUI.TYPE, TOKEN_CONSTANTS.SUI.TYPE] as [
    string,
    string,
  ],
  INCREASE_ORDER_BTC: (btcType: string) =>
    [btcType, btcType] as [string, string],
} as const;
