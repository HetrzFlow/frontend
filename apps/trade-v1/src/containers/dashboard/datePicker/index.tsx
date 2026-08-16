'use client';

import * as React from 'react';
import { useCallback } from 'react';
import { DateRangePicker } from '@repo/ui';
import {
  useDashboardDateRange,
  getMaxAllowedDate,
} from '@/hooks/useDashboardDateRange';

export const DashboardDatePickerContainer: React.FC = () => {
  const { dateRange, setDateRange } = useDashboardDateRange();

  const maxDate = getMaxAllowedDate();

  const disabledDays = useCallback(
    (date: Date) => {
      return date > maxDate;
    },
    [maxDate],
  );

  return (
    <DateRangePicker
      date={dateRange}
      onDateChange={setDateRange}
      placeholder="Select date range"
      disabledDays={disabledDays}
      numberOfMonths={1}
      disableOutsideDays={true}
    />
  );
};

DashboardDatePickerContainer.displayName = 'DashboardDatePickerContainer';
