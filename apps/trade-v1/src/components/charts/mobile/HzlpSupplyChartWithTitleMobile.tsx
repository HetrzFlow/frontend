'use client';

import { memo } from 'react';
import { HzlpSupplyChart } from '../HzlpSupplyChart';

interface HzlpSupplyChartWithTitleMobileProps {
  title: string;
  className?: string;
  height?: number;
}

export const HzlpSupplyChartWithTitleMobile = memo(
  ({ title, className, height = 260 }: HzlpSupplyChartWithTitleMobileProps) => {
    return (
      <div className={`flex h-full flex-col ${className || ''}`}>
        <h3 className="text-t-1100 mb-3 flex-shrink-0 text-[18px] font-medium">
          {title}
        </h3>
        <div className="min-h-0 flex-1">
          <HzlpSupplyChart height={height - 50} className="h-full w-full" />
        </div>
      </div>
    );
  },
);

HzlpSupplyChartWithTitleMobile.displayName = 'HzlpSupplyChartWithTitleMobile';
