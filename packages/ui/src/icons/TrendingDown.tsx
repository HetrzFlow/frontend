import { FC } from 'react';
import { IconProps } from './types';

const TrendingDownIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 25 24"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.207 16.7071H14.207V14.7071H16.7928L13.207 11.1213L10.9141 13.4142L10.207 14.1213L9.49988 13.4142L4.49988 8.4142L5.91409 6.99998L10.207 11.2929L12.4999 8.99998L13.207 8.29288L13.9141 8.99998L18.207 13.2929V10.7071H20.207V15.7071V16.7071H19.207Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default TrendingDownIcon;
