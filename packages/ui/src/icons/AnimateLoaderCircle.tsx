import { FC } from 'react';
import { IconProps } from './types';

const AnimateLoaderCircleIcon: FC<
  IconProps & {
    bgColor: string;
    duration?: number;
  }
> = ({ size = 24, bgColor, duration, ...props }) => {
  return (
    <svg
      id="arrow_loading"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 19 18"
      fill="none"
      {...props}
    >
      <path
        d="M17.5 9C17.5 7.05905 16.7944 5.1843 15.5146 3.72505C14.2348 2.26581 12.4681 1.32161 10.5437 1.06838C8.61938 0.815149 6.66859 1.27016 5.05484 2.34864C3.4411 3.42712 2.27448 5.0555 1.77235 6.93037C1.27022 8.80524 1.46683 10.7987 2.32555 12.5394C3.18427 14.28 4.64652 15.6491 6.43986 16.3916C8.23319 17.134 10.2353 17.1992 12.0731 16.5749C13.9109 15.9506 15.4591 14.6795 16.4292 12.9983"
        stroke="bgColor"
        strokeWidth="2"
      ></path>
      <defs>
        <path
          id="arrow"
          stroke={bgColor}
          strokeWidth="2"
          d="M17.5 9C17.5 7.05905 16.7944 5.1843 15.5146 3.72505C14.2348 2.26581 12.4681 1.32161 10.5437 1.06838C8.61938 0.815149 6.66859 1.27016 5.05484 2.34864C3.4411 3.42712 2.27448 5.0555 1.77235 6.93037C1.27022 8.80524 1.46683 10.7987 2.32555 12.5394C3.18427 14.28 4.64652 15.6491 6.43986 16.3916C8.23319 17.134 10.2353 17.1992 12.0731 16.5749C13.9109 15.9506 15.4591 14.6795 16.4292 12.9983"
        ></path>
        <clipPath id="arrow-clip">
          <use xlinkHref="#arrow"></use>
        </clipPath>
      </defs>
      <g>
        <path
          id="arrow"
          strokeWidth="2"
          stroke="currentColor"
          strokeDasharray="50"
          strokeDashoffset="0"
          d="M17.5 9C17.5 7.05905 16.7944 5.1843 15.5146 3.72505C14.2348 2.26581 12.4681 1.32161 10.5437 1.06838C8.61938 0.815149 6.66859 1.27016 5.05484 2.34864C3.4411 3.42712 2.27448 5.0555 1.77235 6.93037C1.27022 8.80524 1.46683 10.7987 2.32555 12.5394C3.18427 14.28 4.64652 15.6491 6.43986 16.3916C8.23319 17.134 10.2353 17.1992 12.0731 16.5749C13.9109 15.9506 15.4591 14.6795 16.4292 12.9983"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="2;50"
            begin="arrow_loading.click; 0s"
            repeatCount="indefinite"
            dur={`${duration || 5}s`}
          ></animate>
        </path>
      </g>
      <use xlinkHref="#arrow"></use>
      <animateTransform
        id="transform_0"
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="0 0 0"
        to="0 0 0"
        dur="0.07s"
        begin="arrow_loading.click;"
        repeatCount="1"
      ></animateTransform>
      <animateTransform
        id="transform_1"
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="0 0 0"
        to="360 0 0"
        dur="0.6s"
        begin="transform_0.end"
        repeatCount="1"
      ></animateTransform>
    </svg>
  );
};

export default AnimateLoaderCircleIcon;
