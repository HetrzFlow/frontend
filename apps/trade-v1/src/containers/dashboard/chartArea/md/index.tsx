import { GradientBorder } from '@repo/ui';
import {
  VolumeChartWithTitle,
  FeeChartWithTitle,
  HzlpSupplyChartWithTitle,
  PoolCompositionChartWithTitle,
  OpenInterestChartWithTitle,
  UsersChartWithTitle,
} from '@/components/charts';
import { CHART_HEIGHT } from '../useDashboardChartAreaData';

const DashboardChartArea = () => {
  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GradientBorder outerClassName="p-6">
          <VolumeChartWithTitle
            title="Volume"
            height={CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        <GradientBorder outerClassName="p-6">
          <FeeChartWithTitle
            title="Fee"
            height={CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        <GradientBorder outerClassName="p-6">
          <HzlpSupplyChartWithTitle
            title="HzLP Supply"
            height={CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        <GradientBorder outerClassName="p-6">
          <PoolCompositionChartWithTitle
            title="Pool Composition"
            height={CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        {/* <HzlpUtilizationChartWithTitle
        title="HzLP Utilization"
        height={CHART_HEIGHT}
        className="w-full"
      /> */}
        <GradientBorder outerClassName="p-6">
          <OpenInterestChartWithTitle
            title="Open Interest"
            height={CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        <GradientBorder outerClassName="p-6">
          <UsersChartWithTitle
            title="Users"
            height={CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
      </div>
    </div>
  );
};

export default DashboardChartArea;
