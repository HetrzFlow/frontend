import { FC } from 'react';
import { IconProps } from './types';

const CopyOutlineIcon: FC<IconProps> = ({ size = 16, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      {...props}
    >
      <rect
        x="2"
        y="4.66666"
        width="9.33333"
        height="9.33333"
        rx="2.66667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinejoin="round"
      />
      <path
        d="M11.3333 11.3333C12.8061 11.3333 14 10.1394 14 8.66667V4.66667C14 3.19391 12.8061 2 11.3333 2H7.33329C5.86053 2 4.66663 3.19391 4.66663 4.66667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CopyOutlineIcon;
