'use client';

import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { percentFormat, unitFormat } from '@repo/lib/format';
import RatioBar from '@/components/RatioBar';

type OpenInterestRatioProps = {
  longOiUsd: string | number;
  shortOiUsd: string | number;
  usdAmountDisplayDecimal: number;
  className?: string;
  showAmounts?: boolean;
};

export default function OpenInterestRatio({
  longOiUsd,
  shortOiUsd,
  usdAmountDisplayDecimal,
  className,
  showAmounts = false,
}: OpenInterestRatioProps) {
  const { t } = useLingui();
  const { longOi, shortOi, longOiPercent } = useMemo(() => {
    const longValue = calc(longOiUsd || 0);
    const shortValue = calc(shortOiUsd || 0);
    const sum = longValue.plus(shortValue);
    return {
      longOi: longValue,
      shortOi: shortValue,
      longOiPercent:
        sum.eq(0) || sum.isNaN() ? '0.5' : longValue.div(sum).toFixed(4),
    };
  }, [longOiUsd, shortOiUsd]);

  const longOiPercentText = percentFormat(longOiPercent, 2, {
    round: ROUND_MODE.DOWN,
  });
  const shortOiPercentText = percentFormat(calc(1).minus(longOiPercent), 2, {
    round: ROUND_MODE.UP,
  });

  if (showAmounts) {
    return (
      <div className={className}>
        <div className="flex items-center">
          <div
            className="from-up h-1.5 rounded-l-full bg-gradient-to-r to-transparent"
            style={{ width: `calc(100% * ${longOiPercent})` }}
          />
          <div className="bg-t-1100 mx-px h-2.5 w-0.5 rounded-full" />
          <div
            className="to-down h-1.5 rounded-r-full bg-gradient-to-r from-transparent"
            style={{ width: `calc(100% * ${calc(1).minus(longOiPercent)})` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-t-1100 flex items-center gap-1">
            <span>{t`Long`}</span>
            <span className="text-up">{longOiPercentText}</span>
            <span className="text-up">
              {unitFormat(longOi, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          </span>
          <span className="text-t-1100 flex items-center gap-1">
            <span>{t`Short`}</span>
            <span className="text-down">{shortOiPercentText}</span>
            <span className="text-down">
              {unitFormat(shortOi, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <RatioBar
        leftRatio={+longOiPercent}
        formatText={(position) => {
          return position === 'left' ? (
            <div className="text-t-1100">
              {t`Long`} <span className="text-up">{longOiPercentText}</span>
            </div>
          ) : (
            <div className="text-t-1100">
              {t`Short`} <span className="text-down">{shortOiPercentText}</span>
            </div>
          );
        }}
      />
    </div>
  );
}
