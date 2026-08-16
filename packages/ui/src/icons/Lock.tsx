import { FC } from 'react';
import { IconProps } from './types';

const LockIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M8.00008 2.66668C6.89551 2.66668 6.00008 3.56211 6.00008 4.66668V7.33334H10.0001V4.66668C10.0001 3.56211 9.10465 2.66668 8.00008 2.66668ZM4.66675 4.66668V7.33334H2.66675V12.9428L4.39059 14.6667L11.6096 14.667L13.3334 12.9428V7.33334H11.3334V4.66668C11.3334 2.82573 9.84103 1.33334 8.00008 1.33334C6.15913 1.33334 4.66675 2.82573 4.66675 4.66668ZM4.00008 8.66668V12.3905L4.9429 13.3334L11.0572 13.3336L12.0001 12.3906V8.66668H4.00008ZM7.33342 10V12H8.66675V10H7.33342Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default LockIcon;
