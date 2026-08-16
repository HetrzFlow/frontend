import { FC } from 'react';
import { IconProps } from './types';

const ChevronDownIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M4 6.66742L4.94123 5.72655L8.0045 8.791L11.0573 5.7273L12 6.66667L8.006 10.675L4 6.66742Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ChevronDownIcon;
