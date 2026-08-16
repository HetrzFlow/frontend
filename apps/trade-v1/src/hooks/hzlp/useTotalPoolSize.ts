import { useMemo } from 'react';
import { unitFormat } from '@repo/lib/format';
import { useGlobalStore, useTvl } from '@/common';

export const useTotalPoolSize = () => {
  const { rawValue, isLoading: isTvlLoading, hasError } = useTvl();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const { formattedValue, isCalculating } = useMemo(() => {
    if (isTvlLoading) {
      return {
        formattedValue: unitFormat('0', usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
          showMinDecimalValue: true,
        }),
        isCalculating: true,
      };
    }

    const formattedValueStr = unitFormat(rawValue, usdAmountDisplayDecimal, {
      style: 'currency',
      currency: 'USD',
      showMinDecimalValue: true,
    });

    return {
      formattedValue: formattedValueStr,
      isCalculating: false,
    };
  }, [rawValue, usdAmountDisplayDecimal, isTvlLoading]);

  return {
    rawValue,
    formattedValue,
    isLoading: isCalculating,
    hasError,
  };
};
