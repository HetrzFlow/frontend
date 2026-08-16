import { ForwardedRef, forwardRef } from 'react';
import { useLingui } from '@lingui/react/macro';
import { cn } from '@repo/ui';

interface Step4Props {
  isActive: boolean;
  hideChart: boolean;
  onHover?: () => void;
}

const Step3 = forwardRef(
  (
    { isActive, hideChart, onHover }: Step4Props,
    ref: ForwardedRef<HTMLHeadingElement>,
  ) => {
    const { t } = useLingui();
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
            {t`Markets`}
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
                {t`ETF-style liquidity vehicle for any users who wish to provide liquidity to a whole asset type`}
              </p>
              {!hideChart && (
                <div className="mt-3 flex justify-center overflow-hidden rounded-2xl border max-md:h-60">
                  <video
                    width="100%"
                    height="200px"
                    loop={true}
                    autoPlay
                    preload="auto"
                    muted
                    playsInline
                    controls={false}
                    className={cn(
                      'h-full w-auto rounded-2xl object-contain lg:w-full',
                    )}
                  >
                    <source
                      src="/home-static/coinCircleAnimation.mp4"
                      type="video/mp4"
                    />
                    {t`Your browser does not support the video tag.`}
                  </video>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

Step3.displayName = 'Step3';

export default Step3;
