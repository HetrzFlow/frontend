import BigNumber from 'bignumber.js';
import { format as dateFormatFn } from 'date-fns';
import { i18n } from '@repo/i18n/client';

import { calc, truncate } from './calc';

export const EMPTY_DISPLAY = '--';
export const EMPTY_DISPLAY_SHORT = '-';

/**
 * is number function. declude Infinity, NaN
 */
export const isNumber = (value: number | string) => {
  return (
    (typeof value === 'number' && Number.isFinite(value)) ||
    (typeof value === 'string' &&
      value !== '' &&
      Number.isFinite(Number(value)))
  );
};

// Unicode subscript digits for compact notation
const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const MIN_SUBSCRIPT_ZERO_COUNT = 4;
const MAX_SUBSCRIPT_NUM = calc(10).pow(-MIN_SUBSCRIPT_ZERO_COUNT);

/**
 * format number
 */
export const thoFormat = (
  value: string | number,
  opt: {
    stripTrailingZeros?: boolean;
    isLessMinDecimalValue?: boolean;
    useSubscriptNotation?: boolean;
  } & Intl.NumberFormatOptions = {},
) => {
  const { useSubscriptNotation = true, ...restOpt } = opt;
  if (restOpt.style === 'currency') {
    restOpt.currencyDisplay = restOpt.currencyDisplay || 'narrowSymbol';
  }

  if (restOpt.minimumFractionDigits === undefined) {
    restOpt.minimumFractionDigits = restOpt.stripTrailingZeros
      ? 0
      : (calc(value).decimalPlaces() ?? undefined);
  }

  if (isNumber(value)) {
    let result = new Intl.NumberFormat(i18n.locale, restOpt).format(+value);

    // Handle subscript notation for small numbers after formatting
    if (calc(value).abs().lt(MAX_SUBSCRIPT_NUM) && useSubscriptNotation) {
      // Use formatToParts to analyze the actual formatted result
      const formatter = new Intl.NumberFormat(i18n.locale, restOpt);
      const parts = formatter.formatToParts(+value);

      // Find the fraction part and check if it has at least 2 leading zeros
      const fractionPart = parts.find((p) => p.type === ('fraction' as string));
      if (fractionPart && fractionPart.value) {
        const fractionValue = fractionPart.value;

        // Count leading zeros in the fraction part
        let leadingZeros = 0;
        let hasNonZeroDigit = false;
        for (const char of fractionValue) {
          if (char === '0') {
            leadingZeros++;
          } else {
            hasNonZeroDigit = true;
            break;
          }
        }

        // Only format if there are at least 3 leading zeros and has non-zero digits
        if (leadingZeros >= MIN_SUBSCRIPT_ZERO_COUNT && hasNonZeroDigit) {
          // Convert leading zeros count to subscript
          const subscript = leadingZeros
            .toString()
            .split('')
            .map((d) => SUBSCRIPT_DIGITS[Number(d)])
            .join('');

          // Get significant digits (remove leading zeros)
          const significantDigits = fractionValue.slice(leadingZeros);

          // Find decimal separator and collect suffix parts
          const decimalPartValue =
            parts.find((p) => p.type === 'decimal')?.value || '.';
          const suffixParts: string[] = [];
          let foundFraction = false;

          for (const part of parts) {
            if (part.type === ('fraction' as string)) {
              foundFraction = true;
            } else if (foundFraction && part.type !== ('fraction' as string)) {
              suffixParts.push(part.value);
            }
          }

          // Replace the decimal part with subscript notation
          if (foundFraction) {
            const suffix = suffixParts.join('');

            result =
              result.slice(0, result.lastIndexOf(decimalPartValue) + 1) +
              '0' +
              subscript +
              significantDigits +
              suffix;
          }
        }
      }
    }

    return opt.isLessMinDecimalValue ? `<${result}` : result;
  }
  return EMPTY_DISPLAY;
};

/**
 * truncate and format
 * @param num number to be formatted
 * @param decimal truncate decimal
 * @param opt.round truncate rounding mode
 * @param opt.stripTrailingZeros whether strip trailing zeros
 * @param opt.showMinDecimalValue whether show `<{minDecimalValue}` when the num is less than min decimal value
 * @param opt.showNegativeZero show -0, when num is 0
 * @returns
 */
export const truncateFormat = (
  num: string | number | BigNumber | undefined,
  decimal?: number,
  opt: {
    round?: BigNumber.RoundingMode;
    stripTrailingZeros?: boolean;
    showMinDecimalValue?: boolean;
    showNegativeZero?: boolean;
  } & Intl.NumberFormatOptions = {},
) => {
  opt = { ...opt };
  if (decimal && opt.maximumFractionDigits === undefined) {
    opt.maximumFractionDigits = decimal;
  }

  if (decimal && opt.minimumFractionDigits === undefined) {
    opt.minimumFractionDigits = decimal;
  }

  if (opt.stripTrailingZeros) {
    opt.minimumFractionDigits = 0;
  }

  let finalNum = num;
  let isLessMinDecimalValue = false;
  if (opt.showMinDecimalValue && decimal && num) {
    finalNum = calc(num);
    if (finalNum.gt(0) && finalNum.lt(calc(10).pow(-decimal))) {
      finalNum = calc(10).pow(-decimal);
      isLessMinDecimalValue = true;
    }
  }

  return thoFormat(
    opt.showNegativeZero && calc(finalNum || '').eq(0) && decimal !== undefined
      ? truncate(calc(-0.1).pow(decimal + 1), decimal)
      : truncate(finalNum ?? '', decimal, opt),
    Object.assign(opt, { isLessMinDecimalValue }),
  );
};

/**
 * percet number format
 */
export const percentFormat = (
  value: string | number | BigNumber,
  decimal = 2,
  opt: {
    round?: BigNumber.RoundingMode;
    stripTrailingZeros?: boolean;
    showMinDecimalValue?: boolean;
    showNegativeZero?: boolean;
  } & Intl.NumberFormatOptions = {},
) => {
  return truncateFormat(value, decimal + 2, {
    style: 'percent',
    minimumFractionDigits: opt.stripTrailingZeros ? 0 : decimal,
    maximumFractionDigits: decimal,
    ...opt,
  });
};

export const formatPercentPoints = (
  value: string | number | BigNumber,
  decimal = 2,
  opt: {
    stripTrailingZeros?: boolean;
    signDisplay?: 'always' | 'auto';
    showMinDecimalValue?: boolean;
  } = {},
) => {
  let finalNum = calc(value);
  if (!finalNum.isFinite()) return EMPTY_DISPLAY;

  let isLessMinDecimalValue = false;
  if (opt.showMinDecimalValue && decimal) {
    if (finalNum.gt(0) && finalNum.lt(calc(10).pow(-decimal))) {
      finalNum = calc(10).pow(-decimal);
      isLessMinDecimalValue = true;
    }
  }

  const truncated = truncate(finalNum, decimal, {
    stripTrailingZeros: opt.stripTrailingZeros ?? true,
  });

  const num = Number(truncated);
  if (!Number.isFinite(num)) return EMPTY_DISPLAY;

  const signDisplay = opt.signDisplay ?? 'auto';
  const zeroDisplay = truncate(calc(0), decimal, {
    stripTrailingZeros: opt.stripTrailingZeros ?? true,
  });
  const body =
    signDisplay === 'always' && !(num < 0)
      ? `+${calc(truncated).isZero() ? zeroDisplay : truncated}`
      : `${truncated}`;
  const core = isLessMinDecimalValue ? `<${body}` : body;
  return `${core}%`;
};

const NUM_UNITS = [
  { min: 0, max: 1000, unit: '' },
  { min: 1000, max: 1e6, unit: 'K' },
  { min: 1e6, max: 1e9, unit: 'M' },
  { min: 1e9, max: Infinity, unit: 'B' },
];

/**
 * unit format (K, M, B)
 */
export const unitFormat = (
  value: string | number | BigNumber,
  decimal: number = 2,
  opt: Intl.NumberFormatOptions & {
    minNumber?: number;
    unitDecimal?: number;
    round?: BigNumber.RoundingMode;
    stripTrailingZeros?: boolean;
    showMinDecimalValue?: boolean;
  } = {},
) => {
  const minNumber = opt.minNumber || 0;
  const unitDecimal = opt.unitDecimal || 2;
  const absNum = calc(value).abs();

  if (absNum.lt(minNumber)) {
    return truncateFormat(value, decimal, opt);
  }

  const { min, unit } =
    NUM_UNITS.find((item) => {
      return absNum.gte(item.min) && absNum.lt(item.max);
    }) || {};

  // no unit
  if (!unit || !min) {
    return truncateFormat(value, decimal, opt);
  }

  // unit
  return `${truncateFormat(calc(value).div(min), unitDecimal, opt)}${unit}`;
};

/**
 * date format
 */
export const dateFormat = (
  value: string | number | Date,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss',
) => {
  const date = new Date(value);
  return isNaN(date.getTime()) ? EMPTY_DISPLAY : dateFormatFn(date, formatStr);
};

const ELLIPSIS = '\u2026';
/**
 * address format
 * @param address
 * @returns string
 */
export function formatAddress(
  address: string,
  { prefixLength = 4, suffixLength = 4 } = {},
) {
  if (address.length <= 6) {
    return address;
  }
  const offset = address.startsWith('0x') ? 2 : 0;
  return `0x${address.slice(offset, offset + prefixLength)}${ELLIPSIS}${address.slice(-suffixLength)}`;
}
