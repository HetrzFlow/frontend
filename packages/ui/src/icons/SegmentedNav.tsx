import { FC } from 'react';
import { IconProps } from './types';

const SegmentedNavIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 17"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.66671 5.83333C1.93033 5.83333 1.33337 6.43028 1.33337 7.16666V9.83333C1.33337 10.5697 1.93033 11.1667 2.66671 11.1667H13.3334C14.0698 11.1667 14.6667 10.5697 14.6667 9.83333V7.16666C14.6667 6.43028 14.0698 5.83333 13.3334 5.83333H2.66671ZM6.66671 9.83333V7.16666H9.33337V9.83333H6.66671ZM10.6667 9.83333V7.16666H13.3334V9.83333H10.6667Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default SegmentedNavIcon;
