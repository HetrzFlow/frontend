import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { calc } from '@repo/lib/calc';
import { unitFormat } from '@repo/lib/format';

export function formatUsdValue(
  value: bigint | string | number | undefined,
  displayDecimals: number,
  fallback = '--',
  options: Parameters<typeof unitFormat>[2] = {},
) {
  if (value === undefined) return fallback;

  const normalizedValue =
    typeof value === 'bigint' ? value.toString(10) : String(value);

  return unitFormat(
    calc(normalizedValue).div(calc(10).pow(USD_DECIMALS)).toString(),
    displayDecimals,
    {
      style: 'currency',
      currency: 'USD',
      showMinDecimalValue: true,
      stripTrailingZeros: true,
      ...options,
    },
  );
}
