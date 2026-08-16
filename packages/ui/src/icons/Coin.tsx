import { ComponentProps, FC } from 'react';
import { cn } from '../lib/utils';

const CoinIcon: FC<ComponentProps<'div'> & { size?: number }> = ({
  size = 36,
  className,
  ...props
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'bg-bg-6 flex items-center justify-center rounded-full text-white',
        className,
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={(size / 3) * 2}
        height={(size / 3) * 2}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="2"
        />
        <rect
          x="12"
          y="9.17154"
          width="4"
          height="4"
          transform="rotate(45 12 9.17154)"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

export default CoinIcon;
