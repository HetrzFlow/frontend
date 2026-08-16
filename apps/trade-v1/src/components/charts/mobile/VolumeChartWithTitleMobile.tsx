'use client';

import { memo } from 'react';
import { VolumeChartMobile } from './VolumeChartMobile';

interface VolumeChartWithTitleMobileProps {
  title: string;
  className?: string;
  height?: number;
}

export const VolumeChartWithTitleMobile = memo(
  ({ title, className, height = 260 }: VolumeChartWithTitleMobileProps) => {
    return (
      <div className={`flex h-full flex-col ${className || ''}`}>
        <h3 className="text-t-1100 mb-3 flex-shrink-0 text-[18px] font-medium">
          {title}
        </h3>
        <div className="min-h-0 flex-1">
          <VolumeChartMobile height={height - 50} className="h-full w-full" />
        </div>
      </div>
    );
  },
);

VolumeChartWithTitleMobile.displayName = 'VolumeChartWithTitleMobile';
