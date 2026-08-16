'use client';

import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { startOfToday } from 'date-fns';
import { dateFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import PointMarker from '@/common/components/PointMarker';
import { getOpenTimeRangesForDate } from '@/lib/market/dateConverter';

interface ContentProps {
  marketIsOpen: boolean;
  tillTimestamp?: number | string;
  schedule: string;
}

const dayDuration = 24 * 60 * 60 * 1000;

// Convert HH:mm to percentage of day
function timeToPercent(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (((hours ?? 0) * 60 + (minutes ?? 0)) / (24 * 60)) * 100;
}

const Content: FC<ContentProps> = ({
  marketIsOpen,
  schedule,
  tillTimestamp,
}) => {
  const { t } = useLingui();

  const start = startOfToday();
  const now = new Date();

  const durationNow = Date.now() - start.valueOf();
  const percent = Math.round((durationNow * 100) / dayDuration);

  const allRanges = getOpenTimeRangesForDate(
    schedule,
    now,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  // Filter ranges that match today
  const todayRanges = allRanges || [];

  // Sort ranges by start time
  const sortedRanges = [...todayRanges]
    .sort((a, b) => {
      const aStart = timeToPercent(a.start);
      const bStart = timeToPercent(b.start);
      return aStart - bStart;
    })
    .reduce(
      (acc, cur) => {
        const lastItem = acc[acc.length - 1];
        if (lastItem) {
          if (lastItem.end === cur.start) {
            acc[acc.length - 1] = {
              ...lastItem,
              end: cur.end,
            };
            return acc;
          }
        }
        acc.push(cur);
        return acc;
      },
      [] as {
        start: string;
        end: string;
      }[],
    );

  const offset = -now.getTimezoneOffset() / 60;

  return (
    <>
      <div className="text-t-1100 flex items-center gap-1">
        <PointMarker status={marketIsOpen ? 'success' : 'failed'} />
        {marketIsOpen ? t`Market Open` : t`Market Closed`}
        {!!tillTimestamp && tillTimestamp !== '0' && (
          <div className="ml-auto">
            {t`Till`} {dateFormat(tillTimestamp, 'MM-dd HH:mm')}{' '}
            <span className="text-t-270">
              ({`UTC${offset >= 0 ? '+' : ''}${offset}`})
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 rounded-lg bg-white/10 p-2">
        <div className="relative mt-4.5 flex h-1.5 items-center rounded-full bg-white/10">
          {sortedRanges.map((range, index) => {
            const startPercent = timeToPercent(range.start);
            const endPercent = timeToPercent(range.end);
            const durationPercent = endPercent - startPercent;
            return (
              <div
                key={index}
                className="bg-accent h-1.5 rounded-full"
                style={{
                  position: 'absolute',
                  left: `${startPercent}%`,
                  width: `${durationPercent}%`,
                }}
              >
                {durationPercent < 100 && (
                  <div
                    className={cn(
                      'text-t-1100 absolute -top-4.5 whitespace-nowrap',
                      startPercent > 50 ||
                        (sortedRanges.length === 2 && index === 1)
                        ? 'right-0'
                        : 'left-0',
                    )}
                  >
                    {range.start} - {range.end}
                  </div>
                )}
              </div>
            );
          })}
          <div
            className="bg-t-1100 absolute h-2.5 w-0.5 rounded-full"
            style={{
              left: `${percent}%`,
            }}
          ></div>
          {(!sortedRanges.length ||
            (sortedRanges[0]?.start === '00:00' &&
              sortedRanges[0]?.end === '24:00')) && (
            <div className="text-t-1100 absolute -top-4.5 right-0 left-0 flex justify-between">
              <span>00:00</span>
              <span>24:00</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Content;
