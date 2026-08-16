import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { calc } from '@repo/lib/calc';
import { getCachedPriceTickerData } from '@/common';

export const priceValidator = ({
  isLong,
  px,
  instId,
}: {
  isLong: boolean;
  px: string;
  instId: string;
}) => {
  const { p: last } = getCachedPriceTickerData(instId)?.[0] || {};
  if (last) {
    // long， px should be less than 1.1 * last
    if (isLong && calc(px).gt(1.1 * +last)) {
      return i18n._(msg`Price too high\n(above 1.1x current)`);
    }

    // short, px should be more than 0.9 * last
    if (!isLong && calc(px).lt(0.9 * +last)) {
      return i18n._(msg`Price too low\n(below 0.9x current)`);
    }
  }
};
