'use client';

import { usePoolCompositionChartData } from '@/hooks/usePoolCompositionChartData';
import { PoolCompositionChartPresenterMobile } from './PoolCompositionChartPresenterMobile';

interface PoolCompositionChartMobileProps {
  className?: string;
  height?: number;
}

const PoolCompositionChartMobileContainer = ({
  className,
  height,
}: PoolCompositionChartMobileProps) => {
  const { data, isLoading, error } = usePoolCompositionChartData();

  return (
    <PoolCompositionChartPresenterMobile
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

PoolCompositionChartMobileContainer.displayName =
  'PoolCompositionChartMobileContainer';

export { PoolCompositionChartMobileContainer as PoolCompositionChartMobile };
