'use client';

import { useLingui } from '@lingui/react/macro';
import {
  ChevronDownIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { leaderboardPeriods, type LeaderboardPeriod } from './mockData';

interface PeriodSelectProps {
  value: LeaderboardPeriod;
  onValueChange: (value: LeaderboardPeriod) => void;
}

export const PeriodSelect = ({ value, onValueChange }: PeriodSelectProps) => {
  const { t } = useLingui();
  const getPeriodLabel = (period: LeaderboardPeriod) => {
    if (period === '7d') return t`Weekly`;
    if (period === '30d') return t`Monthly`;
    return t`All Time`;
  };

  return (
    <Select
      value={value}
      onValueChange={(nextValue) =>
        onValueChange(nextValue as LeaderboardPeriod)
      }
    >
      <SelectTrigger
        hiddenIcon
        className="bg-bg-2 h-8 w-[120px] rounded-xl border-0 px-3 py-2 text-[13px] leading-none font-medium tracking-[-0.52px] text-white shadow-none hover:text-white focus:ring-0 max-md:h-8"
      >
        <div className="flex w-full items-center justify-between">
          <SelectValue />
          <ChevronDownIcon size={16} className="text-white" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-bg-3 min-w-[120px] rounded-xl border-0 p-1 shadow-none">
        {leaderboardPeriods.map((period) => (
          <SelectItem
            key={period}
            value={period}
            className="h-8 rounded-lg text-[13px] leading-none"
          >
            {getPeriodLabel(period)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
