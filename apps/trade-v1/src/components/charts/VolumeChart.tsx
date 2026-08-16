'use client';

import { useVolumeChartData } from '@/hooks/useVolumeChartData';
import { VolumeChartPresenter } from './VolumeChartPresenter';

interface VolumeChartProps {
  className?: string;
  height?: number;
}

const VolumeChartContainer = ({ className, height }: VolumeChartProps) => {
  const { data, isLoading, error } = useVolumeChartData();

  return (
    <VolumeChartPresenter
      data={data}
      isLoading={isLoading}
      error={error}
      className={className}
      height={height}
    />
  );
};

VolumeChartContainer.displayName = 'VolumeChartContainer';

export { VolumeChartContainer as VolumeChart };
