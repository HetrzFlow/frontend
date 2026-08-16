'use client';

import { FC } from 'react';
import { PoolDetailResData } from '@/common';
import PoolPieChart from '@/components/hzlp/PoolPieChart';
import { usePoolPieChartData } from '@/hooks/hzlp/usePoolPieChartData';

interface PoolPieChartContainerProps {
  poolName: string;
  data: PoolDetailResData['coin_details'];
}

const PoolPieChartContainer: FC<PoolPieChartContainerProps> = ({
  poolName,
  data,
}) => {
  const { chartConfig, chartData, isNoData, usdAmountDisplayDecimal } =
    usePoolPieChartData(data);

  return (
    <PoolPieChart
      poolName={poolName}
      chartConfig={chartConfig}
      chartData={chartData}
      isNoData={isNoData}
      usdAmountDisplayDecimal={usdAmountDisplayDecimal}
    />
  );
};

export default PoolPieChartContainer;
