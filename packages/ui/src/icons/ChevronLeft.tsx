import { FC } from 'react';
import { IconProps } from './types';

const ChevronLeftIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.0113 18L15.4226 16.5882L10.826 11.9932L15.4215 7.4141L14.0125 6L8 11.991L14.0113 18Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ChevronLeftIcon;
