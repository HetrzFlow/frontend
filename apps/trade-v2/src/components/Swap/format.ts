import { calc, ROUND_MODE } from '@repo/lib/calc';
import { thoFormat } from '@repo/lib/format';
import type BigNumber from 'bignumber.js';

type NumberValue = string | number;

const MIN_TOKEN_AMOUNT = calc(10).pow(-8);

const formatFixedAmount = (value: NumberValue, round: BigNumber.RoundingMode) =>
  thoFormat(calc(value).toFixed(2, round), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useSubscriptNotation: false,
  });

export const formatSwapTokenAmount = (
  value: NumberValue | undefined,
  round: BigNumber.RoundingMode = ROUND_MODE.ROUND,
) => {
  if (value === undefined || value === '') return '-';

  const amount = calc(value);
  if (!amount.isFinite()) return '-';
  if (amount.isZero()) return '0';
  if (amount.gt(0) && amount.lt(MIN_TOKEN_AMOUNT)) return '<0.00000001';
  if (amount.abs().gte(1)) return formatFixedAmount(value, round);

  const decimalPlaces = Math.min(8, Math.max(0, 3 - (amount.abs().e ?? 0)));
  const rounded = calc(amount.toFixed(decimalPlaces, round));

  if (rounded.abs().gte(1)) return formatFixedAmount(rounded.toString(), round);

  return thoFormat(rounded.toFixed(decimalPlaces), {
    maximumFractionDigits: decimalPlaces,
    stripTrailingZeros: true,
    useSubscriptNotation: false,
  });
};

export const formatSwapUsdAmount = (
  value: NumberValue | undefined,
  showPositiveSign = false,
) => {
  if (value === undefined || value === '') return '-';

  const amount = calc(value);
  if (!amount.isFinite()) return '-';

  const prefix = showPositiveSign && amount.gt(0) ? '+' : '';
  if (amount.isZero()) return '$0.00';
  if (amount.gt(0) && amount.lt(0.01)) return `${prefix}<$0.01`;

  return `${prefix}$${formatFixedAmount(value, ROUND_MODE.ROUND)}`;
};
