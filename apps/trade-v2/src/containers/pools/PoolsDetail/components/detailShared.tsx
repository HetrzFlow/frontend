'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Trans } from '@lingui/react/macro';
import {
  cn,
  MEDIA_SIZES,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useMediaQuery,
} from '@repo/ui';
import { TradeTabs } from '@/common';
import ModuleCard from '@/components/ModuleCard';

const DetailTooltipBoundaryContext = createContext<HTMLDivElement | null>(null);

export function useDetailTooltipBoundary() {
  return useContext(DetailTooltipBoundaryContext);
}

export function DottedTooltip({
  children,
  content,
  className,
}: {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}) {
  const boundaryEl = useDetailTooltipBoundary();
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'decoration-t-430 inline-flex cursor-pointer underline decoration-dotted underline-offset-3',
            className,
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        collisionBoundary={boundaryEl ? [boundaryEl] : undefined}
        collisionPadding={isMobile ? 16 : 8}
        className="max-w-[min(22.5rem,calc(100vw-2rem))] rounded-2xl p-3 text-xs"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export function NetApyTooltip({ periodLabel }: { periodLabel?: ReactNode }) {
  return (
    <DottedTooltip
      content={
        <Trans>
          Net APY is annualized by compounding the Fee APR of the selected
          window. Different windows yield different APY; the bracket shows the
          current window.
        </Trans>
      }
    >
      {periodLabel ? (
        <Trans>Net APY ({periodLabel})</Trans>
      ) : (
        <Trans>Net APY</Trans>
      )}
    </DottedTooltip>
  );
}

export function DetailMetricCard({
  label,
  value,
  tooltip,
  valueClassName,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  tooltip?: ReactNode;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-1', className)}>
      <div className="text-t-270 text-xs">
        {tooltip ? (
          <DottedTooltip content={tooltip}>{label}</DottedTooltip>
        ) : (
          label
        )}
      </div>
      <div
        className={cn(
          'text-t-1100 min-w-0 truncate text-base font-medium',
          valueClassName,
        )}
      >
        {value ?? '--'}
      </div>
    </div>
  );
}

export function DetailMetricsCard({
  children,
  contentClassName,
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <ModuleCard className="rounded-2xl p-3">
      <div className={cn('flex items-start gap-3', contentClassName)}>
        {children}
      </div>
    </ModuleCard>
  );
}

export function DetailPageShell({
  header,
  left,
  right,
  mobileActions,
  mobileHeaderClassName,
  mobileGridClassName,
  mobileLeftClassName,
}: {
  header: ReactNode;
  left: ReactNode;
  right: ReactNode;
  mobileActions?: ReactNode;
  mobileHeaderClassName?: string;
  mobileGridClassName?: string;
  mobileLeftClassName?: string;
}) {
  const [tooltipBoundary, setTooltipBoundary] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <DetailTooltipBoundaryContext.Provider value={tooltipBoundary}>
      <>
        <div
          data-detail-page-shell
          className="animate-in slide-in-from-right-10 fade-in relative left-1/2 h-[calc(100dvh-56px)] min-h-0 w-screen -translate-x-1/2 overflow-x-hidden overflow-y-auto pb-[calc(160px+env(safe-area-inset-bottom))] md:h-full md:pb-10 md:duration-300"
        >
          <div
            ref={setTooltipBoundary}
            className="mx-auto max-w-[1080px] px-4 md:px-1"
          >
            <div className="relative z-10 pt-[env(safe-area-inset-top)] md:pt-0">
              <div className="bg-bg-1-h5 pointer-events-none absolute inset-0 md:hidden" />
              <div className={cn('relative z-10 py-2', mobileHeaderClassName)}>
                {header}
              </div>
            </div>
            <div
              className={cn(
                'grid min-h-0 grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_360px]',
                mobileGridClassName,
              )}
            >
              <div
                className={cn(
                  'flex min-w-0 flex-col gap-2',
                  mobileLeftClassName,
                )}
              >
                {left}
              </div>
              <div className="hidden md:block">
                <div className="sticky top-0">{right}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1080px] px-4 md:px-1">
          {mobileActions}
        </div>
      </>
    </DetailTooltipBoundaryContext.Provider>
  );
}

export function AboutPerformanceTabs({
  about,
  performance,
  defaultValue = 'about',
  contentWrapClassName = 'mt-2',
}: {
  about: ReactNode;
  performance: ReactNode;
  defaultValue?: 'about' | 'performance';
  contentWrapClassName?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <ModuleCard className="rounded-2xl p-3 md:h-full">
      <TradeTabs
        value={value}
        onValueChange={(next) => setValue(next as 'about' | 'performance')}
        contentAnimation="height"
        listLayoutClassName="flex"
        listClassName="gap-1 justify-start"
        activeBarClassName="bg-bg-3 rounded-lg"
        labelClassName="h-auto flex-none grow-0 rounded-lg px-3 py-1.5 text-xs data-[state=active]:text-t-1100"
        contentWrapClassName={contentWrapClassName}
        options={[
          {
            value: 'about',
            label: <Trans>About</Trans>,
            content: about,
          },
          {
            value: 'performance',
            label: <Trans>Your Performance</Trans>,
            content: performance,
          },
        ]}
      />
    </ModuleCard>
  );
}
export function AboutPerformanceTabsSkeleton({
  aboutContent,
  defaultValue = 'about',
}: {
  aboutContent?: ReactNode;
  defaultValue?: 'about' | 'performance';
}) {
  const isPerformance = defaultValue === 'performance';
  return (
    <ModuleCard className="rounded-2xl p-3 md:h-full">
      <div className="mb-3 flex gap-1">
        <div
          className={`h-[26.4px] w-17 rounded-lg ${isPerformance ? '' : 'bg-bg-3'}`}
        />
        <div
          className={`h-[26.4px] w-26 rounded-lg ${isPerformance ? 'bg-bg-3' : ''}`}
        />
      </div>
      <div className="space-y-3">
        {isPerformance ? (
          <div className="divide-border divide-y">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className={cn('space-y-2', index === 0 ? 'pb-3' : 'py-3')}
              >
                <div className="bg-bg-3 h-[14.4px] w-24 rounded-xl" />
                <div className="bg-bg-3 h-[19.2px] w-32 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          (aboutContent ?? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="bg-bg-3 h-[14.4px] w-20 rounded-xl" />
                  <div className="bg-bg-3 h-[14.4px] w-24 rounded-xl" />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </ModuleCard>
  );
}
