import { FC } from 'react';
import { IconProps } from './types';

const ArrowRightShortIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.17157 6.00005L0 6.00019V4.00019L6.17157 4.00005L3.58579 1.41421L5 0L10 5.00005L5 10L3.58579 8.58582L6.17157 6.00005Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowRightShortIcon;
