'use client';

import { useHzlpSupplyChartData } from '@/hooks/useHzlpSupplyChartData';
import { HzlpSupplyChartPresenter } from './HzlpSupplyChartPresenter';

interface HzlpSupplyChartProps {
  className?: string;
  height?: number;
}

const HzlpSupplyChartContainer = ({
  className,
  height,
}: HzlpSupplyChartProps) => {
  const { data, isLoading, error } = useHzlpSupplyChartData();

  return (
    <HzlpSupplyChartPresenter
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

HzlpSupplyChartContainer.displayName = 'HzlpSupplyChartContainer';

export { HzlpSupplyChartContainer as HzlpSupplyChart };
