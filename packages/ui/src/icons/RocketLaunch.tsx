import { FC } from 'react';
import { IconProps } from './types';

const RocketLaunchIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M3.19582 14.9999C2.49999 15.8665 2.5 17.4998 2.5 17.4998C2.5 17.4998 4.13331 17.5332 4.99997 16.6665"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.99997 9.58324L2.5 8.13326L4.55853 5.94099C5.31499 5.13539 6.51062 4.92202 7.49905 5.41623L8.33333 5.83337"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.8333 14.5833L12.0833 17.5L14.267 15.5589C15.2244 14.7078 15.6095 13.3834 15.2576 12.1518L14.9999 11.25"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.4083 2.60722C18.3333 10.8333 11.1753 14.3305 7.47705 15.8333L4.16663 12.5268C7.45395 3.34618 14.395 2.06076 17.4083 2.60722Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 8.33335C12.9602 8.33335 13.3333 7.96026 13.3333 7.50002C13.3333 7.03978 12.9602 6.66669 12.5 6.66669C12.0397 6.66669 11.6666 7.03978 11.6666 7.50002C11.6666 7.96026 12.0397 8.33335 12.5 8.33335Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default RocketLaunchIcon;
