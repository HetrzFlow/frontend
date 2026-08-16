'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DateRangePickerProps {
  className?: string;
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** disabled date */
  disabledDays?: Date | Date[] | ((date: Date) => boolean);
  /** number of months to display */
  numberOfMonths?: number;
  /** custom className for popover content */
  popoverContentClassName?: string;
  /** custom className for calendar */
  calendarClassName?: string;
  /** custom classNames for calendar parts */
  calendarClassNames?: Partial<Record<string, string>>;
  /** disable outside days (days from other months) */
  disableOutsideDays?: boolean;
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  placeholder = 'Pick a date range',
  disabled = false,
  disabledDays,
  numberOfMonths = 2,
  popoverContentClassName,
  calendarClassName,
  calendarClassNames,
  disableOutsideDays = false,
}: DateRangePickerProps) {
  const [selectedDate, setSelectedDate] = useState<DateRange | undefined>(date);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    date?.from || new Date(),
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleDateSelect = (newDate: DateRange | undefined) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const enhancedDisabledDays = (date: Date) => {
    if (disabledDays) {
      if (typeof disabledDays === 'function') {
        if (disabledDays(date)) return true;
      } else if (Array.isArray(disabledDays)) {
        if (
          disabledDays.some(
            (disabledDate) => disabledDate.getTime() === date.getTime(),
          )
        )
          return true;
      } else {
        if (disabledDays.getTime() === date.getTime()) return true;
      }
    }

    if (disableOutsideDays) {
      return (
        date.getMonth() !== currentMonth.getMonth() ||
        date.getFullYear() !== currentMonth.getFullYear()
      );
    }

    return false;
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open && selectedDate?.from) {
      setCurrentMonth(selectedDate.from);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            style={{
              background: 'rgba(179, 189, 217, 0.10)',
            }}
            className={cn(
              `font-plex rounded-[100px] border border-transparent py-[11.5px] text-sm font-medium transition-colors hover:border-[rgba(191,207,255,0.10)] has-[>svg]:px-4`,
              !selectedDate && 'text-muted-foreground',
            )}
            disabled={disabled}
          >
            {selectedDate?.from ? (
              selectedDate.to ? (
                <>
                  {format(selectedDate.from, 'LLL dd, y')} -{' '}
                  {format(selectedDate.to, 'LLL dd, y')}
                </>
              ) : (
                format(selectedDate.from, 'LLL dd, y')
              )
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('w-auto p-0', popoverContentClassName)}
          align="end"
        >
          <Calendar
            autoFocus
            mode="range"
            month={currentMonth}
            selected={selectedDate}
            onSelect={handleDateSelect}
            numberOfMonths={numberOfMonths}
            disabled={enhancedDisabledDays}
            onMonthChange={setCurrentMonth}
            className={calendarClassName}
            classNames={calendarClassNames}
            disableOutsideDays={disableOutsideDays}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

DateRangePicker.displayName = 'DateRangePicker';
