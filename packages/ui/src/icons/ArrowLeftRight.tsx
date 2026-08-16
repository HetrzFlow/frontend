import { FC } from 'react';
import { IconProps } from './types';

const ArrowLeftRightIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 14 15"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.33331 11L9.4334 11L7.92501 12.5084L8.74996 13.3333L11.6666 10.4166L8.74996 7.49999L7.92501 8.32495L9.4334 9.83331L2.33331 9.83336V11ZM11.6666 5.16669L4.56656 5.16664L6.07495 6.67503L5.25 7.49999L2.33331 4.58331L5.25 1.66666L6.07495 2.49161L4.56656 3.99997L11.6666 4.00003V5.16669Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowLeftRightIcon;
