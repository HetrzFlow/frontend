import { BigNumber } from 'bignumber.js';

export const ZERO = new BigNumber(0);

export const ZERO_STR = '0';

export const ONE = new BigNumber(1);

export const TWO = new BigNumber(2);

export const U128 = TWO.pow(128);

export const U64_MAX = TWO.pow(64).minus(ONE);

export const U128_MAX = TWO.pow(128).minus(ONE);

export const FEE_BPS_POWER = 10000;
export const FUNDING_RATE_PRECISION = 1000000;
export const PRICE_PRECISION_POWER = 20;
export const PRICE_MULTIPLIER_DECIMAL = 10;
export const PRICE_AMPLIFICATION_MULTIPLIER = 10;
export const HZLP_DECIMALS = 6;
export const BORROW_FEE_DECIMALS = 6;
