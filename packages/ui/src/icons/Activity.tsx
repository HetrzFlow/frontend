import { FC } from 'react';
import { IconProps } from './types';

const ActivityIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.5123 2.82788L14.6817 9.16667H18.3333V10.8333H13.6516L11.821 7.17213L8.48766 17.1721L5.31826 10.8333H1.66663V9.16667H6.34832L8.17892 12.8279L11.5123 2.82788Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ActivityIcon;
