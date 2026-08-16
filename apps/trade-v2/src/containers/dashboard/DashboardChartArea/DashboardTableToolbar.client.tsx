'use client';

import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  ArrowClockwiseIcon,
  ChevronDownIcon,
  cn,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  Separator,
} from '@repo/ui';
import { resolveDashboardLabel } from './dashboardChart.types';
import type {
  DashboardSortConfig,
  DashboardTableFilterState,
} from './dashboardChart.types';

const sortTriggerClassName =
  'bg-bg-3 text-t-1100 hover:bg-bg-3/80 flex !h-6 w-auto min-w-[118px] items-center justify-between gap-2 rounded-lg px-3 text-xs font-medium transition-[background]';
const popoverContentClassName =
  'bg-bg-3 w-[180px] min-w-[180px] rounded-xl p-2 shadow-[-40px_10px_80px_0_rgba(0,0,0,0.1)]';
const selectItemClassName =
  'mt-1 h-6 rounded-lg px-2 py-1 pr-8 text-xs font-normal  first:mt-0 hover:bg-bg-4 data-[state=checked]:bg-bg-4 [&>span:first-child]:right-2 [&>span:first-child]:size-4 [&>span:first-child_svg]:size-4';
const resetButtonClassName =
  'bg-bg-3 text-t-1100 hover:bg-bg-3/80 flex size-6 shrink-0 items-center justify-center rounded-xl transition-[background]';

interface DashboardTableToolbarProps {
  config: DashboardSortConfig;
  state: DashboardTableFilterState;
  onChange: (nextState: DashboardTableFilterState) => void;
  onReset: () => void;
}

export const DashboardTableToolbar = ({
  config,
  state,
  onChange,
  onReset,
}: DashboardTableToolbarProps) => {
  const { t, i18n } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const [resetAnimationKey, setResetAnimationKey] = useState(0);
  const activeOption =
    config.options.find((option) => option.value === state.sortBy) ??
    config.options[0];

  return (
    <div className="flex items-center justify-end gap-3 p-1">
      <Select
        value={state.sortBy}
        onOpenChange={setIsOpen}
        onValueChange={(sortBy) => onChange({ sortBy })}
      >
        <SelectTrigger
          className={sortTriggerClassName}
          hiddenIcon
          aria-label={resolveDashboardLabel(config.label, i18n)}
        >
          <span className="truncate">
            {activeOption
              ? resolveDashboardLabel(activeOption.label, i18n)
              : null}
          </span>
          <ChevronDownIcon
            className={cn(
              'size-3 shrink-0 transition-transform',
              isOpen ? 'rotate-180' : '',
            )}
          />
        </SelectTrigger>
        <SelectContent
          side="bottom"
          align="end"
          className={popoverContentClassName}
        >
          <SelectGroup>
            {config.options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={selectItemClassName}
              >
                {resolveDashboardLabel(option.label, i18n)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Separator className="!h-6" orientation="vertical" />
      <button
        type="button"
        className={resetButtonClassName}
        onClick={() => {
          setIsOpen(false);
          setResetAnimationKey((key) => key + 1);
          onReset();
        }}
        aria-label={t`Reset sort`}
      >
        <ArrowClockwiseIcon
          key={resetAnimationKey}
          size={14}
          className={
            resetAnimationKey > 0
              ? 'origin-[7px_8.26px] animate-[spin_500ms_ease-out_1]'
              : 'origin-[7px_8.26px]'
          }
        />
      </button>
    </div>
  );
};
