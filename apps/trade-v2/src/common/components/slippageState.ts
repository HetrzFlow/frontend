export const DEFAULT_SLIPPAGE_OPTIONS = ['0.01', '0.02', '0.03'] as const;
export const SWAP_SLIPPAGE_OPTIONS = ['0.003', '0.005', '0.01'] as const;

export const clampSlippageValue = (value: string | number) =>
  Math.min(0.05, Math.max(0.0001, Number(value)));

export const getSlippageState = (
  value: string | number,
  lowThreshold: string,
  highThreshold?: string,
) => {
  if (value === '') {
    return 'empty';
  }

  const numericValue = Number(value);
  if (
    !Number.isFinite(numericValue) ||
    numericValue < 0.0001 ||
    numericValue > 0.05
  ) {
    return 'invalid';
  }
  if (numericValue < Number(lowThreshold)) {
    return 'low';
  }
  if (highThreshold && numericValue > Number(highThreshold)) {
    return 'high';
  }
  return 'normal';
};
