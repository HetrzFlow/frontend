import { FC } from 'react';
import { IconProps } from './types';

const ArrowDownIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 15 18 L 15 9 H 17 L 17 18 L 21 14 L 22.5 15.5 L 16 22 L 9.5 15.5 L 11 14 L 15 18 Z"
        // d="M14.6663 17.5621L14.6661 9.33337H17.3328L17.333 17.5621L20.7808 14.1144L22.6664 16L15.9997 22.6667L9.33301 16L11.2186 14.1144L14.6663 17.5621Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowDownIcon;
