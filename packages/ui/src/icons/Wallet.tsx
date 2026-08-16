import { FC } from 'react';
import { IconProps } from './types';

const WalletIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M3.33325 2.66666C2.22868 2.66666 1.33325 3.56209 1.33325 4.66666V10.6667C1.33325 12.1394 2.52716 13.3333 3.99992 13.3333H13.9999H14.6666V12.6667V5.99999V5.33332H13.9999H13.3333V3.33332V2.66666H12.6666H3.33325ZM2.66659 10.6667V6.55285C2.8751 6.62655 3.09949 6.66666 3.33325 6.66666H13.3333V12H3.99992C3.26354 12 2.66659 11.403 2.66659 10.6667ZM3.33325 5.33332H11.9999V3.99999H3.33325C2.96506 3.99999 2.66659 4.29847 2.66659 4.66666C2.66659 5.03485 2.96506 5.33332 3.33325 5.33332ZM11.9999 8.66666H9.99992V9.99999H11.9999V8.66666Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default WalletIcon;
