import { FC, memo, useState, useEffect } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Pie, PieChart, Sector, Tooltip } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { unitFormat } from '@repo/lib/format';
import { ChartConfig, ChartContainer, cn } from '@repo/ui';
import { ChartDataItem } from '@/hooks/hzlp/usePoolPieChartData';
import { useWindowWidth } from '@/hooks/hzlp/useWindowWidth';

const BREAKPOINT_WIDTH = 800;

interface PoolPieChartProps {
  poolName: string;
  chartConfig: ChartConfig;
  chartData: ChartDataItem[];
  isNoData: boolean;
  usdAmountDisplayDecimal: number;
}

const PoolPieChart: FC<PoolPieChartProps> = ({
  poolName,
  chartConfig,
  chartData,
  isNoData,
  usdAmountDisplayDecimal,
}) => {
  const { t } = useLingui();
  const windowWidth = useWindowWidth();

  const [activeData, setActiveData] = useState<null | ChartDataItem>(null);
  const [textOpacity, setTextOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTextOpacity(1);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[130px] w-full"
      onMouseLeave={() => {
        setActiveData(null);
      }}
    >
      <PieChart className="[&>svg]:overflow-visible">
        <Pie
          data={chartData}
          dataKey="amount"
          nameKey="token"
          isAnimationActive={false}
          innerRadius={(windowWidth ?? 0) >= BREAKPOINT_WIDTH ? 50 : 45}
          outerRadius={(windowWidth ?? 0) >= BREAKPOINT_WIDTH ? 70 : 55}
          strokeWidth={1}
          inactiveShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => {
            return (
              <>
                <Sector {...props} innerRadius={0} outerRadius={outerRadius} />
                <Sector
                  {...props}
                  innerRadius={0}
                  outerRadius={50}
                  fill="var(--bg-1-2-mix)"
                />
              </>
            );
          }}
          activeShape={({ ...props }: PieSectorDataItem) => {
            return (
              <>
                <Sector
                  {...props}
                  innerRadius={0}
                  className={cn(
                    props.className,
                    'origin-center transition-transform hover:scale-115',
                  )}
                  onMouseOver={() => {
                    setActiveData(props.payload);
                  }}
                  onMouseLeave={() => {
                    setActiveData(null);
                  }}
                />

                <Sector
                  {...props}
                  innerRadius={0}
                  outerRadius={50}
                  fill="var(--bg-1-2-mix)"
                />
              </>
            );
          }}
        >
          <Tooltip active content={() => ''} />
        </Pie>
        {activeData ? (
          <>
            <text
              x="50%"
              y="45%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="medium"
              fill={'var(--t-1100)'}
            >
              {activeData.token}
            </text>
            <text
              x="50%"
              y="54%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fill={'var(--t-1100)'}
            >
              {unitFormat(activeData.amount, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </text>
          </>
        ) : (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="medium"
            fill={isNoData ? 'var(--t-270)' : 'var(--t-1100)'}
            style={{
              opacity: textOpacity,
              transition: 'opacity 300ms ease-out',
            }}
          >
            {isNoData ? t`No Data` : poolName + t` Pool`}
          </text>
        )}
      </PieChart>
    </ChartContainer>
  );
};

export default memo(PoolPieChart);
