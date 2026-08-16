import { FC } from 'react';
import { IconProps } from './types';

const TrendingUpIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M18.8736 7H13.8736V9H16.4594L12.8736 12.5858L10.5807 10.2929L9.87361 9.58579L9.1665 10.2929L4.1665 15.2929L5.58072 16.7071L9.87361 12.4142L12.1665 14.7071L12.8736 15.4142L13.5807 14.7071L17.8736 10.4142V13H19.8736V8V7H18.8736Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default TrendingUpIcon;
