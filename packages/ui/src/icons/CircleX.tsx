import { FC } from 'react';
import { IconProps } from './types';

const CircleXIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM8 14.5901L10.5887 12L8 9.40988L9.41354 8L12 10.5879L14.5865 8L16 9.40988L13.4113 12L16 14.5901L14.5865 16L12 13.4121L9.41354 16L8 14.5901Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
};

export default CircleXIcon;
