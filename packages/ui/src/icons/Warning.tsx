import { FC } from 'react';
import { IconProps } from './types';

const WarningIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M10 6.66666V12.5"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 15H10.0001"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.19168 15.0301L8.53956 3.48854C9.17277 2.33725 10.8271 2.33725 11.4603 3.48854L17.8082 15.0301C18.4191 16.1409 17.6155 17.5 16.3478 17.5H3.65204C2.38437 17.5 1.58076 16.1409 2.19168 15.0301Z"
        stroke="currentColor"
        strokeWidth="1.66667"
      />
    </svg>
  );
};

export default WarningIcon;
