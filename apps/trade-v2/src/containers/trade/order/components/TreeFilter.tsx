import {
  FC,
  ReactNode,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  ArrowClockwiseIcon,
  Checkbox,
  ChevronDownIcon,
  cn,
  FilterIcon,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollBox,
  SearchIcon,
  Separator,
} from '@repo/ui';

export interface TreeFilterOption {
  value: string;
  label: ReactNode;
  children?: TreeFilterOption[];
}

interface TreeFilterProps {
  label: ReactNode;
  value?: string;
  options: TreeFilterOption[];
  onValueChange: (v?: string) => void;
}

interface TreeFilterContentProps {
  value?: string;
  options: TreeFilterOption[];
  onValueChange: (v?: string) => void;
  groupLabel?: ReactNode;
  scrollClassName?: string;
  shadowClassName?: string;
  focusOnMount?: boolean;
}

function getLeafValues(option: TreeFilterOption): string[] {
  if (!option.children || option.children.length === 0) return [option.value];
  return option.children.flatMap(getLeafValues);
}

function getSearchableLabel(label: ReactNode): string {
  if (typeof label === 'string' || typeof label === 'number') {
    return String(label);
  }

  if (Array.isArray(label)) {
    return label.map(getSearchableLabel).join('');
  }

  if (isValidElement(label)) {
    const props = label.props as { children?: ReactNode };
    return getSearchableLabel(props.children);
  }

  return '';
}

function filterOptions(
  options: TreeFilterOption[],
  search: string,
): TreeFilterOption[] {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return options;
  }

  return options.flatMap((option) => {
    const labelMatches = getSearchableLabel(option.label)
      .toLowerCase()
      .includes(normalizedSearch);

    if (labelMatches) {
      return [option];
    }

    if (!option.children?.length) {
      return [];
    }

    const filteredChildren = filterOptions(option.children, normalizedSearch);

    if (!filteredChildren.length) {
      return [];
    }

    return [{ ...option, children: filteredChildren }];
  });
}

const FilterOption: FC<{
  option: TreeFilterOption;
  depth: number;
  selected: Set<string>;
  onSelect: (values: string[], checked: boolean) => void;
  autoOpenKey?: number;
}> = ({ option, depth, selected, onSelect, autoOpenKey }) => {
  const hasChildren = option.children && option.children.length > 0;
  const [open, setOpen] = useState(false);
  const lastAutoOpenKeyRef = useRef<number | undefined>(undefined);

  const leafValues = getLeafValues(option);
  const checkedCount = leafValues.filter((v) => selected.has(v)).length;
  const isChecked = checkedCount === leafValues.length;
  const isIndeterminate = checkedCount > 0 && checkedCount < leafValues.length;

  useEffect(() => {
    if (!autoOpenKey || lastAutoOpenKeyRef.current === autoOpenKey) return;

    lastAutoOpenKeyRef.current = autoOpenKey;
    setOpen(true);
  }, [autoOpenKey]);

  const handleRowClick = () => {
    setOpen((v) => !v);

    if (!hasChildren) {
      onSelect(leafValues, !isChecked);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'hover:bg-bg-5 flex cursor-pointer items-center gap-1 rounded-lg px-2 py-2 text-sm',
          depth > 0 ? 'pl-9' : '',
        )}
        onClick={handleRowClick}
      >
        <Checkbox
          checked={isIndeterminate ? 'indeterminate' : isChecked}
          onCheckedChange={(checked) => {
            const newChecked = checked === true;
            onSelect(leafValues, newChecked);
            if (newChecked) {
              setOpen(true);
            } else if (checked === false) {
              setOpen(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="mr-1 shrink-0 rounded-sm"
        />
        <span className={cn('text-t-1100 flex-1 text-sm')}>{option.label}</span>
        {hasChildren && (
          <ChevronDownIcon
            size={16}
            className={cn(
              'text-t-1100 shrink-0 transition-transform duration-300',
              open ? '' : '-rotate-90',
            )}
          />
        )}
      </div>
      {hasChildren && (
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            {option.children!.map((child) => (
              <FilterOption
                key={child.value}
                option={child}
                depth={depth + 1}
                selected={selected}
                onSelect={onSelect}
                autoOpenKey={autoOpenKey}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TreeFilterContent: FC<TreeFilterContentProps> = ({
  value,
  options,
  onValueChange,
  groupLabel,
  scrollClassName = 'max-h-60',
  shadowClassName = 'to-popover',
  focusOnMount = false,
}) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');
  const [autoOpenKey, setAutoOpenKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = new Set<string>(value ? value.split(',') : []);
  const filtered = filterOptions(options, search);
  const normalizedSearch = search.trim();
  const hasSearch = !!normalizedSearch;

  useEffect(() => {
    if (!focusOnMount) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [focusOnMount]);

  const handleSearchChange = (inputValue: string) => {
    setSearch((prevSearch) => {
      if (!prevSearch.trim() && inputValue.trim()) {
        setAutoOpenKey((key) => key + 1);
      }
      return inputValue;
    });
  };

  const handleSelect = (values: string[], checked: boolean) => {
    const next = new Set(selected);
    if (checked) {
      values.forEach((v) => next.add(v));
    } else {
      values.forEach((v) => next.delete(v));
    }

    onValueChange(next.size > 0 ? [...next].join(',') : undefined);
  };

  const handleReset = () => {
    onValueChange(undefined);
    setSpinning(true);
    setTimeout(() => setSpinning(false), 300);
  };

  return (
    <>
      <Input
        ref={inputRef}
        value={search}
        prefix={<SearchIcon size={16} />}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={t`Search Action`}
        variant="ghost"
        className="md:bg-bg-5 rounded-lg px-3 text-xs outline-none"
        inputClassName="h-4 placeholder:text-t-430 text-xs"
      />

      <div
        className="flex cursor-pointer items-center justify-between px-1"
        onClick={handleReset}
      >
        <span className="text-t-430 text-xs capitalize">{t`Clear Selection`}</span>
        <ArrowClockwiseIcon
          size={16}
          className={cn(
            'text-accent origin-[8px_9.4px] cursor-pointer transition-[color,rotate] duration-300',
            spinning ? 'rotate-360' : 'transition-none',
          )}
        />
      </div>

      <Separator />

      {groupLabel ? (
        <div className="text-t-430 px-1 text-xs">{groupLabel}</div>
      ) : null}

      <ScrollBox
        className={cn(
          'flex flex-col overflow-y-auto select-none',
          scrollClassName,
        )}
        shadowClassName={shadowClassName}
      >
        <div className="flex flex-col gap-0.5">
          {filtered.length ? (
            filtered.map((opt) => (
              <FilterOption
                key={opt.value}
                option={opt}
                depth={0}
                selected={selected}
                onSelect={handleSelect}
                autoOpenKey={hasSearch ? autoOpenKey : undefined}
              />
            ))
          ) : hasSearch ? (
            <div className="text-t-350 mt-6 h-20 px-2 text-center text-sm">
              {t`No matching results found.`}
            </div>
          ) : null}
        </div>
      </ScrollBox>
    </>
  );
};

const TreeFilter: FC<TreeFilterProps> = ({
  label,
  value,
  options,
  onValueChange,
}) => {
  const selectedCount = value ? value.split(',').filter(Boolean).length : 0;

  return (
    <Popover>
      <PopoverTrigger className="group text-t-350 flex cursor-pointer items-center gap-1.5 p-0 text-xs outline-none">
        {label}
        {selectedCount > 0 && (
          <span className="text-t-1100 bg-bg-3 min-w-4 rounded-sm px-1 text-center text-[10px]">
            {selectedCount}
          </span>
        )}
        <FilterIcon
          size={14}
          className={cn(
            'text-t-430 group-hover:text-t-270',
            value ? 'text-t-270' : '',
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        side="top"
        className="flex w-auto min-w-60 flex-col gap-2 rounded-lg p-2"
      >
        <TreeFilterContent
          value={value}
          options={options}
          onValueChange={onValueChange}
          focusOnMount
        />
      </PopoverContent>
    </Popover>
  );
};

export default TreeFilter;
