import { ComponentProps, FC } from 'react';

const CaretUpIcon: FC<ComponentProps<'svg'> & { size?: number }> = ({
  size = 16,
  ...props
}) => {
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
        d="M8.64 5.65C8.33 5.23 7.67 5.23 7.36 5.65L5.48 8.13C5.11 8.63 5.48 9.33 6.12 9.33L9.88 9.33C10.52 9.33 10.89 8.63 10.52 8.13L8.64 5.65Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default CaretUpIcon;
