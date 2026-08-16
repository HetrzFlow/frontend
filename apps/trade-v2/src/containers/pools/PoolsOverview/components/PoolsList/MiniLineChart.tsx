'use client';

import { memo } from 'react';
import { Area, ComposedChart, Line } from 'recharts';
import { ChartConfig, ChartContainer, cn } from '@repo/ui';

const chartConfig = {
  value: {
    label: 'Fee APR',
    color: 'var(--accent)',
  },
} satisfies ChartConfig;

interface MiniLineChartProps {
  data: Array<{ timestamp: number; value: number }>;
  className?: string;
}

const MiniLineChart = ({ data, className }: MiniLineChartProps) => {
  return (
    <ChartContainer
      config={chartConfig}
      className={cn('h-8 overflow-hidden', className)}
    >
      <ComposedChart
        data={data}
        margin={{
          left: 0,
          right: 0,
          top: 5,
          bottom: 5,
        }}
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="fillMiniApr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="16.04%" stopColor="var(--accent)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          type="linear"
          stroke="none"
          fill="url(#fillMiniApr)"
          isAnimationActive={false}
        />
        <Line
          type="linear"
          dataKey="value"
          stroke={chartConfig.value.color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
};

export default memo(MiniLineChart);
