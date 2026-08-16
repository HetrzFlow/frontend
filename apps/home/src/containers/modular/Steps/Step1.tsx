import { ForwardedRef, forwardRef, useEffect, useRef } from 'react';
import { useLingui } from '@lingui/react/macro';
import { animate, createTimer, JSAnimation, svg, Timer } from 'animejs';
import { percentFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';

interface Step1Props {
  isActive: boolean;
  hideChart: boolean;
  onHover?: () => void;
}

const Step1 = forwardRef(
  (
    { isActive, hideChart, onHover }: Step1Props,
    ref: ForwardedRef<HTMLHeadingElement>,
  ) => {
    const { t } = useLingui();
    const firstIn = useRef(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const percentEleRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const animateItem = useRef<JSAnimation | null>(null);
    const timerItem = useRef<Timer | null>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting && firstIn.current) {
            firstIn.current = false;

            timerItem.current = createTimer({
              duration: 500,
              loop: false,
              onUpdate: (self) => {
                if (percentEleRef.current) {
                  percentEleRef.current.innerText = percentFormat(
                    self.currentTime / 10000 + 0.2,
                    0,
                  );
                }
              },
            });

            if (pathRef.current) {
              animateItem.current = animate(
                svg.createDrawable(pathRef.current),
                {
                  draw: '0 1',
                  ease: 'linear',
                  duration: 500,
                  loop: false,
                },
              );
            }
          }
        },
        { threshold: 0.1 },
      );

      if (containerRef.current) observer.observe(containerRef.current);

      const container = containerRef.current;
      return () => {
        if (container) observer.unobserve(container);
      };
    }, []);

    useEffect(() => {
      if (isActive) {
        timerItem.current?.restart();
        animateItem.current?.restart();
      }
    }, [isActive]);

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
            className={`relative flex items-center gap-3 text-[24px]/[0.9] font-medium transition-all duration-500 ease-out max-md:text-[24px]/[0.9] ${
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
            {t`Vault from HertzFlow`}
          </h3>
        </div>
        <div
          ref={containerRef}
          className={cn(
            'grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-500 ease-out',
            isActive
              ? 'mt-3 grid-rows-[1fr] opacity-100'
              : 'mt-0 grid-rows-[0fr] opacity-0 pointer-events-none',
          )}
        >
          <div className="overflow-hidden">
            <div>
              <p
                className={cn(
                  'text-t-270 text-sm transition-all duration-500 ease-out',
                  isActive ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
                )}
              >
                {t`One click earn via providing liquidity to all markets via vaults`}
              </p>
              {!hideChart && (
                <div className="mt-3 rounded-2xl border p-4 max-md:h-60">
                  <div className="font-medium">{t`Earn`}</div>
                  <div
                    className="my-2 text-[32px]/[1] font-medium text-[#FFDF9C]"
                    ref={percentEleRef}
                  >
                    {percentFormat(0.2, 0)}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="364"
                    height="103"
                    viewBox="0 0 364 103"
                    fill="none"
                    className="h-max w-full"
                  >
                    <path
                      d="M56.5389 28.4088L0.0888672 35.1379V102.442H363.089V0.744507L306.639 5.97829L265.142 17.1935L218.038 14.2028L187.383 25.0442L160.841 21.3058H138.036L85.6985 31.3995L56.5389 28.4088Z"
                      fill="url(#paint0_linear_10012_5811)"
                    />
                    <path
                      d="M0.0888672 35.1379L56.5389 28.4088L85.6985 31.3995L138.036 21.3058H160.841L187.383 25.0442L218.038 14.2028L265.142 17.1935L306.639 5.97829L363.089 0.744507"
                      stroke="#FDDD9B"
                      strokeWidth="1.49537"
                      ref={pathRef}
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_10012_5811"
                        x1="181.589"
                        y1="0.744507"
                        x2="181.589"
                        y2="102.442"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#FDDD9B" stopOpacity="0.2" />
                        <stop offset="1" stopColor="#FDDD9B" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

Step1.displayName = 'Step1';

export default Step1;
