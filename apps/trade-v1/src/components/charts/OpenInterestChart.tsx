'use client';

import { useOpenInterestChartData } from '@/hooks/useOpenInterestChartData';
import { OpenInterestChartPresenter } from './OpenInterestChartPresenter';

interface OpenInterestChartProps {
  className?: string;
  height?: number;
}

const OpenInterestChartContainer = ({
  className,
  height,
}: OpenInterestChartProps) => {
  const { data, isLoading, error } = useOpenInterestChartData();

  return (
    <OpenInterestChartPresenter
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

OpenInterestChartContainer.displayName = 'OpenInterestChartContainer';

export { OpenInterestChartContainer as OpenInterestChart };
