'use client';

import type { CSSProperties, MutableRefObject } from 'react';
import { cn } from '@repo/ui';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';

interface StepsProps {
  activeStep?: number;
  onStepHover?: (step: number) => void;
  stepRefs?: MutableRefObject<(HTMLHeadingElement | null)[]>;
  chartHeight?: number;
}

const Steps = ({
  activeStep = 0,
  onStepHover,
  stepRefs,
  chartHeight = 0,
}: StepsProps) => {
  return (
    <div
      className="relative mt-1 flex w-full max-w-[410px] flex-none items-start justify-center overflow-visible max-md:h-3/5 max-md:w-full max-md:max-w-none md:min-h-[var(--steps-height)]"
      style={
        {
          '--steps-height': chartHeight
            ? `${Math.round(chartHeight)}px`
            : 'auto',
        } as CSSProperties
      }
    >
      <div
        className={
          'relative flex min-h-full w-full shrink-0 grow-0 flex-col justify-between max-md:min-h-0 max-md:gap-8 md:min-h-[var(--steps-height)]'
        }
      >
        <div className="relative hidden w-0 shrink-0 bg-white/10 max-md:flex max-md:h-1 max-md:w-full max-md:justify-center max-md:gap-1 max-md:bg-transparent">
          <div
            className={cn(
              'bg-border-h5 hidden h-1 w-3 rounded-full transition-[background,width] max-md:block',
              activeStep === 0 ? 'bg-accent w-5' : '',
            )}
          ></div>
          <div
            className={cn(
              'bg-border-h5 hidden h-1 w-3 rounded-full transition-[background,width] max-md:block',
              activeStep === 1 ? 'bg-accent w-5' : '',
            )}
          ></div>
          <div
            className={cn(
              'bg-border-h5 hidden h-1 w-3 rounded-full transition-[background,width] max-md:block',
              activeStep === 2 ? 'bg-accent w-5' : '',
            )}
          ></div>
          <div
            className={cn(
              'bg-border-h5 hidden h-1 w-3 rounded-full transition-[background,width] max-md:block',
              activeStep === 3 ? 'bg-accent w-5' : '',
            )}
          ></div>
        </div>

        <div className="flex h-full flex-col justify-between gap-6 max-md:gap-8 md:min-h-[var(--steps-height)]">
          <Step1
            isActive={activeStep === 0 || activeStep >= 4}
            hideChart={activeStep >= 4}
            onHover={() => onStepHover?.(0)}
            ref={(el) => {
              if (stepRefs) {
                stepRefs.current[0] = el;
              }
            }}
          />
          <Step2
            isActive={activeStep === 1 || activeStep >= 4}
            hideChart={activeStep >= 4}
            onHover={() => onStepHover?.(1)}
            ref={(el) => {
              if (stepRefs) {
                stepRefs.current[1] = el;
              }
            }}
          />
          <Step3
            isActive={activeStep === 2 || activeStep >= 4}
            hideChart={activeStep >= 4}
            onHover={() => onStepHover?.(2)}
            ref={(el) => {
              if (stepRefs) {
                stepRefs.current[2] = el;
              }
            }}
          />
          <Step4
            isActive={activeStep === 3 || activeStep >= 4}
            hideChart={activeStep >= 4}
            onHover={() => onStepHover?.(3)}
            ref={(el) => {
              if (stepRefs) {
                stepRefs.current[3] = el;
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Steps;
