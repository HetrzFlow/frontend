'use client';

import { memo } from 'react';
import { PoolCompositionChartMobile } from './PoolCompositionChartMobile';

interface PoolCompositionChartWithTitleMobileProps {
  title: string;
  className?: string;
  height?: number;
}

export const PoolCompositionChartWithTitleMobile = memo(
  ({
    title,
    className,
    height = 260,
  }: PoolCompositionChartWithTitleMobileProps) => {
    return (
      <div className={`flex h-full flex-col ${className || ''}`}>
        <h3 className="text-t-1100 mb-3 flex-shrink-0 text-[18px] font-medium">
          {title}
        </h3>
        <div className="min-h-0 flex-1">
          <PoolCompositionChartMobile
            height={height - 50}
            className="h-full w-full"
          />
        </div>
      </div>
    );
  },
);

PoolCompositionChartWithTitleMobile.displayName =
  'PoolCompositionChartWithTitleMobile';
