import { ForwardedRef, forwardRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { cn } from '@repo/ui';

import styles from './index.module.css';

interface Step3Props {
  isActive: boolean;
  hideChart: boolean;
  onHover?: () => void;
}

const Step4 = forwardRef(
  (
    { isActive, hideChart, onHover }: Step3Props,
    ref: ForwardedRef<HTMLHeadingElement>,
  ) => {
    const { t } = useLingui();
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
      if (isActive && !hideChart) {
        setAnimationKey((prev) => prev + 1);
      }
    }, [hideChart, isActive]);

    return (
      <div
        className={cn(
          'max-md:mt-0',
          !isActive ? 'max-md:hidden' : '',
        )}
      >
        <div onMouseEnter={onHover} className="cursor-pointer">
          <h3
            ref={ref}
            className={`flex items-center gap-3 text-[24px]/[0.9] font-medium transition-all duration-500 ease-out max-md:text-[24px]/[0.9] ${
              isActive
                ? 'text-t-1100 translate-x-0 opacity-100'
                : 'text-t-430 -translate-x-2 opacity-40'
            }`}
          >
            {isActive && !hideChart && (
              <>
                <div className="size-2 rounded-full bg-white max-md:hidden"></div>
              </>
            )}
            {t`Pools`}
          </h3>
        </div>
        <div
          className={cn(
            'grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-500 ease-out',
            isActive
              ? 'mt-3 grid-rows-[1fr] opacity-100'
              : 'pointer-events-none mt-0 grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div>
              <p
                className={cn(
                  'text-t-270 text-sm transition-all duration-500 ease-out',
                  isActive
                    ? 'translate-y-0 opacity-100'
                    : '-translate-y-2 opacity-0',
                )}
              >
                {t`The isolated pool of an asset market that any user can directly provide liquidity to`}
              </p>
              {!hideChart && (
                <div
                  key={animationKey}
                  className="relative mt-3 h-50 overflow-hidden rounded-2xl border max-md:h-60"
                >
                  <Image
                    src="/home-static/images/layer-1.png"
                    alt="HertzFlow liquidity pool layer 1"
                    width={569}
                    height={328}
                    className={cn(
                      'absolute top-1/2 left-1/2 h-auto w-[200px] -translate-x-1/2 -translate-y-1/2',
                      styles.stepImage1Animation,
                    )}
                  />
                  <Image
                    src="/home-static/images/layer-2.png"
                    alt="HertzFlow liquidity pool layer 2"
                    width={569}
                    height={328}
                    className={cn(
                      'absolute top-1/2 left-1/2 h-auto w-[200px] -translate-x-1/2 -translate-y-1/2',
                      styles.stepImage2Animation,
                    )}
                  />
                  <Image
                    src="/home-static/images/layer-3.png"
                    alt="HertzFlow liquidity pool layer 3"
                    width={569}
                    height={328}
                    className={cn(
                      'absolute top-1/2 left-1/2 h-auto w-[200px] -translate-x-1/2 -translate-y-1/2',
                      styles.stepImage3Animation,
                    )}
                  />
                  <Image
                    src="/home-static/images/layer-4.png"
                    alt="HertzFlow liquidity pool layer 4"
                    width={569}
                    height={328}
                    className={cn(
                      'absolute top-1/2 left-1/2 h-auto w-[200px] -translate-x-1/2 -translate-y-1/2',
                      styles.stepImage4Animation,
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

Step4.displayName = 'Step4';

export default Step4;
