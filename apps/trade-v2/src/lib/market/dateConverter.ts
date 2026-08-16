import { addDays, startOfDay } from 'date-fns';
import { toZonedTime, format, fromZonedTime } from 'date-fns-tz';

export type UserRange = {
  weekday: number; // 1-7, Sun=1
  start: string; // "HH:mm"
  end: string; // "HH:mm"
};

export type DateRange = {
  date: string; // "MM-DD"
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  isClosed?: boolean; // Mark as closed (for special dates)
};

export type SpecialDateInfo = {
  date: string; // "MM-dd" in user timezone
  isClosed: boolean;
  start?: string; // "HH:mm"
  end?: string; // "HH:mm"
};

export type ScheduleRange = UserRange | DateRange;

const WEEKDAY_MAP: Record<number, number> = {
  0: 2, // Mon
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: 1, // Sun
};

function normalizeTime(hhmm: string) {
  return hhmm === '24:00' ? '00:00' : hhmm;
}

/**
 * Check if a schedule is effectively 24x7 (all 7 days open, no special dates).
 * Handles formats like "TZ;O,O,O,O,O,O,O" or "TZ;0000-2400,0000-2400,..."
 */
export function isEffectively24x7(schedule: string): boolean {
  const parts = schedule.split(';');
  const weeklyRaw = parts[1] ?? '';
  const specialDates = parts[2] ?? '';

  if (specialDates) return false;

  const days = weeklyRaw.replace(/&/g, '|').split(',').slice(0, 7);
  if (days.length < 7) return false;

  return days.every((d) => {
    if (d === 'O') return true;
    const normalized = d.replace(/2400/g, '0000');
    return normalized === '0000-0000';
  });
}

function parseWeekly(schedule: string) {
  const parts = schedule.split(';');
  const timezone = parts[0];
  const weeklyRaw = parts[1];

  // Only take the first 7 entries (Mon-Sun), ignore special dates
  const days = (weeklyRaw ?? '')
    .replace(/&/g, '|')
    .replace(/2400/g, '0000')
    .split(',')
    .slice(0, 7);

  const map = new Map<string, number[]>();

  days.forEach((value, index) => {
    let _value = value;
    if (_value === 'C') return;
    if (_value === 'O') {
      _value = '0000-0000';
    }

    const weekday = WEEKDAY_MAP[index];
    if (weekday === undefined) return;

    const _valurArr = _value.split('|');

    _valurArr.forEach((v) => {
      if (!map.has(v)) map.set(v, []);
      map.get(v)!.push(weekday);
    });
  });

  return { timezone, map, specialDates: parts[2] ?? '' };
}

function convertPoint(
  weekday: number,
  time: string,
  fromTZ: string,
  toTZ: string,
) {
  // Use current week to respect DST offset
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0=Sun
  // Find this week's Monday (UTC)
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const baseDate = new Date(now);
  baseDate.setUTCDate(now.getUTCDate() + mondayOffset);
  baseDate.setUTCHours(0, 0, 0, 0);

  const offset = weekday === 1 ? 6 : weekday - 2;
  baseDate.setUTCDate(baseDate.getUTCDate() + offset);

  const dateStr = format(baseDate, 'yyyy-MM-dd');

  const utcDate = fromZonedTime(`${dateStr}T${time}:00`, fromTZ);

  if (isNaN(utcDate.getTime())) {
    return { weekday, time, date: baseDate };
  }

  const user = toZonedTime(utcDate, toTZ);

  if (isNaN(user.getTime())) {
    return { weekday, time, date: baseDate };
  }

  return {
    weekday: user.getDay() === 0 ? 1 : user.getDay() + 1,
    time: format(user, 'HH:mm', { timeZone: toTZ }),
    date: user,
  };
}

function convertRange(
  weekday: number,
  start: string,
  end: string,
  fromTZ: string,
  toTZ: string,
): UserRange[] {
  const s = convertPoint(weekday, start, fromTZ, toTZ);
  const normalizeEnd = normalizeTime(end);
  const e = convertPoint(
    weekday + (normalizeEnd === '00:00' ? 1 : 0),
    normalizeTime(end),
    fromTZ,
    toTZ,
  );

  // Same day (both in target timezone)
  if (s.weekday === e.weekday) {
    return [
      {
        weekday: s.weekday,
        start: s.time,
        end: e.time === '00:00' ? '24:00' : e.time,
      },
    ];
  }

  // Cross-day, split into two segments
  return [
    {
      weekday: s.weekday,
      start: s.time,
      end: '24:00',
    },
    {
      weekday: e.weekday,
      start: '00:00',
      end: e.time,
    },
  ];
}

function parseSpecialDates(
  specialDatesRaw: string,
  fromTZ: string,
  toTZ: string,
  year: number = new Date().getFullYear(),
): SpecialDateInfo[] {
  if (!specialDatesRaw) return [];

  const result: SpecialDateInfo[] = [];
  const entries = specialDatesRaw.split(',');

  entries.forEach((entry) => {
    const [dateRaw, timeRangeRaw] = entry.split('/');
    if (!dateRaw || !timeRangeRaw) return;

    const month = parseInt(dateRaw.slice(0, 2), 10);
    const day = parseInt(dateRaw.slice(2, 4), 10);
    let timeRange = timeRangeRaw.trim();

    // Normalize & to | in special date time ranges
    timeRange = timeRange.replace(/&/g, '|');

    // Handle "C" (Closed) case - represents 00:00-24:00 in source timezone
    if (timeRange === 'C') {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Convert source timezone local time to UTC
      const startUTC = fromZonedTime(`${dateStr}T00:00:00`, fromTZ);
      const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);

      // Convert UTC to user timezone
      const startDateInUserTZ = toZonedTime(startUTC, toTZ);
      const endDateInUserTZ = toZonedTime(endUTC, toTZ);

      const startFormatted = format(startDateInUserTZ, 'HH:mm', {
        timeZone: toTZ,
      });
      const endFormatted = format(endDateInUserTZ, 'HH:mm', {
        timeZone: toTZ,
      });

      // Check if it crosses day boundary in user timezone
      if (startDateInUserTZ.toDateString() === endDateInUserTZ.toDateString()) {
        // Same day
        result.push({
          date: format(startDateInUserTZ, 'MM-dd', { timeZone: toTZ }),
          isClosed: true,
          start: startFormatted,
          end: endFormatted === '00:00' ? '24:00' : endFormatted,
        });
      } else {
        // Cross-day, split into two entries with actual times
        result.push(
          {
            date: format(startDateInUserTZ, 'MM-dd', { timeZone: toTZ }),
            isClosed: true,
            start: startFormatted,
            end: '24:00',
          },
          {
            date: format(endDateInUserTZ, 'MM-dd', { timeZone: toTZ }),
            isClosed: true,
            start: '00:00',
            end: endFormatted,
          },
        );
      }
      return;
    }

    // Handle "O" (Open all day) case
    if (timeRange === 'O') {
      timeRange = '0000-0000';
    }

    // Handle multiple time ranges separated by |
    const timeRanges = timeRange.split('|');

    timeRanges.forEach((range) => {
      const [startRaw, endRaw] = range.split('-');

      if (!startRaw || !endRaw) return;

      // Create date string in source timezone
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const startDateStr = `${dateStr}T${startRaw.slice(0, 2)}:${startRaw.slice(2)}:00`;

      // Convert source timezone local time to UTC
      const startUTC = fromZonedTime(startDateStr, fromTZ);
      let endUTC: Date;

      // Handle end time 0000/2400 as next day midnight
      if (endRaw === '0000' || endRaw === '2400') {
        endUTC = fromZonedTime(`${dateStr}T00:00:00`, fromTZ);
        endUTC = new Date(endUTC.getTime() + 24 * 60 * 60 * 1000);
      } else {
        endUTC = fromZonedTime(
          `${dateStr}T${endRaw.slice(0, 2)}:${endRaw.slice(2)}:00`,
          fromTZ,
        );
      }

      // Convert UTC to user timezone
      const startDateInUserTZ = toZonedTime(startUTC, toTZ);
      const endDateInUserTZ = toZonedTime(endUTC, toTZ);

      // Check if the dates cross day boundary in user timezone
      const startFormatted = format(startDateInUserTZ, 'HH:mm', {
        timeZone: toTZ,
      });
      const endFormatted = format(endDateInUserTZ, 'HH:mm', { timeZone: toTZ });

      // If it's the same day in user timezone
      if (startDateInUserTZ.toDateString() === endDateInUserTZ.toDateString()) {
        result.push({
          date: format(startDateInUserTZ, 'MM-dd', { timeZone: toTZ }),
          isClosed: false,
          start: startFormatted,
          end: endFormatted === '00:00' ? '24:00' : endFormatted,
        });
      } else {
        // Cross-day, split into two entries
        result.push(
          {
            date: format(startDateInUserTZ, 'MM-dd', { timeZone: toTZ }),
            isClosed: false,
            start: startFormatted,
            end: '24:00',
          },
          {
            date: format(endDateInUserTZ, 'MM-dd', { timeZone: toTZ }),
            isClosed: false,
            start: '00:00',
            end: endFormatted,
          },
        );
      }
    });
  });

  return result;
}

// Cache for schedule conversion results, keyed by schedule + timezone + current UTC offset
// UTC offset changes when DST switches, which invalidates the cache automatically
const scheduleCache = new Map<string, ScheduleRange[]>();

export function convertScheduleToUserTZ(
  schedule: string,
  userTimezone: string,
): ScheduleRange[] {
  const cacheKey = `${schedule}:${userTimezone}:${new Date().getTimezoneOffset()}`;
  const cached = scheduleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { timezone, map, specialDates } = parseWeekly(schedule);
  const result: ScheduleRange[] = [];

  // Process weekly schedule
  map.forEach((weekdays, timeRange) => {
    const parts = timeRange.split('-');
    const start = parts[0];
    const end = parts[1];
    if (!start || !end || !timezone) return;

    weekdays.forEach((weekday) => {
      const ranges = convertRange(
        weekday,
        start.slice(0, 2) + ':' + start.slice(2),
        end.slice(0, 2) + ':' + end.slice(2),
        timezone,
        userTimezone,
      );

      result.push(...ranges);
    });
  });

  // Process special dates
  if (timezone) {
    const specialDateInfos = parseSpecialDates(
      specialDates,
      timezone,
      userTimezone,
    );

    specialDateInfos.forEach((info) => {
      if (info.start && info.end) {
        // Both closed and open special dates have start/end times
        result.push({
          date: info.date,
          start: info.start,
          end: info.end,
          isClosed: info.isClosed,
        });
      }
    });
  }

  // Cache the result
  scheduleCache.set(cacheKey, result);

  return result;
}

export function parseSchedule(scheduleStr?: string) {
  if (
    !scheduleStr ||
    scheduleStr === '24x7' ||
    isEffectively24x7(scheduleStr)
  ) {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      session: '24x7',
    };
  }

  // 1. Split timezone and weekly schedule
  const [timezone, weeklyRaw] = scheduleStr.split(';');

  // 2. Split daily sessions, normalize & → | and 2400 → 0000
  const dailySessions =
    weeklyRaw?.replace(/&/g, '|').replace(/2400/g, '0000').split(',') || [];

  // 3. Group by "session → weekdays"
  const sessionToDays = new Map<string, number[]>();

  dailySessions.forEach((session, index) => {
    if (session === 'C') return; // Closed all day, skip directly

    const weekday = WEEKDAY_MAP[index]!;

    if (!sessionToDays.has(session)) {
      sessionToDays.set(session, []);
    }

    sessionToDays.get(session)!.push(weekday);
  });

  // 4. Generate TradingView session string
  const sessionParts: string[] = [];

  sessionToDays.forEach((weekdays, session) => {
    const dayStr = weekdays.join('');

    // O = all day
    if (session === 'O') {
      sessionParts.push(`0000-0000:${dayStr}`);
      return;
    }

    // Multiple time ranges (separated by |)
    const ranges = session.split('|');

    if (ranges.length === 1) {
      sessionParts.push(`${session}:${dayStr}`);
    } else {
      sessionParts.push(`${ranges.join(',')}:${dayStr}`);
    }
  });

  return {
    timezone,
    session: sessionParts.join('|'),
  };
}

export type TimeRange = {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
};

/**
 * Check if the market is currently open based on schedule.
 * Returns true if now falls within any open time range for today.
 * Returns true for '24x7' or missing schedule (always open).
 */
// Cache for isMarketOpenNow: keyed by schedule, invalidated every minute
const openNowCache = new Map<string, { minute: number; result: boolean }>();

export function isMarketOpenNow(schedule?: string): boolean {
  if (!schedule || schedule === '24x7' || isEffectively24x7(schedule))
    return true;

  try {
    const now = new Date();
    const currentMinute = Math.floor(now.getTime() / 60_000);
    const cached = openNowCache.get(schedule);
    if (cached && cached.minute === currentMinute) return cached.result;

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const ranges = getOpenTimeRangesForDate(schedule, now, userTimezone);

    if (!ranges || ranges.length === 0) {
      openNowCache.set(schedule, { minute: currentMinute, result: false });
      return false;
    }

    const nowStr = format(now, 'HH:mm', { timeZone: userTimezone });
    const nowMin = timeToMinutes(nowStr);

    const result = ranges.some((r) => {
      const startMin = timeToMinutes(r.start);
      const endMin = r.end === '24:00' ? 1440 : timeToMinutes(r.end);
      return nowMin >= startMin && nowMin < endMin;
    });

    openNowCache.set(schedule, { minute: currentMinute, result });
    return result;
  } catch {
    // Fallback to open if schedule parsing fails
    return true;
  }
}

/**
 * Get the next market open or close timestamp based on schedule.
 * If market is open, returns { isOpen: true, nextCloseTime, nextOpenTime }.
 * If market is closed, returns { isOpen: false, nextOpenTime, nextCloseTime }.
 * Times are millisecond timestamps. Looks up to 7 days ahead.
 */
// Cache for getNextMarketTransition: keyed by schedule, invalidated every minute
const transitionCache = new Map<
  string,
  {
    minute: number;
    result: { isOpen: boolean; nextOpenTime: number; nextCloseTime: number };
  }
>();

export function clearMarketScheduleCaches(schedule?: string) {
  if (schedule) {
    openNowCache.delete(schedule);
    transitionCache.delete(schedule);
    return;
  }

  openNowCache.clear();
  transitionCache.clear();
}

export function getNextMarketTransition(schedule?: string): {
  isOpen: boolean;
  nextOpenTime: number;
  nextCloseTime: number;
} {
  const defaultResult = { isOpen: true, nextOpenTime: 0, nextCloseTime: 0 };
  if (!schedule || schedule === '24x7' || isEffectively24x7(schedule))
    return defaultResult;

  try {
    const now = new Date();
    const currentMinute = Math.floor(now.getTime() / 60_000);
    const cached = transitionCache.get(schedule);
    if (cached && cached.minute === currentMinute) return cached.result;

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const nowMin = timeToMinutes(
      format(now, 'HH:mm', { timeZone: userTimezone }),
    );
    const todayStart = startOfDay(toZonedTime(now, userTimezone));

    const isOpen = isMarketOpenNow(schedule);

    // Helper: convert a day offset + "HH:mm" to a UTC timestamp
    const toTimestamp = (dayOffset: number, time: string): number => {
      // 24:00 means next day 00:00
      const actualOffset = time === '24:00' ? dayOffset + 1 : dayOffset;
      const day = addDays(todayStart, actualOffset);
      const min = time === '24:00' ? 0 : timeToMinutes(time);
      const h = Math.floor(min / 60);
      const m = min % 60;
      const localStr = `${format(day, 'yyyy-MM-dd')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      return fromZonedTime(localStr, userTimezone).getTime();
    };

    let nextOpenTime = 0;
    let nextCloseTime = 0;

    // Helper: find the actual close time, following 24:00→00:00 continuations
    const resolveCloseTime = (dayOffset: number, endTime: string): number => {
      let curOffset = dayOffset;
      let curEnd = endTime;

      // Keep extending if day ends at 24:00 and next day starts at 00:00
      while (curEnd === '24:00' && curOffset < dayOffset + 7) {
        const nextDay = addDays(now, curOffset + 1);
        const nextRanges = getOpenTimeRangesForDate(
          schedule,
          nextDay,
          userTimezone,
        );
        if (
          nextRanges &&
          nextRanges.length > 0 &&
          nextRanges[0]!.start === '00:00'
        ) {
          curOffset += 1;
          curEnd = nextRanges[0]!.end;
        } else {
          break;
        }
      }

      return toTimestamp(curOffset, curEnd);
    };

    // Scan up to 7 days ahead
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const day = addDays(now, dayOffset);
      const ranges = getOpenTimeRangesForDate(schedule, day, userTimezone);

      if (!ranges || ranges.length === 0) {
        continue;
      }

      for (const range of ranges) {
        const startMin = timeToMinutes(range.start);
        const endMin = range.end === '24:00' ? 1440 : timeToMinutes(range.end);

        if (dayOffset === 0) {
          if (
            isOpen &&
            !nextCloseTime &&
            nowMin >= startMin &&
            nowMin < endMin
          ) {
            nextCloseTime = resolveCloseTime(0, range.end);
          }
          if (!isOpen && !nextOpenTime && startMin > nowMin) {
            nextOpenTime = toTimestamp(0, range.start);
          }
        } else {
          if (!isOpen && !nextOpenTime) {
            nextOpenTime = toTimestamp(dayOffset, range.start);
          }
          if (!isOpen && !nextCloseTime && nextOpenTime) {
            nextCloseTime = resolveCloseTime(dayOffset, range.end);
          }
        }

        if (
          (isOpen && nextCloseTime) ||
          (!isOpen && nextOpenTime && nextCloseTime)
        )
          break;
      }

      if (
        (isOpen && nextCloseTime) ||
        (!isOpen && nextOpenTime && nextCloseTime)
      )
        break;
    }

    const result = { isOpen, nextOpenTime, nextCloseTime };
    transitionCache.set(schedule, { minute: currentMinute, result });
    return result;
  } catch {
    // Fallback to open if schedule parsing fails
    return defaultResult;
  }
}

function timeToMinutes(time: string): number {
  const parts = time.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

/**
 * Merge adjacent time ranges.
 * E.g., [{start: "13:00", end: "24:00"}, {start: "06:00", end: "13:00"}]
 * -> [{start: "06:00", end: "24:00"}]
 */
function mergeTimeRanges(ranges: TimeRange[]): TimeRange[] {
  // Filter out invalid ranges where start === end
  const validRanges = ranges.filter((r) => r.start !== r.end);

  if (validRanges.length === 0) return [];
  if (validRanges.length === 1) return validRanges;

  // Convert to minutes and sort
  const toMinutes = (time: string) => {
    const parts = time.split(':');
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    return h * 60 + m;
  };

  const sortedRanges = [...validRanges].sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start),
  );

  if (sortedRanges.length === 0) return [];

  const merged: TimeRange[] = [];
  let current: TimeRange = {
    start: sortedRanges[0]!.start,
    end: sortedRanges[0]!.end,
  };

  for (let i = 1; i < sortedRanges.length; i++) {
    const next = sortedRanges[i];
    if (!next) break;

    const currentEndMin = toMinutes(current.end);
    const nextStartMin = toMinutes(next.start);

    // If next range starts at or before current range ends, merge them
    if (nextStartMin <= currentEndMin) {
      const nextEndMin = toMinutes(next.end);
      if (nextEndMin > currentEndMin) {
        current = { ...current, end: next.end };
      }
    } else {
      merged.push(current);
      current = { start: next.start, end: next.end };
    }
  }

  merged.push(current);
  return merged;
}

type SourceSession = {
  start: string; // "HHmm"
  end: string; // "HHmm"
};

function parseSessionValue(value?: string): SourceSession[] | null {
  if (!value || value === 'C') return null;

  const normalized = value === 'O' ? '0000-2400' : value;

  return normalized
    .replace(/&/g, '|')
    .split('|')
    .map((range) => {
      const [start, end] = range.split('-');
      if (!start || !end) return null;
      return { start, end };
    })
    .filter((range): range is SourceSession => range !== null);
}

function addCalendarDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day! + days));
  return date.toISOString().slice(0, 10);
}

function getSourceSessionsForDate(
  schedule: string,
  sourceDateStr: string,
): SourceSession[] | null {
  const [, weeklyRaw = '', specialDatesRaw = ''] = schedule.split(';');
  const mmdd = `${sourceDateStr.slice(5, 7)}${sourceDateStr.slice(8, 10)}`;
  const specialEntry = specialDatesRaw
    .split(',')
    .map((entry) => entry.split('/'))
    .find(([dateRaw]) => dateRaw === mmdd);

  if (specialEntry) {
    return parseSessionValue(specialEntry[1]);
  }

  const day = new Date(`${sourceDateStr}T00:00:00Z`).getUTCDay();
  const weeklyIndex = day === 0 ? 6 : day - 1; // schedule is Mon-Sun
  const weeklyValue = weeklyRaw.split(',')[weeklyIndex];

  return parseSessionValue(weeklyValue);
}

function sourceSessionToUTC(
  sourceDateStr: string,
  session: SourceSession,
  sourceTimezone: string,
) {
  const startUTC = fromZonedTime(
    `${sourceDateStr}T${session.start.slice(0, 2)}:${session.start.slice(2)}:00`,
    sourceTimezone,
  );

  const endDateStr =
    session.end === '0000' || session.end === '2400'
      ? addCalendarDays(sourceDateStr, 1)
      : sourceDateStr;
  const endTime = session.end === '2400' ? '0000' : session.end;
  let endUTC = fromZonedTime(
    `${endDateStr}T${endTime.slice(0, 2)}:${endTime.slice(2)}:00`,
    sourceTimezone,
  );

  if (endUTC.getTime() <= startUTC.getTime()) {
    endUTC = fromZonedTime(
      `${addCalendarDays(sourceDateStr, 1)}T${endTime.slice(0, 2)}:${endTime.slice(2)}:00`,
      sourceTimezone,
    );
  }

  return { startUTC, endUTC };
}

function getOpenTimeRangesForTargetDay(
  schedule: string,
  date: Date,
  userTimezone: string,
): TimeRange[] | null {
  const [sourceTimezone] = schedule.split(';');
  if (!sourceTimezone) return null;

  const targetDateStr = format(toZonedTime(date, userTimezone), 'yyyy-MM-dd');
  const targetStartUTC = fromZonedTime(
    `${targetDateStr}T00:00:00`,
    userTimezone,
  );
  const targetEndUTC = fromZonedTime(
    `${addCalendarDays(targetDateStr, 1)}T00:00:00`,
    userTimezone,
  );

  const startSourceDate = format(
    toZonedTime(targetStartUTC, sourceTimezone),
    'yyyy-MM-dd',
  );
  const endSourceDate = format(
    toZonedTime(targetEndUTC, sourceTimezone),
    'yyyy-MM-dd',
  );
  const sourceDates = new Set([
    addCalendarDays(startSourceDate, -1),
    startSourceDate,
    endSourceDate,
    addCalendarDays(endSourceDate, 1),
  ]);

  const ranges: TimeRange[] = [];

  sourceDates.forEach((sourceDateStr) => {
    const sessions = getSourceSessionsForDate(schedule, sourceDateStr);
    if (!sessions) return;

    sessions.forEach((session) => {
      const { startUTC, endUTC } = sourceSessionToUTC(
        sourceDateStr,
        session,
        sourceTimezone,
      );

      const clippedStart = new Date(
        Math.max(startUTC.getTime(), targetStartUTC.getTime()),
      );
      const clippedEnd = new Date(
        Math.min(endUTC.getTime(), targetEndUTC.getTime()),
      );

      if (clippedStart.getTime() >= clippedEnd.getTime()) return;

      const start =
        clippedStart.getTime() === targetStartUTC.getTime()
          ? '00:00'
          : format(toZonedTime(clippedStart, userTimezone), 'HH:mm');
      const end =
        clippedEnd.getTime() === targetEndUTC.getTime()
          ? '24:00'
          : format(toZonedTime(clippedEnd, userTimezone), 'HH:mm');

      ranges.push({ start, end });
    });
  });

  return ranges.length > 0 ? mergeTimeRanges(ranges) : null;
}

/**
 * Get the open time ranges for a specific date based on the schedule.
 * Returns null if the market is closed on that date.
 * Returns an array of time ranges if the market is open.
 */
export function getOpenTimeRangesForDate(
  schedule: string,
  date: Date,
  userTimezone: string,
): TimeRange[] | null {
  if (!schedule || schedule === '24x7' || isEffectively24x7(schedule)) {
    return [{ start: '00:00', end: '24:00' }];
  }

  try {
    return _getOpenTimeRangesForDate(schedule, date, userTimezone);
  } catch {
    // Fallback to open all day if schedule parsing fails
    return [{ start: '00:00', end: '24:00' }];
  }
}

function _getOpenTimeRangesForDate(
  schedule: string,
  date: Date,
  userTimezone: string,
): TimeRange[] | null {
  return getOpenTimeRangesForTargetDay(schedule, date, userTimezone);
}
