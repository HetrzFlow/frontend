import { FC } from 'react';
import { IconProps } from './types';

const LogoutIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M13.3334 3.33334V14.6667H4.66669C3.56212 14.6667 2.66669 13.7712 2.66669 12.6667V10.6667H4.00003V12.6667C4.00003 13.0349 4.2985 13.3333 4.66669 13.3333H12V3.33334C12 2.96515 11.7015 2.66668 11.3334 2.66668H4.00003V5.33334H2.66669V1.33334H11.3334C12.4379 1.33334 13.3334 2.22877 13.3334 3.33334ZM7.33336 4.66662L10.6667 8.00006L7.33336 11.3334L6.39055 10.3906L8.11441 8.66673L1.33334 8.66679V7.33346L8.11441 7.3334L6.39055 5.60943L7.33336 4.66662Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default LogoutIcon;
