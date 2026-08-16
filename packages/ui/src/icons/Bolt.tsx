import { FC } from 'react';
import { IconProps } from './types';

const BoltIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M5.00326 12.508L5.58659 8.45833H2.88867L7.69548 1.52002H8.41342L7.83578 6.125H11.044L5.72119 12.508H5.00326Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default BoltIcon;
