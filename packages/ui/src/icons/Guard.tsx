import { FC } from 'react';
import { IconProps } from './types';

const GuardIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M10.25 2.3L16.85 5.05V11.65C16.75 16 10.25 17.7 10.25 17.7C10.25 17.7 3.65002 16 3.65002 11.65V5.05L10.25 2.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10.25 7.8L12.1552 8.9V11.1L10.25 12.2L8.34473 11.1V8.9L10.25 7.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
};

export default GuardIcon;
