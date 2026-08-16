'use client';

import { ReactNode } from 'react';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';

interface MetricInfoProps {
  label: string;
  title: string;
  description?: ReactNode;
  className?: string;
  triggerClassName?: string;
  onClick?: () => void;
  children?: ReactNode;
  hideTooltipTitle?: boolean;
}

const MetricContent = ({
  title,
  description,
  hideTooltipTitle,
}: Pick<MetricInfoProps, 'title' | 'description' | 'hideTooltipTitle'>) => (
  <>
    {hideTooltipTitle ? null : (
      <div className="flex h-[14px] w-full flex-col items-start">
        <div className="flex w-full items-center justify-between">
          <div className="flex min-w-0 flex-1 flex-col justify-center text-[13px] leading-[1.2] font-medium text-white">
            {title}
          </div>
        </div>
      </div>
    )}
    {description ? (
      <div className="flex w-full flex-col items-start">
        <div className="text-t-270 flex w-full flex-col justify-center text-xs">
          {description}
        </div>
      </div>
    ) : null}
  </>
);

export const MetricInfo = ({
  label,
  title,
  description,
  className,
  triggerClassName,
  onClick,
  children,
  hideTooltipTitle,
}: MetricInfoProps) => {
  const trigger = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-[13px] leading-normal tracking-[-0.52px] whitespace-nowrap text-white/70 underline decoration-dotted underline-offset-3 transition-colors hover:text-white',
        triggerClassName,
        className,
      )}
    >
      {children ?? label}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className={cn(
          'bg-bg-4 flex flex-col gap-2 rounded-xl border-0 p-3 shadow-none',
          description ? 'w-[374px] max-w-[374px]' : 'w-fit',
        )}
      >
        <MetricContent
          title={title}
          description={description}
          hideTooltipTitle={hideTooltipTitle}
        />
      </TooltipContent>
    </Tooltip>
  );
};
