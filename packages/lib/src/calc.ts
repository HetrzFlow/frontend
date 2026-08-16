import { BigNumber } from 'bignumber.js';

export const ROUND_MODE = {
  UP: BigNumber.ROUND_UP,
  DOWN: BigNumber.ROUND_DOWN,
  ROUND: BigNumber.ROUND_HALF_UP,
};

/**
 * calc decimal
 */
export const calcDecimal = (num: string | number | BigNumber) => {
  const numObj = BigNumber(num);
  // max decimal is 30
  const index = new Array(15)
    .fill(1)
    .findIndex((_, i) => numObj.gt(Math.pow(10, -i * 2)));
  return (index + 1) * 2 || 30;
};

/**
 * truncate
 */
export const truncate = (
  num: string | number | BigNumber,
  decimal?: number,
  {
    round = ROUND_MODE.DOWN,
    stripTrailingZeros = true,
  }: {
    round?: BigNumber.RoundingMode;
    stripTrailingZeros?: boolean;
  } = {},
) => {
  const numObj = calc(num);

  let finalDecimal;
  // calc decimal
  if (decimal === undefined) {
    finalDecimal = calcDecimal(numObj);
  } else {
    finalDecimal = decimal;
  }

  const result = numObj.toFixed(finalDecimal, round);
  return stripTrailingZeros
    ? result.replace(/(\.\d*?[1-9])0+$/g, '$1').replace(/\.0+$/, '')
    : result;
};

BigNumber.set({
  DECIMAL_PLACES: 30,
});

export const calc = BigNumber;

export type BN = BigNumber;
