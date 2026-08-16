import { FC } from 'react';
import { IconProps } from './types';

const ArrowRightLeftIcon: FC<IconProps> = ({ size = 24, ...props }) => {
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
        d="M19.141 15.8545L19.0697 15.9248L15.2162 19.7793L15.1449 19.8496L13.9847 18.6885L13.9135 18.6182L13.9847 18.5479L15.808 16.7246H6.56677V14.9834H15.807L13.9135 13.0898L13.9847 13.0195L15.0746 11.9297L15.1449 11.8584L19.141 15.8545ZM10.5912 4.22168L11.681 5.31152L11.7523 5.38184L9.85876 7.27539H19.099V9.0166H9.85876L11.7523 10.9102L11.681 10.9805L10.5209 12.1416L10.4496 12.0713L6.59607 8.2168L6.52478 8.14648L10.5209 4.15039L10.5912 4.22168Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowRightLeftIcon;
