import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Line, LineChart } from 'recharts';
import { dateFormat } from '@repo/lib/format';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ui';

const chartConfig = {
  value: {
    label: 'value',
    color: 'var(--accent)',
  },
} satisfies ChartConfig;

interface LiquidityLineChartProps {
  chartData: Array<{ timestamp: number; value: string }>;
  formatValue: (value: string) => string;
}

const LiquidityLineChart: FC<LiquidityLineChartProps> = ({
  chartData,
  formatValue,
}) => {
  const { t } = useLingui();

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[40px] w-full md:h-[90px]"
    >
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
          top: 12,
          bottom: 12,
        }}
      >
        <ChartTooltip
          cursor={false}
          content={(props) => (
            <ChartTooltipContent
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...(props as any)}
              labelClassName="text-t-430 text-xs font-plex font-normal"
              labelFormatter={(_, payload) => {
                return dateFormat(payload[0]?.payload.timestamp, 'yyyy/MM/dd');
              }}
              formatter={(value) => (
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="text-t-270">{t`Total Liquidity`}</span>
                  <span className="font-plex text-t-1100 text-sm">
                    {formatValue(value as string)}
                  </span>
                </div>
              )}
            />
          )}
        />
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={chartConfig.value.color}
              stopOpacity={1}
            />
            <stop
              offset="95%"
              stopColor={chartConfig.value.color}
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Line
          dataKey="value"
          type="linear"
          stroke={chartConfig.value.color}
          strokeWidth={2}
          fill="url(#fillValue)"
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
};

export default memo(LiquidityLineChart);
