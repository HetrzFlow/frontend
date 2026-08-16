import { FC } from 'react';
import { IconProps } from './types';

const ArrowClockwiseIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M8.74998 1.66666L11.6666 4.58332L8.74998 7.49999L7.92502 6.67503L9.4334 5.16665L6.99998 5.16663C5.06698 5.16663 3.49998 6.73363 3.49998 8.66662C3.49998 10.5996 5.06698 12.1666 6.99998 12.1666C8.93298 12.1666 10.5 10.5996 10.5 8.66662H11.6666C11.6666 11.244 9.57731 13.3333 6.99998 13.3333C4.42265 13.3333 2.33331 11.244 2.33331 8.66662C2.33331 6.0893 4.42265 3.99996 6.99998 3.99996L9.4334 3.99999L7.92502 2.49161L8.74998 1.66666Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowClockwiseIcon;
