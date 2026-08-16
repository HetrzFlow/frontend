import { ReactNode } from 'react';
import { SkeletonLayout, cn } from '@repo/ui';

interface OverviewMetricItemSkeletonProps {
  title: ReactNode;
  skeletonClassName: string;
  triggerClassName?: string;
  titleClassName?: string;
}

const OverviewMetricItemSkeleton = ({
  title,
  skeletonClassName,
  triggerClassName,
  titleClassName,
}: OverviewMetricItemSkeletonProps) => (
  <div className={cn('space-y-2 transition-colors', triggerClassName)}>
    <SkeletonLayout isLoading className={skeletonClassName} />
    <div className={cn('text-t-270 text-xs', titleClassName)}>{title}</div>
  </div>
);

export default OverviewMetricItemSkeleton;
