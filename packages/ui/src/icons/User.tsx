import { FC } from 'react';
import { IconProps } from './types';

const UserIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <circle cx="10" cy="10" r="10" fill="#2A434D" />
      <circle
        cx="10"
        cy="8"
        r="2.8272"
        fill="#19CCD9"
        stroke="url(#paint0_linear_28041_4224)"
        strokeWidth="0.3456"
      />
      <mask id="path-3-inside-1_28041_4224" fill="white">
        <path d="M10 13C13.0161 13 15.6407 14.6699 17.0039 17.1348C15.1997 18.9061 12.7281 20 10 20C7.27161 20 4.79937 18.9064 2.99512 17.1348C4.35823 14.6697 6.98376 13 10 13Z" />
      </mask>
      <path
        d="M10 13C13.0161 13 15.6407 14.6699 17.0039 17.1348C15.1997 18.9061 12.7281 20 10 20C7.27161 20 4.79937 18.9064 2.99512 17.1348C4.35823 14.6697 6.98376 13 10 13Z"
        fill="url(#paint1_linear_28041_4224)"
      />
      <path
        d="M17.0039 17.1348L17.3267 17.4636L17.5766 17.2182L17.4071 16.9118L17.0039 17.1348ZM2.99512 17.1348L2.59186 16.9118L2.42241 17.2182L2.67227 17.4636L2.99512 17.1348ZM10 13V13.4608C12.8415 13.4608 15.3153 15.0335 16.6007 17.3578L17.0039 17.1348L17.4071 16.9118C15.9662 14.3063 13.1906 12.5392 10 12.5392V13ZM17.0039 17.1348L16.6811 16.8059C14.9594 18.4963 12.6023 19.5392 10 19.5392V20V20.4608C12.8539 20.4608 15.44 19.3159 17.3267 17.4636L17.0039 17.1348ZM10 20V19.5392C7.39734 19.5392 5.03967 18.4965 3.31796 16.806L2.99512 17.1348L2.67227 17.4636C4.55907 19.3162 7.14589 20.4608 10 20.4608V20ZM2.99512 17.1348L3.39837 17.3578C4.68368 15.0334 7.15822 13.4608 10 13.4608V13V12.5392C6.80931 12.5392 4.03278 14.306 2.59186 16.9118L2.99512 17.1348Z"
        fill="url(#paint2_linear_28041_4224)"
        mask="url(#path-3-inside-1_28041_4224)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_28041_4224"
          x1="10"
          y1="5"
          x2="10"
          y2="11"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_28041_4224"
          x1="11"
          y1="10.5"
          x2="11"
          y2="21.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" />
          <stop offset="1" stopColor="#2A434D" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_28041_4224"
          x1="9.99951"
          y1="13"
          x2="9.99951"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default UserIcon;
