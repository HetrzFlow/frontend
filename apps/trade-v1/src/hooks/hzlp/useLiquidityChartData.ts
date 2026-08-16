import { useMemo } from 'react';
import { fromDecimalsAmount } from '@hertzflow/sdk';
import { unitFormat } from '@repo/lib/format';
import { useHzLPLiquidityHistory, useGlobalStore } from '@/common';

export const useLiquidityChartData = () => {
  const { data: liquidityHistory } = useHzLPLiquidityHistory();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);

  const chartData = useMemo(
    () =>
      liquidityHistory?.items
        .map((i) => ({
          timestamp: i.timestamp,
          value: i.liquidity,
        }))
        .reverse() || [],
    [liquidityHistory?.items],
  );

  const formatValue = useMemo(
    () => (value: string) =>
      unitFormat(
        fromDecimalsAmount(value, usdAmountDecimal),
        usdAmountDisplayDecimal,
        {
          style: 'currency',
          currency: 'USD',
        },
      ),
    [usdAmountDecimal, usdAmountDisplayDecimal],
  );

  return {
    chartData,
    formatValue,
  };
};
