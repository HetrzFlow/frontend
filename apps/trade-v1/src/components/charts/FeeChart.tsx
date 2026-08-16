'use client';

import { useFeeChartData } from '@/hooks/useFeeChartData';
import { FeeChartPresenter } from './FeeChartPresenter';

interface FeeChartProps {
  className?: string;
  height?: number;
}

const FeeChartContainer = ({ className, height }: FeeChartProps) => {
  const { data, isLoading, error } = useFeeChartData();

  return (
    <FeeChartPresenter
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

FeeChartContainer.displayName = 'FeeChartContainer';

export { FeeChartContainer as FeeChart };
