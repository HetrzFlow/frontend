import { FC } from 'react';
import { IconProps } from './types';

const DashIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M21 13H3V11H21V13Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default DashIcon;
