'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { ChevronLeftIcon, ChevronRightIcon, cn } from '@repo/ui';
import SplitText from '@/components/SplitText';

import Steps from './Steps';

const ChartV2 = dynamic(() => import('./ChartV2'), {
  ssr: false,
  loading: () => <div className="w-2/3 max-md:w-full"></div>,
});

const STEPS_COUNT = 4;
const CHART_VIEWBOX = { width: 691, height: 641 } as const;
const STEP_ANCHORS = [
  { x: 460, y: 123 },
  { x: 460, y: 206 },
  { x: 530, y: 280 },
  { x: 530, y: 404 },
] as const;

const createConnectorPath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  jointX: number,
) => {
  return `M ${startX} ${startY} L ${jointX} ${startY} L ${endX} ${endY}`;
};

const Modular = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [connectorPath, setConnectorPath] = useState('');
  const [chartHeight, setChartHeight] = useState(0);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const rowRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLHeadingElement | null)[]>([]);

  const handleStepHover = useCallback((step: number) => {
    setActiveStep(step);
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    let stopTrackingTimeout: ReturnType<typeof setTimeout> | null = null;

    const updateConnector = () => {
      const rowEl = rowRef.current;
      const chartEl = chartRef.current;
      const stepEl = stepRefs.current[activeStep];

      if (!rowEl || !chartEl || !stepEl) {
        setConnectorPath('');
        return;
      }

      const rowRect = rowEl.getBoundingClientRect();
      const chartRect = chartEl.getBoundingClientRect();
      const stepRect = stepEl.getBoundingClientRect();
      const anchor = STEP_ANCHORS[activeStep];

      if (!anchor || !rowRect.width || !chartRect.width) {
        setConnectorPath('');
        return;
      }

      const scaleX = chartRect.width / CHART_VIEWBOX.width;
      const scaleY = chartRect.height / CHART_VIEWBOX.height;
      const endX = chartRect.left - rowRect.left + anchor.x * scaleX;
      const startX = stepRect.left - rowRect.left + 8;
      const startY = stepRect.top - rowRect.top + stepRect.height / 2;
      const endY = Math.max(
        activeStep === 1
          ? startY
          : chartRect.top - rowRect.top + anchor.y * scaleY,
        startY,
      );
      const jointX = endX + 60;

      setOverlaySize({ width: rowRect.width, height: rowRect.height });
      setChartHeight(chartRect.height);
      setConnectorPath(createConnectorPath(startX, startY, endX, endY, jointX));
    };

    const trackConnector = () => {
      updateConnector();
      animationFrame = requestAnimationFrame(trackConnector);
    };

    animationFrame = requestAnimationFrame(trackConnector);
    stopTrackingTimeout = setTimeout(() => {
      cancelAnimationFrame(animationFrame);
      updateConnector();
    }, 700);

    const resizeObserver = new ResizeObserver(updateConnector);

    if (rowRef.current) {
      resizeObserver.observe(rowRef.current);
    }
    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }
    stepRefs.current.forEach((stepEl) => {
      if (stepEl) {
        resizeObserver.observe(stepEl);
      }
    });

    window.addEventListener('resize', updateConnector);

    return () => {
      cancelAnimationFrame(animationFrame);
      if (stopTrackingTimeout) {
        clearTimeout(stopTrackingTimeout);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateConnector);
    };
  }, [activeStep]);

  return (
    <div className={cn('relative mt-25 max-md:mt-0')}>
      <div
        className={
          'mx-auto flex w-full justify-center px-20 pt-20 max-md:h-auto max-md:max-w-dvw max-md:px-4'
        }
      >
        <div className="h-full w-full max-w-[1280px] max-md:w-[calc(100dvw-32px)]">
          <h2 className="">
            <SplitText
              text={i18n._(msg`Open Liquidity. Modular Yield.`)}
              className="font-borna overflow-visible text-[calc(var(--spacing)*8)]/[1.2] font-medium max-md:text-[calc(var(--spacing)*7)]/[1.2] lg:text-[52px]/[1]"
              delay={10}
              duration={2}
              ease="elastic.out(1, 0.3)"
              splitType="words, chars"
              threshold={0}
              textAlign="left"
            />
          </h2>
          <p className="text-t-270 mt-6 text-sm max-md:mt-3">
            {i18n._(
              msg`Activate capital flywheel with HzLP liquidity composability.`,
            )}
          </p>
          <div className="flex items-center py-8 max-md:h-auto">
            <div
              ref={rowRef}
              className="relative flex w-full items-start justify-between gap-12 max-md:flex-col max-md:items-start max-md:gap-5 xl:gap-18"
            >
              {connectorPath &&
                overlaySize.width > 0 &&
                overlaySize.height > 0 && (
                  <svg
                    className="pointer-events-none absolute inset-0 hidden md:block"
                    width={overlaySize.width}
                    height={overlaySize.height}
                    viewBox={`0 0 ${overlaySize.width} ${overlaySize.height}`}
                    fill="none"
                  >
                    <path
                      d={connectorPath}
                      stroke="white"
                      strokeOpacity="0.72"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                    />
                  </svg>
                )}
              <div
                ref={chartRef}
                className="relative flex min-w-0 flex-[1_1_auto] justify-center max-md:h-2/5 max-md:w-full"
              >
                <ChartV2
                  activeStep={activeStep}
                  onStepHover={handleStepHover}
                />
                <div
                  className="bg-accent/20 text-accent absolute top-1/2 left-0 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full max-md:flex"
                  onClick={() => {
                    setActiveStep((prev) => Math.max(0, prev - 1));
                  }}
                >
                  <ChevronLeftIcon size={20} className="" />
                </div>

                <div
                  className="bg-accent/20 text-accent absolute top-1/2 right-0 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full max-md:flex"
                  onClick={() => {
                    setActiveStep((prev) =>
                      Math.min(prev + 1, STEPS_COUNT - 1),
                    );
                  }}
                >
                  <ChevronRightIcon size={20} className="" />
                </div>
              </div>
              <Steps
                activeStep={activeStep}
                onStepHover={handleStepHover}
                stepRefs={stepRefs}
                chartHeight={chartHeight}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modular;
