'use client';

import { useCallback, useEffect } from 'react';
import { subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { create } from 'zustand';

function getUTCTimestamp(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

  return utcDate.getTime();
}

const getDefaultDateRange = (): DateRange => {
  const today = new Date();
  return {
    from: subMonths(today, 1),
    to: today,
  };
};

export const getMaxAllowedDate = (): Date => {
  return new Date();
};

interface DashboardDateRangeState {
  dateRange: DateRange | undefined;

  setDateRange: (dateRange: DateRange | undefined) => void;

  resetToDefault: () => void;

  clear: () => void;
}

const useDashboardDateRangeStore = create<DashboardDateRangeState>((set) => ({
  dateRange: getDefaultDateRange(),
  setDateRange: (dateRange) => {
    if (!dateRange) {
      set({ dateRange });
      return;
    }

    const maxDate = getMaxAllowedDate();
    const validatedRange: DateRange = {
      from: dateRange.from,
      to: dateRange.to && dateRange.to > maxDate ? maxDate : dateRange.to,
    };

    if (validatedRange.from && validatedRange.from > maxDate) {
      validatedRange.from = maxDate;
    }

    set({ dateRange: validatedRange });
  },
  resetToDefault: () => set({ dateRange: getDefaultDateRange() }),
  clear: () => set({ dateRange: undefined }),
}));

export interface UseDashboardDateRangeOptions {
  onChange?: (dateRange: DateRange | undefined) => void;
}

export interface UseDashboardDateRangeReturn {
  dateRange: DateRange | undefined;

  fromTimestamp: number | undefined;

  toTimestamp: number | undefined;

  setDateRange: (dateRange: DateRange | undefined) => void;

  resetToDefault: () => void;

  clear: () => void;
}

export function useDashboardDateRange(
  options: UseDashboardDateRangeOptions = {},
): UseDashboardDateRangeReturn {
  const { onChange } = options;

  const {
    dateRange,
    setDateRange: setStoreDate,
    resetToDefault,
    clear,
  } = useDashboardDateRangeStore();

  const setDateRange = useCallback(
    (newDateRange: DateRange | undefined) => {
      setStoreDate(newDateRange);
      onChange?.(newDateRange);
    },
    [setStoreDate, onChange],
  );

  useEffect(() => {
    if (onChange) {
      onChange(dateRange);
    }
  }, [dateRange, onChange]);

  const fromTimestamp = dateRange?.from
    ? Math.floor(getUTCTimestamp(dateRange.from))
    : undefined;
  const toTimestamp = dateRange?.to
    ? Math.floor(getUTCTimestamp(dateRange.to))
    : undefined;

  return {
    dateRange,
    fromTimestamp,
    toTimestamp,
    setDateRange,
    resetToDefault,
    clear,
  };
}
