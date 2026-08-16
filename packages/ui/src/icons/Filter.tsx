import { FC } from 'react';
import { IconProps } from './types';

const FilterIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.16675 5.24992H12.8334V4.08325H1.16675V5.24992ZM11.0834 7.58325H2.91675V6.41659H11.0834V7.58325ZM9.33342 9.91659H4.66675V8.74992H9.33342V9.91659Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default FilterIcon;
