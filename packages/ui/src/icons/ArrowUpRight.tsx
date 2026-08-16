import { FC } from 'react';
import { IconProps } from './types';

const ArrowUpRightIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.6679 2.33447H5.25127V3.50114H9.67631L2.33228 10.8406L3.15723 11.6656L10.5013 4.3261V8.75114H11.6679V2.33447Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowUpRightIcon;
