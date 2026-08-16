import { FC } from 'react';
import { IconProps } from './types';

const CircleArrowUpIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <rect
        width="24"
        height="24"
        rx="12"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.58 11.32V14.92H11.42V11.32L9.91 12.82L9.08 12L12 9.08L14.92 12L14.09 12.82L12.58 11.32Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default CircleArrowUpIcon;
