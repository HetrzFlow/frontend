import { FC } from 'react';
import { IconProps } from './types';

const GroupIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <g clipPath="url(#clip0_24874_8510)">
        <path
          d="M13.1122 9.21603C14.8441 9.21603 16.2481 7.81205 16.2481 6.08016C16.2481 4.34827 14.8441 2.94429 13.1122 2.94429C11.3803 2.94429 9.97632 4.34827 9.97632 6.08016C9.97632 7.81205 11.3803 9.21603 13.1122 9.21603Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeMiterlimit="10"
        />
        <path
          d="M5.27249 9.99999C6.57141 9.99999 7.62439 8.94701 7.62439 7.64809C7.62439 6.34917 6.57141 5.29619 5.27249 5.29619C3.97357 5.29619 2.92059 6.34917 2.92059 7.64809C2.92059 8.94701 3.97357 9.99999 5.27249 9.99999Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeMiterlimit="10"
        />
        <path
          d="M18.5999 17.0557V15.4878C18.5999 13.7559 17.1959 12.3519 15.4641 12.3519H10.7603C9.02836 12.3519 7.62439 13.7559 7.62439 15.4878V17.0557"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeMiterlimit="10"
        />
        <path
          d="M7.9632 11.5526C7.37543 11.9711 6.8858 12.5178 6.53448 13.1522H4.48859C3.19862 13.1523 2.15272 14.1982 2.15265 15.4881V16.2723H0.55304V15.4881C0.553107 13.3145 2.31497 11.5526 4.48859 11.5526H7.9632ZM10.5169 13.117C10.5036 13.1184 10.4901 13.1213 10.4769 13.1229C10.4899 13.1213 10.5028 13.1184 10.5159 13.117L10.7601 13.1043L10.5169 13.117Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_24874_8510">
          <rect width="20" height="20" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default GroupIcon;
