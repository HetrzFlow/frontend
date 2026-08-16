import { FC } from 'react';
import { IconProps } from './types';

const MoreIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M3.33337 10L3.33337 10.0001"
        stroke="currentColor"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 10L10 10.0001"
        stroke="currentColor"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.6667 10L16.6667 10.0001"
        stroke="currentColor"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MoreIcon;
