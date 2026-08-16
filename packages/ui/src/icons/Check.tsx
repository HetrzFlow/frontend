import { FC } from 'react';
import { IconProps } from './types';

const CheckIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M18 9.41403L11.4197 16.001L7 11.5778L8.4132 10.1636L11.4195 13.1723L16.5867 8L18 9.41403Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default CheckIcon;
