'use client';

import { FC, Fragment } from 'react';
import { t } from '@lingui/core/macro';
import { ArrowDownIcon, cn } from '@repo/ui';
// import { useLaunchStore } from './store';

interface StepsProps {
  className?: string;
}

const Steps: FC<StepsProps> = ({ className }) => {
  // const step = useLaunchStore((state) => state.currentStep);

  const stepsData = [
    {
      title: t`Select Market`,
      description: t`Choose the market you want to create HzLP for.`,
    },
    {
      title: t`Select Fee Tiers`,
      description: t`The amount of fees earned for providing liquidity.`,
    },
    {
      title: t`Select Liquidity Tiers`,
      description: t`Set your pool size and select its risk tier accordingly.`,
    },
    {
      title: t`Deposit Initial Liquidity`,
      description: t`The amount of tokens initially added to your HzLP.`,
    },
  ];

  return (
    <div className={className}>
      <h1 className="text-4xl/[0.9] font-semibold">{t`Launch Market`}</h1>
      <p className="text-t-270 mt-3 text-xs">{t`Permissionlessly launch a  market on HertzFlow and earn a share of protocol fee.`}</p>
      <div className="mt-6 flex flex-col gap-2">
        {stepsData.map((v, i) => {
          return (
            <Fragment key={i}>
              {i !== 0 && (
                <div
                  className="animate-in fill-mode-backwards slide-in-from-top-5 fade-in flex size-9 items-center justify-center duration-300"
                  style={{
                    animationDelay: `${(i - 1) * 300 + 150}ms`,
                  }}
                >
                  <ArrowDownIcon />
                </div>
              )}
              <div
                className="animate-in fill-mode-backwards slide-in-from-top-5 fade-in flex items-center gap-2 duration-300"
                style={{
                  animationDelay: `${i * 300}ms`,
                }}
              >
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full text-sm font-medium select-none',
                    // step > i
                    // i === 0
                    //   ? 'bg-t-1100 text-accent-foreground'
                    //   :
                    'bg-bg-step-inactive',
                  )}
                >
                  {i + 1}
                </div>
                <div className="">
                  <div className="text-sm font-medium">{v.title}</div>
                  <p className="text-t-270 mt-1 text-xs">{v.description}</p>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Steps;
