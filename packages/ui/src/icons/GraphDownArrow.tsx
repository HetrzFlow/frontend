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
        d="M2 4V19V20H3H22V18H4V4H2ZM21 15H16V13H18.5858L15 9.41421L12.7071 11.7071L12 12.4142L11.2929 11.7071L6.29289 6.70711L7.70711 5.29289L12 9.58579L14.2929 7.29289L15 6.58579L15.7071 7.29289L20 11.5858V9H22V14V15H21Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default GraphUpArrowIcon;
