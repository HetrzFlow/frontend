'use client';

import { useFeeChartData } from '@/hooks/useFeeChartData';
import { FeeChartPresenterMobile } from './FeeChartPresenterMobile';

interface FeeChartMobileProps {
  className?: string;
  height?: number;
}

const FeeChartMobileContainer = ({
  className,
  height,
}: FeeChartMobileProps) => {
  const { data, isLoading, error } = useFeeChartData();

  return (
    <FeeChartPresenterMobile
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

FeeChartMobileContainer.displayName = 'FeeChartMobileContainer';

export { FeeChartMobileContainer as FeeChartMobile };
