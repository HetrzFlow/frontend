'use client';

import { cn } from '@repo/ui';
import ChartV2Svg from './ChartV2Svg';

interface ChartV2Props {
  activeStep?: number;
  onStepHover?: (step: number) => void;
}

const ChartV2 = ({ activeStep = 0, onStepHover }: ChartV2Props) => {
  return (
    <div className="relative mx-auto w-full max-w-[620px] max-md:h-full lg:max-w-[650px] xl:max-w-[691px]">
      <div
        className={cn(
          'w-full transition-opacity duration-500 ease-out',
          'pointer-events-auto opacity-100',
        )}
      >
        <ChartV2Svg activeStep={activeStep} onStepHover={onStepHover} />
      </div>
    </div>
  );
};

export default ChartV2;
