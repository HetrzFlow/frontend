'use client';

import {
  ComponentProps,
  ComponentPropsWithoutRef,
  ReactNode,
  forwardRef,
} from 'react';
import { truncateFormat, unitFormat } from '@repo/lib/format';
import {
  cn,
  SkeletonLayout,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { SlotCounterValue } from '@/components/SlotCounterValue';

type OverviewMetricRawValue = Parameters<typeof unitFormat>[0];
type OverviewMetricFormatOptions = Parameters<typeof unitFormat>[2];

interface OverviewMetricItemTriggerProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  title: string;
  value?: string;
  rawValue?: OverviewMetricRawValue;
  formatDecimal?: number;
  formatOptions?: OverviewMetricFormatOptions;
  isLoading: boolean;
  skeletonClassName: string;
  wrapClassName: string;
  triggerClassName?: string;
  titleClassName?: string;
  valueClassName?: string;
  disabledFormat?: boolean;
}

interface OverviewMetricItemProps extends OverviewMetricItemTriggerProps {
  tips: ReactNode;
  tooltipContentClassName?: string;
  tooltipContentProps?: ComponentProps<typeof TooltipContent>;
  disableInteraction?: boolean;
}

export const OverviewMetricItemTrigger = forwardRef<
  HTMLDivElement,
  OverviewMetricItemTriggerProps
>(
  (
    {
      title,
      value,
      rawValue,
      formatDecimal,
      formatOptions,
      isLoading,
      skeletonClassName,
      wrapClassName,
      triggerClassName,
      className,
      titleClassName,
      valueClassName,
      disabledFormat = false,
      ...triggerProps
    },
    ref,
  ) => {
    const displayValue =
      rawValue !== undefined
        ? disabledFormat
          ? truncateFormat(rawValue, formatDecimal, formatOptions)
          : unitFormat(rawValue, formatDecimal, formatOptions)
        : (value ?? '');

    return (
      <div
        ref={ref}
        {...triggerProps}
        className={cn(
          'space-y-2 transition-colors',
          triggerClassName,
          className,
        )}
      >
        <SkeletonLayout isLoading={isLoading} className={skeletonClassName}>
          <div
            className={cn(
              'text-t-1100 text-sm font-medium',
              wrapClassName,
              valueClassName,
            )}
          >
            <SlotCounterValue
              value={displayValue}
              className="text-t-1100 [&_*]:text-t-1100"
              disabledFormat={disabledFormat}
            />
          </div>
        </SkeletonLayout>
        <div className={cn('text-t-270 text-xs', titleClassName)}>{title}</div>
      </div>
    );
  },
);
OverviewMetricItemTrigger.displayName = 'OverviewMetricItemTrigger';

const OverviewMetricItem = ({
  title,
  value,
  rawValue,
  formatDecimal,
  formatOptions,
  tips,
  isLoading,
  skeletonClassName,
  wrapClassName,
  triggerClassName,
  titleClassName,
  valueClassName,
  tooltipContentClassName,
  tooltipContentProps,
  disabledFormat = false,
  disableInteraction = false,
}: OverviewMetricItemProps) => {
  const {
    side = 'bottom',
    sideOffset,
    className: tooltipPropsClassName,
    ...restTooltipProps
  } = tooltipContentProps ?? {};
  const trigger = (
    <OverviewMetricItemTrigger
      title={title}
      value={value}
      rawValue={rawValue}
      formatDecimal={formatDecimal}
      formatOptions={formatOptions}
      isLoading={isLoading}
      skeletonClassName={skeletonClassName}
      wrapClassName={wrapClassName}
      triggerClassName={triggerClassName}
      titleClassName={titleClassName}
      valueClassName={valueClassName}
      disabledFormat={disabledFormat}
    />
  );

  if (disableInteraction) {
    return trigger;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        className={cn(
          'flex max-w-90 flex-col gap-2 rounded-2xl p-3 text-xs',
          tooltipContentClassName,
          tooltipPropsClassName,
        )}
        {...restTooltipProps}
      >
        {tips}
      </TooltipContent>
    </Tooltip>
  );
};

export default OverviewMetricItem;
