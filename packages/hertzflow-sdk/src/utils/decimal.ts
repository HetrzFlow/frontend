import { BigNumber } from 'bignumber.js';

BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: [-64, 64],
});

export default BigNumber;
