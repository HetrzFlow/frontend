import BigNumber from 'bignumber.js';
import { SafeNumber } from '../types';

export function bn(value?: BigNumber.Value): BigNumber {
  if (BigNumber.isBigNumber(value)) {
    return value as BigNumber;
  }
  return new BigNumber(value === undefined ? 0 : value);
}

export function decimalsMultiplier(decimals?: BigNumber.Value): BigNumber {
  return bn(10).pow(bn(decimals).abs());
}

export function fromDecimalsAmount(
  amount: SafeNumber,
  decimals: number,
): SafeNumber {
  const mul = decimalsMultiplier(bn(decimals));
  return bn(amount).div(mul).toString(10);
}

export function toDecimalsAmount(
  amount: SafeNumber,
  decimals: number,
): SafeNumber {
  const mul = decimalsMultiplier(bn(decimals));
  return bn(amount).times(mul).toString(10);
}
