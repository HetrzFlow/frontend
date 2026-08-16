'use client';

import { memo } from 'react';
import { HzlpUtilizationChart } from './HzlpUtilizationChart';

interface HzlpUtilizationChartWithTitleProps {
  title: string;
  className?: string;
  height?: number;
}

export const HzlpUtilizationChartWithTitle = memo(
  ({ title, className, height = 300 }: HzlpUtilizationChartWithTitleProps) => {
    return (
      <div className={`flex h-full flex-col ${className || ''}`}>
        <h3 className="text-t-1100 mb-4 flex-shrink-0 text-[20px] font-medium">
          {title}
        </h3>
        <div className="min-h-0 flex-1">
          <HzlpUtilizationChart
            height={height - 60}
            className="h-full w-full"
          />
        </div>
      </div>
    );
  },
);

HzlpUtilizationChartWithTitle.displayName = 'HzlpUtilizationChartWithTitle';
