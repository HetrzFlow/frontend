/**
 * @dev HertzFlow API endpoints
 */
export const HERTZFLOW_API_ENDPOINTS = {
  MAINNET:
    process.env.HERTZFLOW_API_MAINNET || 'https://api-mainnet.htzfl.link',
  TESTNET:
    process.env.HERTZFLOW_API_TESTNET || 'https://api-testnet.htzfl.link',
};

/**
 * @dev Contract IDs
 */

const MAINNET_PACKAGE_ID = 'TODO';
const TESTNET_PACKAGE_ID =
  '0xc7cc09be471ed9db9813f63968cdd0272c0365ad3d1fa8bd9c25df5738cef425';
export const ENV_CONFIG = {
  MAINNET: {
    PACKAGE_ID: MAINNET_PACKAGE_ID,
    HZLP_ID: 'TODO',
    HZLP_MANAGER_ID: 'TODO',
    ORACLE_STORE_ID: 'TODO',
    VERSION_ID: 'TODO',
    PROTOCOL_STORE_ID: 'TODO',
    ORACLE_PACKAGE_ID: 'TODO',
    ORACLE_VERSION_ID: 'TODO',
    ORACLE_ID: 'TODO',
    ADMIN_CAP_ID: 'TODO',
    VAULT_ID: 'TODO',
    HZLP_TYPE: 'TODO',

    FAUCET_PACKAGE_ID: 'TODO',
    FAUCET_ADMIN_CAP_ID: 'TODO',
    TOKENS_FAUCETS_ID: 'TODO',
  },
  TESTNET: {
    PACKAGE_ID: TESTNET_PACKAGE_ID,
    HZLP_ID:
      '0x5e37d1d9883c56a5c152faf8f1d8f82f9c902d7a44f2ffc13fc61a5e13ef5344',
    HZLP_MANAGER_ID:
      '0x59eae8172e5c08d71637caf5fd0b6706533e294d3dc4c6e2bbce7cff6aa0b136',
    ORACLE_STORE_ID:
      '0xfc9dbece9a33a30c7b4dcbb1a36830c5d677973f54ce2a73c2869dd1e215fa57',
    VERSION_ID:
      '0xaef290d5da1f5141d27c52e953273af9165359241d5aee2eeb892813e4c1d87b',
    PROTOCOL_STORE_ID:
      '0x5afb6c0a5cf5847efd0f25b110dd366ea6cf0cf304fb4d8a8fcd39b0ea592c7c',
    ADMIN_CAP_ID:
      '0x2c99e4c69e3ac28315791c549b9290c9b3e0b8f60625488b53cb3d4b1a2de0ff',
    VAULT_ID:
      '0x2350b8167e86ab587e2e975160f5b895b87484192125eeea2607c98b103bcc28',
    ORACLE_PACKAGE_ID:
      '0xec6686f51efbfd61cf6d24c24e00c814d61a50e75b635e6464a2fcc752c2c8e4',
    ORACLE_VERSION_ID:
      '0x8b221b00c4d2b1aa837a1036019f5fc503e76e1942eddec97f63b301c9fdd763',
    ORACLE_ID:
      '0x2bd79012f55d97053db075699ec66d2d30815c6fdd671704c12f0459f44a3ae4',

    HZLP_TYPE: `${TESTNET_PACKAGE_ID}::hzlp::HZLP`,

    FAUCET_PACKAGE_ID:
      '0x46105122b84e8e40a8293f4d1b4d570048456b4106dde9e627fe2aa1a9f5311e',
    FAUCET_ADMIN_CAP_ID:
      '0xc43f3a629c4886783026a6b1a17c2e6c81f3859511811929c56a66e034ff8513',
    TOKENS_FAUCETS_ID:
      '0x2cb9c7cdf2ad8b37eb0186ab8cefffbef5e0144f182a6820e825a1f2d59b6411',
  },
};

/**
 * @dev Contract modules
 */
export enum CONTRACT_MODULE {
  VAULT = 'vault',
  ORACLE = 'oracle',
  FEE = 'fee',
  ORDER = 'order',
  FAUCET = 'faucet',
}

/**
 * @dev Contract functions which are available for frontend
 */
export const CONTRACT_FUNCTION = {
  [CONTRACT_MODULE.VAULT]: {
    ADD_LIQUIDITY: 'add_liquidity',
    REMOVE_LIQUIDITY: 'remove_liquidity',
    SWAP: 'swap',
    CREATE_POSITION_REQUEST: 'create_position_request',
    CREATE_INCREASE_ORDER: 'create_increase_order',
    CREATE_DECREASE_ORDER: 'create_decrease_order',
    INCREASE_ORDER: 'increase_order',
    DECREASE_ORDER: 'decrease_order',
    CANCEL_INCREASE_ORDER: 'cancel_increase_order',
    CANCEL_DECREASE_ORDER: 'cancel_decrease_order',
    UPDATE_INCREASE_ORDER: 'update_increase_order',
    UPDATE_DECREASE_ORDER: 'update_decrease_order',
    INCREASE_POSITION_REQUEST: 'increase_position_request',
    DECREASE_POSITION_REQUEST: 'decrease_position_request',
    CANCEL_INCREASE_POSITION: 'cancel_increase_position',
    CANCEL_DECREASE_POSITION: 'cancel_decrease_position',
    GET_ADD_LIQUIDITY_AMOUNT_AND_FEE: 'get_add_liquidity_amount_and_fee',
    GET_REMOVE_LIQUIDITY_AMOUNT_AND_FEE: 'get_remove_liquidity_amount_and_fee',
    GET_LP_PRICE: 'get_lp_price',
    GET_SWAP_AMOUNT_OUT: 'get_swap_amount_out',
    GET_SWAP_AMOUNT_IN: 'get_swap_amount_in',
    GET_SWAP_AMOUNT_IN_V2: 'get_swap_amount_in_v2',
    GET_MAX_SWAP_IN: 'get_max_swap_in',
    GET_ADD_FEE_BPS: 'get_add_fee_bps',
    GET_REMOVE_FEE_BPS: 'get_remove_fee_bps',
  },
  [CONTRACT_MODULE.ORACLE]: {
    UPDATE_PRICE: 'update_price',
  },
  [CONTRACT_MODULE.FEE]: {
    GET_FEE_AMOUNT: 'get_fee_amount',
    GET_FROM_AFTER_FEE_AMOUNT: 'get_from_after_fee_amount',
    GET_POSITION_FEE: 'get_position_fee',
  },
  [CONTRACT_MODULE.ORDER]: {
    GET_ORDER: 'get_order',
    ORDER_KEY: 'order_key',
  },
  [CONTRACT_MODULE.FAUCET]: {
    CLAIM_ALL_TOKENS: 'claim_all_tokens',
    GET_USER_LAST_CLAIM: 'get_user_last_claim',
  },
};

export const COMMON_CONSTS = {
  FEE_BPS_POWER: 10000,
  FEE_RATE_DECIMAL: 10000,
  CLOCK_ID:
    '0x0000000000000000000000000000000000000000000000000000000000000006',
  SUI_TYPE_ARG: '0x2::sui::SUI',
  SUI_TYPE_ARG_LONG:
    '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
  MOCK_COIN_TYPE:
    '0xe02e8f4b0658897fa9bfba5ccb2c21b5e9f1c8fa463e624b13e28a9ca8198885::my_token::MY_TOKEN',
  SUI_PRIVATE_KEY_PREFIX: 'suiprivkey1',

  MIN_COLLATERAL_USD: '100000000000',
};

export enum HERTZFLOW_SUFFIX {
  USD = '/USD',
}

export const MOCK_BTC_TYPE =
  '0x8c73df029cb08f82e064b215b78a3b8996174d9c536074c0bef8504f9f1abf9f::btc::BTC';
export const MOCK_ETH_TYPE =
  '0xcffbb3233da5992a8b336d0ff9de73a56c0332844133992348600d5030cf86d9::eth::ETH';

export const MOCK_USDC_TYPE =
  '0x55e327fc2111a236f26dff6d5f1869645551ef679542220495ad662e0b48e537::usdc::USDC';

export const STABLE_COIN_LIST = [MOCK_USDC_TYPE];
