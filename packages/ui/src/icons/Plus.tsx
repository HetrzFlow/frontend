import { FC } from 'react';
import { IconProps } from './types';

const PlusIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M11 11V3H13V11H21V13H13V21H11V13H3V11H11Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default PlusIcon;
