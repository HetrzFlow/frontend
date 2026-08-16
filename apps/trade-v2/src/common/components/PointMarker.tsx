import { FC } from 'react';
import { cn } from '@repo/ui';

interface MarkerProps {
  status: 'success' | 'warning' | 'failed';
  className?: string;
}

const PointMarker: FC<MarkerProps> = ({ className, status }) => {
  const configs = {
    success: {
      bgColor: 'bg-green',
      animationColor: 'bg-green/50',
    },
    warning: {
      bgColor: 'bg-warning',
      animationColor: 'bg-warning/50',
    },
    failed: {
      bgColor: 'bg-destructive',
      animationColor: 'bg-destructive/50',
    },
  };
  const config = configs[status];
  return (
    <div
      className={cn(
        'relative flex size-3 shrink-0 cursor-pointer items-center justify-center rounded-full',
        className,
      )}
    >
      <div
        className={cn(
          'animate-ripple absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full',
          config.animationColor,
        )}
      />
      <div
        // set key to void green to red animation (delay-800)
        key={status}
        className={cn(
          'animate-ripple absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full delay-800',
          config.animationColor,
        )}
      />
      <div className={cn('size-1 rounded-full', config.bgColor)} />
    </div>
  );
};

export default PointMarker;
