import { FC } from 'react';
import { IconProps } from './types';

const GraphUpArrowIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 4V19V20H3H22V18H4V4H2ZM21 5H16V7H18.5858L15 10.5858L12.7071 8.29289L12 7.58579L11.2929 8.29289L6.29289 13.2929L7.70711 14.7071L12 10.4142L14.2929 12.7071L15 13.4142L15.7071 12.7071L20 8.41421V11H22V6V5H21Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default GraphUpArrowIcon;
