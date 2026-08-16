'use client';

import { useHzlpUtilizationChartData } from '@/hooks/useHzlpUtilizationChartData';
import { HzlpUtilizationChartPresenter } from './HzlpUtilizationChartPresenter';

interface HzlpUtilizationChartProps {
  className?: string;
  height?: number;
}

const HzlpUtilizationChartContainer = ({ className, height }: HzlpUtilizationChartProps) => {
  const { data, isLoading, error } = useHzlpUtilizationChartData();

  return (
    <HzlpUtilizationChartPresenter 
      data={data} 
      isLoading={isLoading} 
      error={error}
      className={className}
      height={height}
    />
  );
};

HzlpUtilizationChartContainer.displayName = 'HzlpUtilizationChartContainer';

export { HzlpUtilizationChartContainer as HzlpUtilizationChart };
