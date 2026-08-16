import { FC } from 'react';
import { IconProps } from './types';

const XLgIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.05861 7.99992L2.33333 12.7252L3.27468 13.6666L7.99999 8.94129L12.7253 13.6666L13.6667 12.7252L8.94138 7.99992L13.6667 3.27466L12.7253 2.33325L7.99999 7.05854L3.27468 2.33325L2.33333 3.27466L7.05861 7.99992Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default XLgIcon;
