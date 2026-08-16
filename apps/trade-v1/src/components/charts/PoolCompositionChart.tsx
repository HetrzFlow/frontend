'use client';

import { usePoolCompositionChartData } from '@/hooks/usePoolCompositionChartData';
import { PoolCompositionChartPresenter } from './PoolCompositionChartPresenter';

interface PoolCompositionChartProps {
  className?: string;
  height?: number;
}

const PoolCompositionChartContainer = ({
  className,
  height,
}: PoolCompositionChartProps) => {
  const { data, isLoading, error } = usePoolCompositionChartData();

  return (
    <PoolCompositionChartPresenter
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

PoolCompositionChartContainer.displayName = 'PoolCompositionChartContainer';

export { PoolCompositionChartContainer as PoolCompositionChart };
