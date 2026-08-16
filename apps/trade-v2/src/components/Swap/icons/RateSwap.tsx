import { ComponentProps, FC } from 'react';

const RateSwapIcon: FC<ComponentProps<'svg'> & { size?: number }> = ({
  size = 14,
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.92 9.33H11.67V10.5H2.92V9.33Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.08 3.5H2.33V4.67H11.08V3.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.07 7.58L3.74 9.92L6.07 12.25L5.25 13.07L2.09 9.92L5.25 6.76L6.07 7.58Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.93 1.75L10.26 4.08L7.93 6.42L8.75 7.24L11.91 4.08L8.75 0.93L7.93 1.75Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default RateSwapIcon;
