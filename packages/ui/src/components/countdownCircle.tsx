import { ComponentProps, FC } from 'react';

interface CountdownCircleProps extends ComponentProps<'svg'> {
  size?: number;
  duration?: number;
  rotate?: number;
}

const CountdownCircle: FC<CountdownCircleProps> = ({
  duration = 5,
  size = 14,
  rotate = 0,
  ...props
}) => {
  const PI = Math.PI;
  const strokeDasharray = 9 * PI * 2;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 18 18`}
      {...props}
      id="countdownCircle"
    >
      <g transform={`rotate(${rotate})`}>
        <circle
          cx="9"
          cy="9"
          r={8}
          fill="transparent"
          stroke="var(--bg-3)"
          strokeWidth={2}
        />
        <circle
          cx="9"
          cy="9"
          r={8}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={0}
        >
          <animate
            attributeName="stroke-dashoffset"
            values={`0;${-strokeDasharray}`}
            begin="countdownCircle.click; 0s"
            repeatCount="indefinite"
            dur={`${duration || 5}s`}
          ></animate>
        </circle>
      </g>
    </svg>
  );
};

export { CountdownCircle };
