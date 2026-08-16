import { FC } from 'react';
import { IconPropsWithFilled } from './types';

const StarIcon: FC<IconPropsWithFilled> = ({
  size = 24,
  filled = false,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      {...props}
    >
      <path
        d="M7 1.75L8.71437 5.2237L12.5478 5.78073L9.77391 8.48463L10.4287 12.3026L7 10.5L3.57125 12.3026L4.22608 8.48463L1.45217 5.78073L5.28562 5.2237L7 1.75Z"
        stroke="currentColor"
        strokeWidth="1.16667"
        strokeLinejoin="round"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
};

export default StarIcon;
