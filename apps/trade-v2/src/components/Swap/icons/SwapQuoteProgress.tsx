import type { ComponentProps, FC } from 'react';

const CIRCUMFERENCE = 2 * Math.PI * 5;

const SwapQuoteProgressIcon: FC<
  ComponentProps<'svg'> & { size?: number }
> = ({ size = 12, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="none"
    {...props}
  >
    <circle
      cx="6"
      cy="6"
      r="5"
      transform="rotate(-90 6 6)"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray={CIRCUMFERENCE}
      strokeDashoffset={CIRCUMFERENCE}
    >
      <animate
        attributeName="stroke-dashoffset"
        from={CIRCUMFERENCE}
        to="0"
        dur="1s"
        repeatCount="indefinite"
        calcMode="linear"
      />
    </circle>
  </svg>
);

export default SwapQuoteProgressIcon;
