import { ComponentProps, FC } from 'react';

const CIRCUMFERENCE = 2 * Math.PI * 6;

const SwapProgressIcon: FC<ComponentProps<'svg'> & { size?: number }> = ({
  size = 16,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      {...props}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        transform="rotate(-90 8 8)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={CIRCUMFERENCE}
          to="0"
          dur="10s"
          repeatCount="indefinite"
          calcMode="linear"
        />
      </circle>
    </svg>
  );
};

export default SwapProgressIcon;
