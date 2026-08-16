import { GradientBorder } from '@repo/ui';
import {
  VolumeChartWithTitleMobile,
  FeeChartWithTitleMobile,
  HzlpSupplyChartWithTitleMobile,
  PoolCompositionChartWithTitleMobile,
  OpenInterestChartWithTitleMobile,
  UsersChartWithTitleMobile,
} from '@/components/charts/mobile';
import { MOBILE_CHART_HEIGHT } from '../useDashboardChartAreaData';

const DashboardChartArea = () => {
  return (
    <div className="mt-6 mb-[60px]">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GradientBorder outerClassName="p-3">
          <VolumeChartWithTitleMobile
            title="Volume"
            height={MOBILE_CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        <GradientBorder outerClassName="p-3">
          <FeeChartWithTitleMobile
            title="Fee"
            height={MOBILE_CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        <GradientBorder outerClassName="p-3">
          <HzlpSupplyChartWithTitleMobile
            title="HzLP Supply"
            height={MOBILE_CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        <GradientBorder outerClassName="p-3">
          <PoolCompositionChartWithTitleMobile
            title="Pool Composition"
            height={MOBILE_CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        {/* <HzlpUtilizationChartWithTitle
        title="HzLP Utilization"
        height={MOBILE_CHART_HEIGHT}
        className="w-full"
      /> */}
        <GradientBorder outerClassName="p-3">
          <OpenInterestChartWithTitleMobile
            title="Open Interest"
            height={MOBILE_CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
        <GradientBorder outerClassName="p-3">
          <UsersChartWithTitleMobile
            title="Users"
            height={MOBILE_CHART_HEIGHT}
            className="w-full"
          />
        </GradientBorder>
      </div>
    </div>
  );
};

export default DashboardChartArea;
