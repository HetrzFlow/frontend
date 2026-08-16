'use client';

import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { dateFormat } from '@repo/lib/format';
import {
  cn,
  MEDIA_SIZES,
  PointSeasonSelectorIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  useMediaQuery,
} from '@repo/ui';

export type SeasonSelectorOption = {
  seasonId: string;
  seasonName: string;
  status?: 'active' | 'upcoming' | 'ended';
  startAt?: string;
  endAt?: string;
};

const getSeasonDateRange = (startAt?: string, endAt?: string) => {
  const start = dateFormat(startAt ?? '', 'MM/dd');
  const end = dateFormat(endAt ?? '', 'MM/dd');

  return start === '--' || end === '--' ? null : `${start}-${end}`;
};

type SessionSeasonOption = Pick<SeasonSelectorOption, 'seasonId' | 'status'>;

const isSelectableSeason = (season: SessionSeasonOption) =>
  season.status !== 'upcoming';

export const useSessionSeasonId = (
  defaultSeasonId: string,
  seasons: SessionSeasonOption[],
) => {
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const activeSeasonId = seasons.some(
    (season) =>
      season.seasonId === selectedSeasonId && isSelectableSeason(season),
  )
    ? selectedSeasonId
    : defaultSeasonId;

  const updateSeasonId = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
  };

  return [activeSeasonId, updateSeasonId] as const;
};

export const SeasonSelector = ({
  seasons,
  selectedSeasonId,
  onSeasonChange,
  triggerClassName,
  contentAlign,
  ariaLabel,
}: {
  seasons: SeasonSelectorOption[];
  selectedSeasonId: string;
  onSeasonChange: (seasonId: string) => void;
  triggerClassName?: string;
  contentAlign?: 'start' | 'center' | 'end';
  ariaLabel?: string;
}) => {
  const { t } = useLingui();
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const currentSeason = seasons.find(
    (season) => season.seasonId === selectedSeasonId,
  );
  const hasAllSeasonsOption = seasons[0]?.seasonId === 'all';

  if (!seasons.length) return null;

  return (
    <Select value={selectedSeasonId} onValueChange={onSeasonChange}>
      <SelectTrigger
        aria-label={ariaLabel ?? t`Select season`}
        className={cn(
          'bg-bg-3 h-8 w-fit gap-2 rounded-xl px-4 text-xs [&_svg]:size-4',
          triggerClassName,
        )}
      >
        <PointSeasonSelectorIcon size={20} className="max-md:hidden" />
        <div className="flex min-w-0 items-center gap-2">
          <SelectValue>{currentSeason?.seasonName}</SelectValue>
          {currentSeason?.status === 'active' ? (
            <span className="text-green shrink-0 rounded-[4px] bg-[rgba(50,214,149,0.1)] px-1 py-0.5 text-[10px] leading-3 font-medium">
              {t`Active`}
            </span>
          ) : currentSeason?.status === 'upcoming' ? (
            <span className="bg-bg-5 text-t-1100 shrink-0 rounded-[4px] px-1 py-0.5 text-[10px] leading-3 font-medium">
              {t`Upcoming`}
            </span>
          ) : null}
        </div>
      </SelectTrigger>
      <SelectContent
        className="bg-bg-2 min-w-[244px] rounded-xl p-2 md:min-w-50"
        align={contentAlign ?? (isMobile ? 'start' : 'end')}
      >
        {seasons.map((season, index) => {
          const dateRange = getSeasonDateRange(season.startAt, season.endAt);
          const isAllSeasonsOption = hasAllSeasonsOption && index === 0;

          return (
            <div key={season.seasonId}>
              {hasAllSeasonsOption && index === 1 && (
                <SelectSeparator className="bg-bg-5 my-1" />
              )}
              <SelectItem
                value={season.seasonId}
                disabled={season.status === 'upcoming'}
                className={cn(
                  'rounded-lg py-0 pr-8 text-xs font-normal data-[disabled]:pointer-events-auto data-[disabled]:cursor-not-allowed data-[disabled]:bg-transparent data-[disabled]:opacity-100',
                  isAllSeasonsOption ? 'h-7' : 'h-11',
                  hasAllSeasonsOption && index > 0 ? '!mt-1' : '',
                )}
              >
                <div className="flex w-full flex-col justify-center gap-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-t-1100 truncate">
                      {season.seasonName}
                    </span>
                    {season.status === 'active' ? (
                      <span className="text-green shrink-0 rounded-[4px] bg-[rgba(50,214,149,0.1)] px-1 py-0.5 text-[10px] leading-3 font-medium">
                        {t`Active`}
                      </span>
                    ) : season.status === 'upcoming' ? (
                      <span className="bg-bg-5 text-t-1100 shrink-0 rounded-[4px] px-1 py-0.5 text-[10px] leading-3 font-medium">
                        {t`Upcoming`}
                      </span>
                    ) : null}
                  </div>
                  {dateRange && (
                    <span className="text-t-350 shrink-0 text-xs">
                      {dateRange}
                    </span>
                  )}
                </div>
              </SelectItem>
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
};
