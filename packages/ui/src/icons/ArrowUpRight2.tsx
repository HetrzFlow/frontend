import { FC } from 'react';
import { IconProps } from './types';

const ArrowUpRight2Icon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      {...props}
    >
      <path
        d="M5.24999 4.08333H9.91666L9.88732 8.75"
        stroke="currentColor"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.91666 4.08325L4.08332 9.91659"
        stroke="currentColor"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ArrowUpRight2Icon;
