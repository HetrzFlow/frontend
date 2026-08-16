import { FC } from 'react';
import { IconProps } from './types';

const ExclamationCircleIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM13.4549 7.54152C13.4792 7.25001 13.2491 7 12.9566 7H11.0434C10.7509 7 10.5208 7.25004 10.5452 7.54156L11.0004 13H13L13.4549 7.54152ZM12 14C11.1716 14 10.5 14.6716 10.5 15.5C10.5 16.3284 11.1716 17 12 17C12.8284 17 13.5 16.3284 13.5 15.5C13.5 14.6716 12.8284 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ExclamationCircleIcon;
