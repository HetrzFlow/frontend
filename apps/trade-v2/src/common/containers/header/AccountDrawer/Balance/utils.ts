import { EMPTY_DISPLAY_SHORT, unitFormat } from '@repo/lib/format';

export const formatUsd = (value: string | undefined) => {
  if (value === undefined) return EMPTY_DISPLAY_SHORT;
  return unitFormat(value, 2, {
    minNumber: 1000000,
    showMinDecimalValue: true,
    stripTrailingZeros: true,
    style: 'currency',
    currency: 'USD',
  });
};
