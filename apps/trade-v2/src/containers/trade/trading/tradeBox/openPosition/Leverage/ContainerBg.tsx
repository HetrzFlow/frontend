import { FC } from 'react';
import { cn } from '@repo/ui';

interface ContainerBgProps {
  isHyper: boolean;
  isLong: boolean;
}

const ContainerBg: FC<ContainerBgProps> = ({ isLong, isHyper }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 344 84"
      fill="none"
      preserveAspectRatio="xMaxYMin slice"
      className={cn('h-full w-full', isLong ? 'text-up' : 'text-down')}
    >
      <g clipPath="url(#clip0_9460_18735)">
        <g filter="url(#filter0_f_9460_18735)">
          <ellipse
            cx="393.38"
            cy="-52.2038"
            rx="98.4681"
            ry="79.7142"
            transform="rotate(45 393.38 -52.2038)"
            fill={isHyper ? 'var(--hyper-lev)' : 'currentColor'}
          />
        </g>
        <g
          opacity="0.3"
          filter="url(#filter1_f_9460_18735)"
          style={{ mixBlendMode: 'plus-lighter' }}
        >
          <rect
            width="42.6812"
            height="161.928"
            transform="matrix(0.720174 0.693793 -0.686645 0.726993 342.629 -70.8896)"
            fill="url(#paint0_linear_9460_18735)"
          />
        </g>
        <g opacity="0.3" filter="url(#filter2_f_9460_18735)">
          <g filter="url(#filter3_f_9460_18735)">
            <ellipse
              cx="260.167"
              cy="-61.8018"
              rx="98.4681"
              ry="114.44"
              transform="rotate(45 260.167 -61.8018)"
              fill="currentColor"
            />
          </g>
          <g
            opacity="0.3"
            filter="url(#filter4_f_9460_18735)"
            style={{ mixBlendMode: 'plus-lighter' }}
          >
            <path
              d="M202.432 -73.4978L233.415 -44.1312L136.247 56.9783L105.264 27.6117L202.432 -73.4978Z"
              fill="url(#paint1_linear_9460_18735)"
            />
          </g>
        </g>
        <g opacity="0.3" filter="url(#filter5_f_9460_18735)">
          <g
            opacity="0.8"
            filter="url(#filter6_f_9460_18735)"
            style={{ mixBlendMode: 'plus-lighter' }}
          >
            <rect
              width="42.6842"
              height="100.951"
              transform="matrix(0.72257 0.691298 -0.689882 0.723922 87.3184 -86.1562)"
              fill="url(#paint2_linear_9460_18735)"
            />
          </g>
          <g
            opacity="0.8"
            filter="url(#filter7_f_9460_18735)"
            style={{ mixBlendMode: 'plus-lighter' }}
          >
            <rect
              width="42.6847"
              height="117.159"
              transform="matrix(0.69686 0.717207 -0.718094 0.695946 111.025 -63.5801)"
              fill="url(#paint3_linear_9460_18735)"
            />
          </g>
        </g>
        <g
          opacity="0.4"
          filter="url(#filter8_f_9460_18735)"
          style={{ mixBlendMode: 'plus-lighter' }}
        >
          <ellipse
            cx="136.637"
            cy="-3.04808"
            rx="14.7364"
            ry="72.9348"
            transform="rotate(45 136.637 -3.04808)"
            fill="url(#paint4_linear_9460_18735)"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_f_9460_18735"
          x="239.876"
          y="-205.708"
          width="307.008"
          height="307.007"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="31.9588"
            result="effect1_foregroundBlur_9460_18735"
          />
        </filter>
        <filter
          id="filter1_f_9460_18735"
          x="207.32"
          y="-95.0107"
          width="190.168"
          height="195.575"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="12.0605"
            result="effect1_foregroundBlur_9460_18735"
          />
        </filter>
        <filter
          id="filter2_f_9460_18735"
          x="97.5695"
          y="-176.252"
          width="277.047"
          height="340.924"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="3.84731"
            result="effect1_foregroundBlur_9460_18735"
          />
        </filter>
        <filter
          id="filter3_f_9460_18735"
          x="89.4946"
          y="-232.474"
          width="341.345"
          height="341.345"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="31.9588"
            result="effect1_foregroundBlur_9460_18735"
          />
        </filter>
        <filter
          id="filter4_f_9460_18735"
          x="98.0278"
          y="-80.7341"
          width="142.623"
          height="144.949"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="3.61816"
            result="effect1_foregroundBlur_9460_18735"
          />
        </filter>
        <filter
          id="filter5_f_9460_18735"
          x="9.97944"
          y="-93.8509"
          width="138.486"
          height="150.116"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="3.84731"
            result="effect1_foregroundBlur_9460_18735"
          />
        </filter>
        <filter
          id="filter6_f_9460_18735"
          x="-1.6228"
          y="-105.453"
          width="139.08"
          height="141.182"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="9.64844"
            result="effect1_foregroundBlur_9460_18735"
          />
        </filter>
        <filter
          id="filter7_f_9460_18735"
          x="7.59741"
          y="-82.877"
          width="152.47"
          height="150.744"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="9.64844"
            result="effect1_foregroundBlur_9460_18735"
          />
        </filter>
        <filter
          id="filter8_f_9460_18735"
          x="59.8904"
          y="-79.7943"
          width="153.492"
          height="153.492"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="12.0605"
            result="effect1_foregroundBlur_9460_18735"
          />
        </filter>
        <linearGradient
          id="paint0_linear_9460_18735"
          x1="27.6514"
          y1="0"
          x2="27.6514"
          y2="161.928"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="0.8" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_9460_18735"
          x1="217.923"
          y1="-58.8145"
          x2="121.458"
          y2="42.9607"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="0.88" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_9460_18735"
          x1="26.9228"
          y1="-39.2457"
          x2="26.6359"
          y2="100.962"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="0.802306" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_9460_18735"
          x1="26.9232"
          y1="-45.5467"
          x2="26.5367"
          y2="117.171"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="0.802306" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_9460_18735"
          x1="140.49"
          y1="-132.691"
          x2="139.622"
          y2="69.8995"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="0.802306" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <clipPath id="clip0_9460_18735">
          <rect
            width="347"
            height="84"
            fill="white"
            transform="translate(-3)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export default ContainerBg;
