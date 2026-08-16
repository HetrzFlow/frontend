import { FC } from 'react';
import { IconProps } from './types';

const ListIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 21 20"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.4 5.83329H3.39999V4.16663H18.4V5.83329ZM18.4 10.8333H3.39999V9.16663H18.4V10.8333ZM3.39999 15.8333H18.4V14.1666H3.39999V15.8333Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ListIcon;
