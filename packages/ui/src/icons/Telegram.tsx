import { FC } from 'react';
import { IconProps } from './types';

const TelegramIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M14.6582 3.41737C14.6962 3.18813 14.6051 2.95664 14.4192 2.81064C14.2333 2.66465 13.9812 2.62651 13.7584 2.71067L1.75841 7.244C1.50174 7.34096 1.33286 7.58126 1.33338 7.84878C1.33389 8.11631 1.50368 8.356 1.76072 8.45203L4.58527 9.50736L10.6667 5.6666C10.8653 5.53424 11.087 5.79815 10.9225 5.97095L6.41358 10.2969L11.9636 13.8912C12.1523 14.0134 12.3921 14.034 12.6 13.9459C12.8079 13.8578 12.9554 13.673 12.9915 13.4555L14.6582 3.41737Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default TelegramIcon;
