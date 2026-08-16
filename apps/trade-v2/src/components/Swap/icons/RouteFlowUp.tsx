import type { ComponentProps, FC } from 'react';

const RouteFlowUpIcon: FC<ComponentProps<'svg'> & { size?: number }> = ({
  size = 12,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="none"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 7L8.29 7.71L6 5.41L3.71 7.7L3 7L6 3.99L9 7Z"
      fill="#00DFEB"
      stroke="#00DFEB"
    />
  </svg>
);

export default RouteFlowUpIcon;
