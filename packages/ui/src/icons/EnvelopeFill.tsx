import { FC } from 'react';
import { IconProps } from './types';

const EnvelopeFillIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M1.3335 2.66669V3.33335V4.00002V11.3334C1.3335 12.4379 2.22893 13.3334 3.3335 13.3334H12.6668C13.7714 13.3334 14.6668 12.4379 14.6668 11.3334V4.00002V3.33335V2.66669H1.3335ZM13.1853 4.00002H2.81498L8.00016 8.66669L13.1853 4.00002Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default EnvelopeFillIcon;
