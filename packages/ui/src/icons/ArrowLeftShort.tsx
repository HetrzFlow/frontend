import { FC } from 'react';
import { IconProps } from './types';

const ArrowLeftShortIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M10.8284 13L17 13.0002V11.0002L10.8284 11L13.4142 8.41421L12 7L7 12L12 17L13.4142 15.5858L10.8284 13Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowLeftShortIcon;
