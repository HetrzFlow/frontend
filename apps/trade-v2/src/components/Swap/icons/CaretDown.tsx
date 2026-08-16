import { ComponentProps, FC } from 'react';

const CaretDownIcon: FC<ComponentProps<'svg'> & { size?: number }> = ({
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
        d="M7.36 10.35C7.67 10.77 8.33 10.77 8.64 10.35L10.52 7.87C10.89 7.37 10.52 6.67 9.88 6.67H6.12C5.48 6.67 5.11 7.37 5.48 7.87L7.36 10.35Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default CaretDownIcon;
