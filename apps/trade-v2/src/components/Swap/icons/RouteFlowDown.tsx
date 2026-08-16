import type { ComponentProps, FC } from 'react';

const RouteFlowDownIcon: FC<ComponentProps<'svg'> & { size?: number }> = ({
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
      d="M3 5L3.71 4.29L6 6.59L8.29 4.3L9 5L6 8.01L3 5Z"
      fill="#00DFEB"
      stroke="#00DFEB"
    />
  </svg>
);

export default RouteFlowDownIcon;
