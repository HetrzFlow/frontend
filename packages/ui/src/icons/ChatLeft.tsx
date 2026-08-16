import { FC } from 'react';
import { IconProps } from './types';

const ChatLeftIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M2 14.6667L3.41421 13.2525C3.78929 12.8774 4.29799 12.6667 4.82843 12.6667H12C13.1046 12.6667 14 11.7712 14 10.6667V2H4C2.89543 2 2 2.89543 2 4V14.6667ZM12.6667 3.33333H4C3.63181 3.33333 3.33333 3.63181 3.33333 4V11.6874C3.79308 11.4567 4.30439 11.3333 4.82843 11.3333H12C12.3682 11.3333 12.6667 11.0349 12.6667 10.6667V3.33333Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ChatLeftIcon;
