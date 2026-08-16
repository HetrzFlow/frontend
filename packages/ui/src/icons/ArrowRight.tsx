import { FC } from 'react';
import { IconProps } from './types';

const ArrowRightIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.9009 10.7946L2.05881 10.7946V9.2064L14.9009 9.20632L10.4652 4.77051L11.5882 3.64746L17.9412 10.0004L11.5882 16.3534L10.4652 15.2303L14.9009 10.7946Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowRightIcon;
