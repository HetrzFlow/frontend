import { FC } from 'react';
import { IconProps } from './types';

const MediumFillIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M12 12C12 14.7614 9.76142 17 7 17C4.23858 17 2 14.7614 2 12C2 9.23858 4.23858 7 7 7C9.76142 7 12 9.23858 12 12ZM19 12C19 14.4853 17.6569 16.5 16 16.5C14.3431 16.5 13 14.4853 13 12C13 9.51472 14.3431 7.5 16 7.5C17.6569 7.5 19 9.51472 19 12ZM21 16C21.5523 16 22 14.2091 22 12C22 9.79086 21.5523 8 21 8C20.4477 8 20 9.79086 20 12C20 14.2091 20.4477 16 21 16Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default MediumFillIcon;
