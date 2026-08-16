import { FC } from 'react';
import { IconProps } from './types';

const EditIcon: FC<IconProps> = ({ size = 16, ...props }) => {
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
        d="M9.52605 2.47858L2.64762 8.95239L2.20801 11.0212C2.10908 11.4867 2.51575 11.9029 2.98344 11.8149L5.2381 11.3905L11.9597 5.0643C12.7045 4.3633 12.7045 3.17958 11.9597 2.47858C11.276 1.83516 10.2097 1.83516 9.52605 2.47858Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinejoin="round"
      />
      <path
        d="M2 14H12.6667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default EditIcon;
