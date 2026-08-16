'use client';

import { useVolumeChartData } from '@/hooks/useVolumeChartData';
import { VolumeChartPresenterMobile } from './VolumeChartPresenterMobile';

interface VolumeChartMobileProps {
  className?: string;
  height?: number;
}

const VolumeChartMobileContainer = ({
  className,
  height,
}: VolumeChartMobileProps) => {
  const { data, isLoading, error } = useVolumeChartData();

  return (
    <VolumeChartPresenterMobile
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

VolumeChartMobileContainer.displayName = 'VolumeChartMobileContainer';

export { VolumeChartMobileContainer as VolumeChartMobile };
