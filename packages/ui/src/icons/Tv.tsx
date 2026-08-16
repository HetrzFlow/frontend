import { FC } from 'react';
import { IconProps } from './types';

const TvIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M2.66671 2C1.93033 2 1.33337 2.59695 1.33337 3.33333V10C1.33337 10.7364 1.93033 11.3333 2.66671 11.3333H6.66671H7.33337V12.6667H5.33337V14H10.6667V12.6667H8.66671V11.3333H9.33337H13.3334C14.0698 11.3333 14.6667 10.7364 14.6667 10V3.33333C14.6667 2.59695 14.0698 2 13.3334 2H2.66671ZM2.66671 3.33333L13.3334 3.33333V10H9.33337H6.66671H2.66671V3.33333Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default TvIcon;
