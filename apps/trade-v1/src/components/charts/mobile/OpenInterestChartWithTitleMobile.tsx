'use client';

import { memo } from 'react';
import { OpenInterestChart } from '../OpenInterestChart';

interface OpenInterestChartWithTitleMobileProps {
  title: string;
  className?: string;
  height?: number;
}

export const OpenInterestChartWithTitleMobile = memo(
  ({
    title,
    className,
    height = 260,
  }: OpenInterestChartWithTitleMobileProps) => {
    return (
      <div className={`flex h-full flex-col ${className || ''}`}>
        <h3 className="text-t-1100 mb-3 flex-shrink-0 text-[18px] font-medium">
          {title}
        </h3>
        <div className="min-h-0 flex-1">
          <OpenInterestChart height={height - 50} className="h-full w-full" />
        </div>
      </div>
    );
  },
);

OpenInterestChartWithTitleMobile.displayName =
  'OpenInterestChartWithTitleMobile';
