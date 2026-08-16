import { FC } from 'react';
import { IconProps } from './types';

const ShareNetworkIcon: FC<IconProps> = ({ size = 16, ...props }) => {
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
        d="M11.3333 6.66666C12.4378 6.66666 13.3333 5.77123 13.3333 4.66666C13.3333 3.56209 12.4378 2.66666 11.3333 2.66666C10.2287 2.66666 9.33325 3.56209 9.33325 4.66666C9.33325 5.77123 10.2287 6.66666 11.3333 6.66666Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeMiterlimit="10"
      />
      <path
        d="M11.3333 13.3333C12.4378 13.3333 13.3333 12.4379 13.3333 11.3333C13.3333 10.2288 12.4378 9.33334 11.3333 9.33334C10.2287 9.33334 9.33325 10.2288 9.33325 11.3333C9.33325 12.4379 10.2287 13.3333 11.3333 13.3333Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeMiterlimit="10"
      />
      <path
        d="M4.66675 10C5.77132 10 6.66675 9.10457 6.66675 8C6.66675 6.89543 5.77132 6 4.66675 6C3.56218 6 2.66675 6.89543 2.66675 8C2.66675 9.10457 3.56218 10 4.66675 10Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeMiterlimit="10"
      />
      <path
        d="M6.66675 7.33333L9.33341 6"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeMiterlimit="10"
      />
      <path
        d="M9.33341 10.6667L6.66675 8.66666"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeMiterlimit="10"
      />
    </svg>
  );
};

export default ShareNetworkIcon;
