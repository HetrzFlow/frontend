import { calc } from '@repo/lib/calc';

export const isTpSlValueSet = (value?: string) => {
  if (!value?.trim()) return false;

  const valueBN = calc(value);
  return !valueBN.isNaN() && !valueBN.eq(0);
};

export const getActiveTpSlValue = (value?: string) =>
  isTpSlValueSet(value) ? value : '';
