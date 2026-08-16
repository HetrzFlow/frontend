import { FC } from 'react';
import { IconProps } from './types';

const LinkIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M6 11.3334H4.66667C3.19391 11.3334 2 10.1394 2 8.66669V7.33335C2 5.86059 3.19391 4.66669 4.66667 4.66669H6"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
      />
      <path
        d="M6 8H10"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
      />
      <path
        d="M10 11.3334H11.3333C12.8061 11.3334 14 10.1394 14 8.66669V7.33335C14 5.86059 12.8061 4.66669 11.3333 4.66669H10"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default LinkIcon;
