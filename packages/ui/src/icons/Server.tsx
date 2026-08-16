import { FC } from 'react';
import { IconProps } from './types';

const ServerIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M16 4.50003C16 5.75003 13.3137 7.00003 10 7.00003C6.68629 7.00003 4 5.75003 4 4.50003C4 3.25003 6.68629 2.00003 10 2.00003C13.3137 2.00003 16 3.25003 16 4.50003Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 4.5V15.1554C4.72727 15.9369 7.05455 17.5 10.5455 17.5C14.0364 17.5 15.6364 15.9369 16 15.1554V4.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 10.5C4.90909 11.1667 7.38182 12.5 10 12.5C12.6182 12.5 15.0909 11.1667 16 10.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
};

export default ServerIcon;
