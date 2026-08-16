import { FC } from 'react';
import { IconProps } from './types';

const GridFillIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 1.6665V5H1.66667V1.6665H5ZM6.33334 1.6665V5H9.66667V1.6665H6.33334ZM11 1.6665V5H14.3333V1.6665H11ZM14.3333 6.33334H11V9.66667H14.3333V10.3333V6.33334ZM14.3333 11L11 11V14.3333H9.66667V11H6.33334V14.3333H5V11H1.66667V10.3333V14.3333H14.3333V11ZM1.66667 9.66667H5V6.33334H1.66667V9.66667ZM6.33334 9.66667V6.33334H9.66667V9.66667H6.33334Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default GridFillIcon;
