import { FC } from 'react';
import { IconProps } from './types';

const ArrowDownUpIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M5.99994 4L6.00003 16.1716L3.41421 13.5858L2 15L7.00003 20L12 15L10.5858 13.5858L8.00003 16.1716L7.99994 4H5.99994ZM15.9999 20L16 7.82843L13.4142 10.4142L12 9.00003L17 4L22 9.00003L20.5858 10.4142L18 7.82843L17.9999 20H15.9999Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowDownUpIcon;
