import { FC } from 'react';
import { IconProps } from './types';

const ArrowRight2Icon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      {...props}
    >
      <path
        d="M20 21.3334L25.3333 16.0001L20 10.6667"
        stroke="currentColor"
        strokeWidth="2.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25.3333 16L6.66665 16"
        stroke="currentColor"
        strokeWidth="2.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ArrowRight2Icon;
