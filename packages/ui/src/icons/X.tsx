import { FC } from 'react';
import { IconProps } from './types';

const XIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M10.5879 12L6.5 16.0879L7.91203 17.5L12 13.4121L16.088 17.5L17.5 16.0879L13.4121 12L17.5 7.91211L16.088 6.5L12 10.5879L7.91203 6.5L6.5 7.91211L10.5879 12Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default XIcon;
