import type { FC } from 'react';

import type { IconProps } from './types';

const SwapNavIcon: FC<IconProps> = ({ size = 14, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.91666 9.33328H11.6667V10.4999H2.91666V9.33328Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.0833 3.49995H2.33333V4.66661H11.0833V3.49995Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.07496 7.58328L3.74162 9.91661L6.07496 12.2499L5.25 13.0749L2.09171 9.91661L5.25 6.75832L6.07496 7.58328Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.92504 1.74995L10.2584 4.08328L7.92504 6.41661L8.75 7.24157L11.9083 4.08328L8.75 0.924988L7.92504 1.74995Z"
      fill="currentColor"
    />
  </svg>
);

export default SwapNavIcon;
