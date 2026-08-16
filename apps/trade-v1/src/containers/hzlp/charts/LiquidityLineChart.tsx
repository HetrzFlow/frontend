'use client';

import { FC } from 'react';
import LiquidityLineChart from '@/components/hzlp/LiquidityLineChart';
import { useLiquidityChartData } from '@/hooks/hzlp/useLiquidityChartData';

const LiquidityLineChartContainer: FC = () => {
  const { chartData, formatValue } = useLiquidityChartData();

  return <LiquidityLineChart chartData={chartData} formatValue={formatValue} />;
};

export default LiquidityLineChartContainer;
