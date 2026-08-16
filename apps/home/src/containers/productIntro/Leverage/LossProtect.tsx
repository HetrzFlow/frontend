import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { cn } from '@repo/ui';

import styles from './index.module.css';

interface LossProtectionProps {
  animation: boolean;
}

const LossProtection: FC<LossProtectionProps> = ({ animation }) => {
  const { t } = useLingui();
  return (
    <div className="text-t-270 relative w-30 items-center rounded-full">
      <div className="relative isolate">
        <div
          className={cn(
            'absolute -inset-px -z-1 rounded-[100px] bg-[conic-gradient(from_var(--angle),transparent_0deg,transparent_120deg,rgba(255,255,255,0.9)_180deg,transparent_240deg,transparent_360deg)] opacity-0',
            animation ? styles.lossProtectRotate : '',
          )}
        />
        <div className="absolute inset-0 -z-1 rounded-[100px] bg-[#202127]" />
        <div className="z-1 flex p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
          >
            <mask
              id="mask0_9800_4205"
              className="mask-type-alpha"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="16"
              height="16"
            >
              <rect width="16" height="16" fill="#D9D9D9" />
            </mask>
            <g mask="url(#mask0_9800_4205)">
              <path
                d="M7.30147 8.70818L6.23996 7.64651C6.14074 7.5474 6.02469 7.49679 5.8918 7.49468C5.75891 7.49257 5.64074 7.54318 5.5373 7.64651C5.43396 7.74996 5.3823 7.86879 5.3823 8.00301C5.3823 8.13712 5.43396 8.2559 5.5373 8.35934L6.87963 9.71201C7.00019 9.83246 7.1408 9.89268 7.30147 9.89268C7.46213 9.89268 7.60274 9.83246 7.7233 9.71201L10.4861 6.94918C10.5852 6.84996 10.6359 6.73218 10.638 6.59584C10.6401 6.45962 10.5895 6.33979 10.4861 6.23634C10.3827 6.1329 10.2639 6.08118 10.1296 6.08118C9.99552 6.08118 9.87674 6.1329 9.7733 6.23634L7.30147 8.70818ZM8.00146 14.2452C7.93224 14.2452 7.8643 14.2396 7.79763 14.2285C7.73096 14.2174 7.66641 14.2007 7.60396 14.1785C6.19808 13.6785 5.07952 12.792 4.2483 11.519C3.41708 10.2459 3.00146 8.87218 3.00146 7.39784V4.39534C3.00146 4.14312 3.07458 3.91557 3.2208 3.71268C3.36691 3.50968 3.55491 3.36245 3.7848 3.27101L7.57963 1.85434C7.72241 1.80301 7.86302 1.77734 8.00146 1.77734C8.13991 1.77734 8.28052 1.80301 8.4233 1.85434L12.2181 3.27101C12.448 3.36245 12.636 3.50968 12.7821 3.71268C12.9284 3.91557 13.0015 4.14312 13.0015 4.39534V7.39784C13.0015 8.87218 12.5859 10.2459 11.7546 11.519C10.9234 12.792 9.80485 13.6785 8.39897 14.1785C8.33652 14.2007 8.27197 14.2174 8.2053 14.2285C8.13863 14.2396 8.07069 14.2452 8.00146 14.2452ZM8.00146 13.2645C9.15702 12.8978 10.1126 12.1645 10.8681 11.0645C11.6237 9.96451 12.0015 8.74229 12.0015 7.39784V4.38884C12.0015 4.34618 11.9897 4.30773 11.9661 4.27351C11.9427 4.23929 11.9096 4.21362 11.8668 4.19651L8.07197 2.77984C8.05063 2.77129 8.02713 2.76701 8.00146 2.76701C7.9758 2.76701 7.9523 2.77129 7.93096 2.77984L4.13613 4.19651C4.09335 4.21362 4.06024 4.23929 4.0368 4.27351C4.01324 4.30773 4.00146 4.34618 4.00146 4.38884V7.39784C4.00146 8.74229 4.37924 9.96451 5.1348 11.0645C5.89035 12.1645 6.84591 12.8978 8.00146 13.2645Z"
                fill="#FF9900"
              />
            </g>
          </svg>
          <span className="ml-1 text-[10px] whitespace-nowrap">{t`Loss Protection`}</span>
        </div>
      </div>
    </div>
  );
};

export default LossProtection;
