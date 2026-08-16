import { FC } from 'react';
import { IconProps } from './types';

const ChevronRightIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M9.9887 18.0089L8.57739 16.5971L13.1741 12.0022L8.57852 7.42301L9.98757 6.00891L16 11.9999L9.9887 18.0089Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ChevronRightIcon;
