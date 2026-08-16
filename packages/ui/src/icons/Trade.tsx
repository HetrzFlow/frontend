import { FC } from 'react';
import { IconProps } from './types';

const TradeIcon: FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M18.5004 16L16.0004 19L13.5004 16L16.0004 13L18.5004 16ZM17.4672 11H15.8666V3.2998H4.13318V16.7002H11.5004V18.2998H2.53357V1.7002H17.4672V11ZM11.0004 11.7998H7.00037V10.2002H11.0004V11.7998ZM13.0004 7.7998H7.00037V6.2002H13.0004V7.7998Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default TradeIcon;
