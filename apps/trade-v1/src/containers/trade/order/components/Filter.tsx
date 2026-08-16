import { FC, ReactNode } from 'react';
import {
  cn,
  FilterIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@repo/ui';

interface TypeHeaderProps {
  label: ReactNode;
  value: string;
  options: { value: string; label: ReactNode }[];
  onValueChange: (v: string) => void;
}

const Filter: FC<TypeHeaderProps> = ({
  label,
  value,
  options,
  onValueChange,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label="filter"
        className="group text-t-270 flex cursor-pointer items-center gap-1.5 p-0 text-sm"
        hiddenIcon
      >
        {label}
        <FilterIcon
          size={14}
          className={cn(
            'text-t-430 group-hover:text-t-270',
            value !== 'all' ? 'text-t-270' : '',
          )}
        />
      </SelectTrigger>
      {/* className="max-h-60" */}
      <SelectContent>
        {options.map(({ value: _value, label }) => (
          <SelectItem
            key={_value}
            value={_value}
            className={cn(
              'hover:bg-bg-3 mb-2 flex h-10 min-w-35 cursor-pointer items-center justify-between gap-4 rounded-lg text-sm last:mb-0',
              value === _value ? 'bg-bg-3' : '',
            )}
          >
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Filter;
