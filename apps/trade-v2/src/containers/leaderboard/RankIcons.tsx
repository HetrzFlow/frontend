import { SVGProps, useId } from 'react';

type RankIconProps = SVGProps<SVGSVGElement>;

const useSvgIds = (name: string) => {
  const id = useId().replace(/:/g, '');

  return {
    clip: `${name}_clip_${id}`,
    number: `${name}_number_${id}`,
    medal: `${name}_medal_${id}`,
  };
};

export const RankOneIcon = (props: RankIconProps) => {
  const ids = useSvgIds('leaderboard_rank_one');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <g clipPath={`url(#${ids.clip})`}>
        <path
          d="M5.86 4.46L7.12 3.44H7.99V8.7H7.09V4.48L5.86 5.48V4.46Z"
          fill={`url(#${ids.number})`}
        />
        <path
          d="M7.5 0.75C8.96 0.75 10.2 1.26 11.22 2.28C12.24 3.3 12.75 4.54 12.75 6C12.75 6.71 12.62 7.38 12.36 8.01C12.09 8.64 11.72 9.19 11.25 9.65V14.6L9.75 14.15V10.74C9.51 10.86 9.26 10.95 9 11.03V13.92L7.5 13.47L6 13.92V11.03C5.74 10.96 5.49 10.86 5.25 10.75V14.15L3.75 14.6V9.65C3.27 9.19 2.91 8.64 2.64 8.01C2.38 7.38 2.25 6.71 2.25 6C2.25 4.54 2.76 3.3 3.78 2.28C4.8 1.26 6.04 0.75 7.5 0.75ZM7.5 1.5C6.25 1.5 5.19 1.94 4.31 2.81C3.44 3.69 3 4.75 3 6C3 7.25 3.44 8.31 4.31 9.19C5.19 10.06 6.25 10.5 7.5 10.5C8.75 10.5 9.81 10.06 10.69 9.19C11.56 8.31 12 7.25 12 6C12 4.75 11.56 3.69 10.69 2.81C9.81 1.94 8.75 1.5 7.5 1.5Z"
          fill={`url(#${ids.medal})`}
        />
      </g>
      <defs>
        <linearGradient
          id={ids.number}
          x1="6.92218"
          y1="3.43506"
          x2="6.92218"
          y2="8.70006"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#865E0D" />
          <stop offset="1" stopColor="#E0AF47" />
        </linearGradient>
        <linearGradient
          id={ids.medal}
          x1="7.5"
          y1="0.749878"
          x2="7.5"
          y2="14.5953"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#865E0D" />
          <stop offset="1" stopColor="#E0AF47" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <rect width="15" height="15" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const RankTwoIcon = (props: RankIconProps) => {
  const ids = useSvgIds('leaderboard_rank_two');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <g clipPath={`url(#${ids.clip})`}>
        <path
          d="M8.5 6.23L6.94 7.83H9.32V8.63H5.71V7.88L7.83 5.73C8.18 5.38 8.33 5.11 8.33 4.79C8.33 4.32 8.03 4.06 7.52 4.06C6.91 4.06 6.59 4.39 6.59 5.02V5.27L5.69 5.18V4.94C5.69 3.89 6.38 3.26 7.48 3.26C8.5 3.26 9.21 3.83 9.21 4.75C9.21 5.28 9.02 5.69 8.5 6.23Z"
          fill={`url(#${ids.number})`}
        />
        <path
          d="M7.5 0.75C8.96 0.75 10.2 1.26 11.22 2.28C12.24 3.3 12.75 4.54 12.75 6C12.75 6.71 12.62 7.38 12.36 8.01C12.09 8.64 11.73 9.19 11.25 9.65V14.6L9.75 14.15V10.74C9.51 10.86 9.26 10.95 9 11.03V13.92L7.5 13.47L6 13.92V11.03C5.74 10.95 5.49 10.86 5.25 10.74V14.15L3.75 14.6V9.65C3.28 9.19 2.91 8.64 2.64 8.01C2.38 7.38 2.25 6.71 2.25 6C2.25 4.54 2.76 3.3 3.78 2.28C4.8 1.26 6.04 0.75 7.5 0.75ZM7.5 1.5C6.25 1.5 5.19 1.94 4.31 2.81C3.44 3.69 3 4.75 3 6C3 7.25 3.44 8.31 4.31 9.19C5.19 10.06 6.25 10.5 7.5 10.5C8.75 10.5 9.81 10.06 10.69 9.19C11.56 8.31 12 7.25 12 6C12 4.75 11.56 3.69 10.69 2.81C9.81 1.94 8.75 1.5 7.5 1.5Z"
          fill={`url(#${ids.medal})`}
        />
      </g>
      <defs>
        <linearGradient
          id={ids.number}
          x1="7.50775"
          y1="3.26294"
          x2="7.50775"
          y2="8.62544"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6A788E" />
          <stop offset="1" stopColor="#EDEDED" />
        </linearGradient>
        <linearGradient
          id={ids.medal}
          x1="7.50037"
          y1="0.749878"
          x2="7.50037"
          y2="14.5956"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6A788E" />
          <stop offset="1" stopColor="#EDEDED" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <rect width="15" height="15" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const RankThreeIcon = (props: RankIconProps) => {
  const ids = useSvgIds('leaderboard_rank_three');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <g clipPath={`url(#${ids.clip})`}>
        <path
          d="M7.55 8.72C6.32 8.72 5.63 8.06 5.63 6.87H6.54C6.55 7.49 6.84 7.93 7.52 7.93C8.11 7.93 8.45 7.55 8.45 7.04C8.45 6.37 7.91 6.17 7.46 6.17H7.29V5.48H7.45C7.93 5.48 8.26 5.18 8.26 4.73C8.26 4.32 7.95 4.05 7.51 4.05C7 4.05 6.68 4.41 6.68 4.97V5.02L5.78 4.93C5.78 3.89 6.46 3.26 7.49 3.26C8.42 3.26 9.08 3.88 9.08 4.64C9.08 5.24 8.71 5.63 8.36 5.76C8.88 5.9 9.36 6.3 9.36 7.09C9.36 8.06 8.63 8.72 7.55 8.72Z"
          fill={`url(#${ids.number})`}
        />
        <path
          d="M7.5 0.75C8.96 0.75 10.2 1.26 11.22 2.28C12.24 3.3 12.75 4.54 12.75 6C12.75 6.71 12.62 7.38 12.36 8.01C12.09 8.64 11.72 9.19 11.25 9.65V14.6L9.75 14.15V10.75C9.51 10.86 9.26 10.96 9 11.03V13.92L7.5 13.47L6 13.92V11.03C5.74 10.95 5.49 10.86 5.25 10.74V14.14L3.75 14.6V9.65C3.27 9.19 2.91 8.64 2.64 8.01C2.38 7.38 2.25 6.71 2.25 6C2.25 4.54 2.76 3.3 3.78 2.28C4.8 1.26 6.04 0.75 7.5 0.75ZM7.5 1.5C6.25 1.5 5.19 1.94 4.31 2.81C3.44 3.69 3 4.75 3 6C3 7.25 3.44 8.31 4.31 9.19C5.19 10.06 6.25 10.5 7.5 10.5C8.75 10.5 9.81 10.06 10.69 9.19C11.56 8.31 12 7.25 12 6C12 4.75 11.56 3.69 10.69 2.81C9.81 1.94 8.75 1.5 7.5 1.5Z"
          fill={`url(#${ids.medal})`}
        />
      </g>
      <defs>
        <linearGradient
          id={ids.number}
          x1="7.49287"
          y1="3.26294"
          x2="7.49287"
          y2="8.72294"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#862A0D" />
          <stop offset="1" stopColor="#E07747" />
        </linearGradient>
        <linearGradient
          id={ids.medal}
          x1="7.49988"
          y1="0.749878"
          x2="7.49988"
          y2="14.5956"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#862A0D" />
          <stop offset="1" stopColor="#E07747" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <rect width="15" height="15" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
