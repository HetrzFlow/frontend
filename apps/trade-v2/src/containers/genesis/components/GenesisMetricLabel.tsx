'use client';

import type { ComponentProps, ReactNode, Ref } from 'react';
import {
  cn,
  InfoCircleIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';

interface GenesisMetricLabelProps {
  label: string;
  tooltip: ReactNode;
  inDialog?: boolean;
  className?: string;
  triggerRef?: Ref<HTMLButtonElement>;
  tooltipContentProps?: ComponentProps<typeof TooltipContent>;
}

export const GenesisMetricLabel = ({
  label,
  tooltip,
  inDialog = false,
  className,
  triggerRef,
  tooltipContentProps,
}: GenesisMetricLabelProps) => {
  const { className: tooltipClassName, ...restTooltipContentProps } =
    tooltipContentProps ?? {};

  return (
    <div
      className={cn('text-t-350 flex items-center gap-1 text-xs', className)}
    >
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label={label}
            className="text-t-350 hover:text-t-1100 inline-flex items-center"
          >
            <InfoCircleIcon size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={5}
          inDialog={inDialog}
          className={cn(
            'z-[70] max-w-80 rounded-2xl p-3 text-xs',
            tooltipClassName,
          )}
          {...restTooltipContentProps}
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
