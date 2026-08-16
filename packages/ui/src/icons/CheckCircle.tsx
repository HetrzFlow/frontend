import { FC } from 'react';
import { IconProps } from './types';

const CheckCircleIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM10.9197 15.5038L16.5 9.91684L15.0866 8.50282L10.9195 12.6751L8.91318 10.6664L7.49999 12.0806L10.9197 15.5038Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default CheckCircleIcon;
