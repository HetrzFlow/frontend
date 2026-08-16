'use client';

import { createContext, ReactNode, use, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';

const DashboardOverviewTooltipBoundaryContext = createContext<Element | null>(
  null,
);

interface DashboardOverviewTooltipBoundaryProps {
  children: ReactNode;
  className?: string;
}

interface DashboardOverviewTooltipProps {
  children: ReactNode;
  tips: ReactNode;
}

export const DashboardOverviewTooltipBoundary = ({
  children,
  className,
}: DashboardOverviewTooltipBoundaryProps) => {
  const [boundaryEl, setBoundaryEl] = useState<HTMLDivElement | null>(null);

  return (
    <DashboardOverviewTooltipBoundaryContext.Provider value={boundaryEl}>
      <div ref={setBoundaryEl} className={className}>
        {children}
      </div>
    </DashboardOverviewTooltipBoundaryContext.Provider>
  );
};

export const DashboardOverviewTooltip = ({
  children,
  tips,
}: DashboardOverviewTooltipProps) => {
  const boundaryEl = use(DashboardOverviewTooltipBoundaryContext);

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={0}
        collisionBoundary={boundaryEl ? [boundaryEl] : undefined}
        collisionPadding={{ top: -500, bottom: -500 }}
        className="flex max-w-90 flex-col gap-2 rounded-2xl p-3 text-xs"
      >
        {tips}
      </TooltipContent>
    </Tooltip>
  );
};
