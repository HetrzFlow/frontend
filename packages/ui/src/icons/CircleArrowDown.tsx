import { FC } from 'react';
import { IconProps } from './types';

const CircleArrowDownIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <rect
        width="24"
        height="24"
        rx="12"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.42 12.68V9.08H12.58V12.68L14.09 11.18L14.92 12L12 14.92L9.08 12L9.91 11.18L11.42 12.68Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default CircleArrowDownIcon;
