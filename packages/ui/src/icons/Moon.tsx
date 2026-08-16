import { FC } from 'react';
import { IconProps } from './types';

const MoonIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M21 16C20 16 19.3331 16 18.5 16C13.8056 16 10 12.1944 10 7.5C10 6.29275 10.2517 5.14428 10.7054 4.1042C11.0361 3.34635 11.474 2.64605 12 2.02248C12.0063 2.01498 12.0127 2.0075 12.019 2.00002L12 2C11.0806 2 10.1901 2.12409 9.34445 2.35643C5.11053 3.5197 2 7.3966 2 12C2 17.5228 6.47715 22 12 22C15.6341 22 19.7944 19.6169 21 16ZM17.2476 17.9261C15.9222 19.2475 14.11 20 12 20C7.58172 20 4 16.4183 4 12C4 8.90577 5.75667 6.22184 8.32711 4.8911C8.11359 5.72557 8 6.59983 8 7.5C8 12.8752 12.039 17.307 17.2476 17.9261Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default MoonIcon;
