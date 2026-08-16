import { FC } from 'react';
import { IconProps } from './types';

const CopyIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M13 1.90039C13.6075 1.90039 14.0996 2.39249 14.0996 3V11C14.0996 11.6075 13.6075 12.0996 13 12.0996H12.0996V13C12.0996 13.6075 11.6075 14.0996 11 14.0996H3C2.39249 14.0996 1.90039 13.6075 1.90039 13V5C1.90039 4.39249 2.39249 3.90039 3 3.90039H3.90039V3C3.90039 2.39249 4.39249 1.90039 5 1.90039H13ZM3.09961 12.9004H10.9004V5.09961H3.09961V12.9004ZM5.09961 3.90039H11C11.6075 3.90039 12.0996 4.39249 12.0996 5V10.9004H12.9004V3.09961H5.09961V3.90039Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default CopyIcon;
