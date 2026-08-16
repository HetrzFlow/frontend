import { ForwardedRef, forwardRef, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { percentFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import type { AnimationItem } from 'lottie-web/build/player/lottie_svg';

interface Step2Props {
  isActive: boolean;
  hideChart: boolean;
  onHover?: () => void;
}

const Step2 = forwardRef(
  (
    { isActive, hideChart, onHover }: Step2Props,
    ref: ForwardedRef<HTMLHeadingElement>,
  ) => {
    const { t } = useLingui();
    const anim = useRef<AnimationItem | null>(null);

    const ele = useRef(null);
    useEffect(() => {
      // async import, because sync import will cause Next/Image crash
      import('lottie-web/build/player/lottie_svg').then(
        ({ default: lottie }) => {
          if (ele.current) {
            anim.current = lottie.loadAnimation({
              container: ele.current, // the dom element that will contain the animation
              renderer: 'svg',
              loop: false,
              path: '/home-static/lotties/circle.json', // the path to the animation json
            });
            anim.current.setSpeed(1.2);
          }
        },
      );

      return () => anim.current?.destroy();
    }, []);

    useEffect(() => {
      if (isActive) {
        anim.current?.goToAndPlay(0, true);
      }
    }, [isActive]);

    return (
      <div className={cn('max-md:mt-0', !isActive ? 'max-md:hidden' : '')}>
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
            {t`Vaults from Curators`}
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
                {t`HertzFlow empowers Curators to manage pool-level liquidity and enables third-party to create own strategies for optimized capital efficiency`}
              </p>
              {!hideChart && (
                <div className="mt-3 rounded-2xl border p-4 max-md:h-60">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-base font-medium">{t`US Stock Strategy`}</span>
                    <span className="text-t-270 flex gap-1 text-xs">
                      <Image
                        src="/home-static/images/lp.png"
                        alt="Curator avatar"
                        width={14}
                        height={14}
                        className=""
                      />
                      {t`ABC Capital`}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <mask
                        id="mask0_10012_5908"
                        className="mask-type-alpha"
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="16"
                        height="16"
                      >
                        <rect width="16" height="16" fill="#D9D9D9" />
                      </mask>
                      <g mask="url(#mask0_10012_5908)">
                        <path
                          d="M8 14.3209C6.55811 13.9276 5.36433 13.0789 4.41867 11.7747C3.47289 10.4705 3 9.01236 3 7.40036V3.56452L8 1.69269L13 3.56452V7.40036C13 9.01236 12.5271 10.4705 11.5813 11.7747C10.6357 13.0789 9.44189 13.9276 8 14.3209ZM8 13.267C9.15556 12.9004 10.1111 12.167 10.8667 11.067C11.6222 9.96702 12 8.7448 12 7.40036V4.25036L8 2.75669L4 4.25036V7.40036C4 8.7448 4.37778 9.96702 5.13333 11.067C5.88889 12.167 6.84444 12.9004 8 13.267Z"
                          fill="#FF9900"
                        />
                        <path
                          d="M8 12C7.13487 11.7509 6.4186 11.2132 5.8512 10.387C5.28373 9.56076 5 8.63704 5 7.61583V5.18581L8 4L11 5.18581V7.61583C11 8.63704 10.7163 9.56076 10.1488 10.387C9.5814 11.2132 8.86513 11.7509 8 12Z"
                          fill="#FF9900"
                        />
                      </g>
                    </svg>
                    <span className="text-t-270 text-xs">
                      {' '}
                      {t`Conservative`}
                    </span>
                  </div>
                  <div
                    className="-mt-5 h-[calc(100%-10px)] min-h-25 max-md:h-[calc(100%-24px)]"
                    ref={ele}
                  ></div>
                  <div className="-mx-4 mt-1 flex origin-bottom items-center justify-between gap-1 text-[10px]">
                    <div className="text-t-350 flex items-center font-medium">
                      <span className="mr-1 aspect-square size-2 bg-[#CCB27C]"></span>
                      <span className="">
                        {t`US Stock Big 7 Market`}
                        {'  '} {percentFormat(0.78, 0)}
                      </span>
                    </div>
                    <div className="text-t-350 flex items-center font-medium">
                      <span className="mr-1 aspect-square size-2 bg-[#FFBB2F]"></span>
                      <span className="">
                        {t`KODX Pools`}
                        {'  '} {percentFormat(0.12, 0)}
                      </span>
                    </div>
                    <div className="text-t-350 flex items-center font-medium">
                      <span className="mr-1 aspect-square size-2 bg-[#FF7300]"></span>
                      <span className="">
                        {t`Other Pools`}
                        {'  '} {percentFormat(0.1, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

Step2.displayName = 'Step2';

export default Step2;
