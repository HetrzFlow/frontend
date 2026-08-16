import { FC, ReactNode } from 'react';
import { percentFormat } from '@repo/lib/format';

interface RatioBarProps {
  leftRatio: number;
  percentDecimals?: number;
  className?: string;
  formatText?: (position: 'left' | 'right') => ReactNode;
}

const RatioBar: FC<RatioBarProps> = ({
  leftRatio,
  formatText,
  className,
  percentDecimals = 2,
}) => {
  const leftText = formatText
    ? formatText('left')
    : percentFormat(leftRatio, percentDecimals);
  const rightText = formatText
    ? formatText('right')
    : percentFormat(1 - +leftRatio, percentDecimals);

  return (
    <div className={className}>
      <div className="flex justify-between">
        <span className="text-up">{leftText}</span>
        <span className="text-down">{rightText}</span>
      </div>
      <div className="mt-0.5 flex items-center">
        <div
          className="from-up h-1.5 rounded-l-full bg-gradient-to-r to-transparent"
          style={{
            width: `calc(100% * ${leftRatio})`,
          }}
        ></div>
        <div className="bg-t-1100 mx-px h-2.5 w-0.5 rounded-full"></div>
        <div
          className="to-down h-1.5 rounded-r-full bg-gradient-to-r from-transparent"
          style={{
            width: `calc(100% * ${1 - +leftRatio})`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default RatioBar;
