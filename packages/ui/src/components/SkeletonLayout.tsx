import { cn } from '../lib/utils';
import { Skeleton } from './skeleton';

type Props = React.PropsWithChildren<{
  isLoading: boolean;
  className?: string;
}>;
export const SkeletonLayout: React.FC<
  React.PropsWithChildren<{
    isLoading: boolean;
    className?: string;
  }>
> = ({ isLoading, children, className }: Props) => {
  if (isLoading) return <Skeleton className={cn('h-12 w-full', className)} />;
  return <>{children}</>;
};

SkeletonLayout.displayName = 'SkeletonLayout';
