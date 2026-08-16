'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  ArrowClockwiseIcon,
  CheckIcon,
  ChevronDownIcon,
  cn,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SearchIcon,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  Separator,
} from '@repo/ui';
import { DASHBOARD_PERIOD_OPTIONS } from './dashboardChart.data';
import { resolveDashboardLabel } from './dashboardChart.types';
import type {
  DashboardChartFilterConfig,
  DashboardChartFilterState,
  DashboardFilterModeDefinition,
  DashboardOption,
} from './dashboardChart.types';

const modeTriggerClassName =
  'text-t-1100 bg-bg-3 flex !h-6 w-auto min-w-[58px] items-center gap-1 rounded-lg px-3 text-xs';

const popoverContentClassName =
  'bg-bg-3 w-[180px] min-w-[180px] rounded-xl p-2 shadow-[-40px_10px_80px_0_rgba(0,0,0,0.1)]';

const selectItemClassName =
  'mt-1 h-6 rounded-lg px-2 py-1 pr-8 text-xs font-normal  first:mt-0 hover:bg-bg-4 data-[state=checked]:bg-bg-4 [&>span:first-child]:right-2 [&>span:first-child]:size-4 [&>span:first-child_svg]:size-4';

const chipBaseClassName =
  'inline-flex h-6 items-center gap-2 rounded-lg border px-2 text-xs font-normal transition-[border-color,color,background] whitespace-nowrap';

const chipActiveClassName =
  'border-[rgba(191,207,255,0.1)] bg-transparent text-t-1100';

const chipInactiveClassName =
  'border-[rgba(191,207,255,0.08)] bg-transparent text-t-270 hover:text-t-1100';

const chipBulkClassName =
  'inline-flex h-6 items-center rounded-lg border border-[rgba(191,207,255,0.1)] px-2 text-xs font-normal text-t-1100 hover:bg-bg-3 transition-[background] whitespace-nowrap';

const periodTabClassName =
  'inline-flex h-6 items-center justify-center rounded-lg px-3 text-xs font-normal transition-[background,color]';

const periodTabActiveClassName = 'bg-bg-3 text-accent';

const periodTabInactiveClassName = 'text-t-270 hover:text-t-1100';

const resetButtonClassName =
  'bg-bg-3 text-t-1100 hover:bg-bg-3/80 flex size-6 shrink-0 items-center justify-center rounded-xl transition-[background]';

const OTHERS_OPTION: DashboardOption = { value: 'others', label: msg`Others` };
const OTHERS_COLOR = '#A0ADB3';

interface DashboardChartToolbarProps {
  config: DashboardChartFilterConfig;
  state: DashboardChartFilterState;
  onChange: (nextState: DashboardChartFilterState) => void;
  onReset: () => void;
  chipOrder?: string[];
  legendColors?: Record<string, string>;
}

function applyChipOrder(
  options: DashboardOption[],
  order: string[] | undefined,
) {
  if (!order?.length) return options;
  const orderIndex = new Map(order.map((value, index) => [value, index]));
  const ordered = [...options];
  ordered.sort((left, right) => {
    const leftIdx = orderIndex.get(left.value) ?? Number.POSITIVE_INFINITY;
    const rightIdx = orderIndex.get(right.value) ?? Number.POSITIVE_INFINITY;
    if (leftIdx === rightIdx) return 0;
    return leftIdx - rightIdx;
  });
  return ordered;
}

interface ViewByDropdownProps {
  activeMode: DashboardFilterModeDefinition;
  modes: DashboardFilterModeDefinition[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (modeId: string) => void;
}

const ViewByDropdown = memo(function ViewByDropdown({
  activeMode,
  modes,
  isOpen,
  onOpenChange,
  onModeChange,
}: ViewByDropdownProps) {
  const { i18n } = useLingui();
  return (
    <Select
      value={activeMode.id}
      onOpenChange={onOpenChange}
      onValueChange={onModeChange}
    >
      <SelectTrigger
        className={modeTriggerClassName}
        hiddenIcon
        aria-label={i18n._(msg`View by`)}
      >
        <span className="truncate">
          {resolveDashboardLabel(activeMode.label, i18n)}
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
        align="start"
        className={popoverContentClassName}
      >
        <SelectGroup>
          {modes.map((mode) => (
            <SelectItem
              key={mode.id}
              value={mode.id}
              className={selectItemClassName}
            >
              {resolveDashboardLabel(mode.label, i18n)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
});

interface SelectedChipsProps {
  options: DashboardOption[];
  selected: string[];
  selectionMode: DashboardFilterModeDefinition['selectionMode'];
  interactive: boolean;
  onToggle: (value: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  colors?: Record<string, string>;
}

const SelectedChips = memo(function SelectedChips({
  options,
  selected,
  selectionMode,
  interactive,
  onToggle,
  onSelectAll,
  onDeselectAll,
  colors,
}: SelectedChipsProps) {
  const { i18n } = useLingui();
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allSelected =
    options.length > 0 &&
    options.every((option) => selectedSet.has(option.value));
  const showBulkButton =
    interactive && selectionMode === 'multiple' && options.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {options.map((option) => {
        const isSelected = selectedSet.has(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              chipBaseClassName,
              isSelected ? chipActiveClassName : chipInactiveClassName,
            )}
            onClick={() => onToggle(option.value)}
            disabled={!interactive}
            aria-pressed={isSelected}
          >
            <span
              className={cn(
                'size-3.5 shrink-0 rounded-sm',
                isSelected
                  ? ''
                  : 'border border-[rgba(255,255,255,0.1)] bg-transparent',
              )}
              style={
                isSelected
                  ? {
                      backgroundColor:
                        option.value === OTHERS_OPTION.value
                          ? OTHERS_COLOR
                          : colors?.[option.value],
                    }
                  : undefined
              }
            />
            {resolveDashboardLabel(option.label, i18n)}
          </button>
        );
      })}
      {showBulkButton ? (
        <button
          type="button"
          className={chipBulkClassName}
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? <Trans>Deselect All</Trans> : <Trans>Select All</Trans>}
        </button>
      ) : null}
    </div>
  );
});

interface PairSelectionPopoverProps {
  options: DashboardOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

interface PairSelectionOptionProps {
  isSelected: boolean;
  option: DashboardOption;
  onToggle: (value: string) => void;
}

const PairSelectionOption = memo(function PairSelectionOption({
  isSelected,
  option,
  onToggle,
}: PairSelectionOptionProps) {
  const { i18n } = useLingui();
  return (
    <button
      type="button"
      className="text-t-1100 hover:bg-bg-4 flex h-6 w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs"
      onClick={() => onToggle(option.value)}
      aria-pressed={isSelected}
    >
      <span>{resolveDashboardLabel(option.label, i18n)}</span>
      {isSelected ? <CheckIcon size={16} /> : null}
    </button>
  );
});

const PairSelectionPopover = memo(function PairSelectionPopover({
  options,
  selected,
  onToggle,
}: PairSelectionPopoverProps) {
  const { t, i18n } = useLingui();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return options;
    return options.filter((option) =>
      resolveDashboardLabel(option.label, i18n)
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [options, search, i18n]);
  const selectedOptions = useMemo(
    () => filteredOptions.filter((option) => selectedSet.has(option.value)),
    [filteredOptions, selectedSet],
  );
  const otherOptions = useMemo(
    () => filteredOptions.filter((option) => !selectedSet.has(option.value)),
    [filteredOptions, selectedSet],
  );
  const selectedCount = selected.length;
  const totalCount = options.length;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch('');
      }}
    >
      <PopoverTrigger className={modeTriggerClassName}>
        <span>
          <Trans>{selectedCount} Pairs Selected</Trans>
        </span>
        <ChevronDownIcon
          className={cn(
            'size-3 shrink-0 transition-transform',
            open ? 'rotate-180' : '',
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="bg-bg-3 flex max-h-[314px] w-[180px] flex-col gap-2 rounded-xl p-2"
      >
        <Input
          className="bg-bg-4"
          inputClassName="text-xs font-normal"
          variant="ghost"
          value={search}
          maxLength={42}
          prefix={<SearchIcon size={20} />}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t`Search Pairs`}
        />
        <Separator />
        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
          <div className="text-t-270 mb-1 text-xs/3.5">
            <Trans>Selected</Trans>
          </div>
          <div className="flex flex-col gap-1">
            {selectedOptions.map((option) => (
              <PairSelectionOption
                key={option.value}
                option={option}
                isSelected
                onToggle={onToggle}
              />
            ))}
          </div>
          <Separator className="my-2" />
          <div className="text-t-270 mb-1 text-xs/3.5">
            <Trans>Other</Trans>
          </div>
          <div className="flex flex-col gap-1">
            {otherOptions.map((option) => (
              <PairSelectionOption
                key={option.value}
                option={option}
                isSelected={false}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
        <Separator />
        <div className="text-t-270 shrink-0 text-xs/3.5">
          <Trans>{selectedCount} of {totalCount} Selected</Trans>
        </div>
      </PopoverContent>
    </Popover>
  );
});

interface SingleSelectionDropdownProps {
  activeMode: DashboardFilterModeDefinition;
  selected: string;
  onChange: (value: string) => void;
}

const SingleSelectionDropdown = memo(function SingleSelectionDropdown({
  activeMode,
  selected,
  onChange,
}: SingleSelectionDropdownProps) {
  const { i18n } = useLingui();
  const activeOptionLabel =
    activeMode.options.find((option) => option.value === selected)?.label;
  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger
        className={modeTriggerClassName}
        hiddenIcon
        aria-label={resolveDashboardLabel(activeMode.label, i18n)}
      >
        <span className="truncate">
          {activeOptionLabel
            ? resolveDashboardLabel(activeOptionLabel, i18n)
            : selected}
        </span>
        <ChevronDownIcon className="size-3 shrink-0" />
      </SelectTrigger>
      <SelectContent
        side="bottom"
        align="start"
        className={popoverContentClassName}
      >
        <SelectGroup>
          {activeMode.options.map((option) => (
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
  );
});

interface PeriodTabsProps {
  period: DashboardChartFilterState['period'];
  onPeriodChange: (value: string) => void;
}

const PeriodTabs = memo(function PeriodTabs({
  period,
  onPeriodChange,
}: PeriodTabsProps) {
  const { t, i18n } = useLingui();
  return (
    <div className="flex items-center">
      {DASHBOARD_PERIOD_OPTIONS.map((option) => {
        const isActive = option.value === period;
        const label = resolveDashboardLabel(option.label, i18n);
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              periodTabClassName,
              isActive ? periodTabActiveClassName : periodTabInactiveClassName,
            )}
            onClick={() => onPeriodChange(option.value)}
            aria-label={t`Period ${label}`}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
});

export const DashboardChartToolbar = ({
  config,
  state,
  onChange,
  onReset,
  chipOrder,
  legendColors,
}: DashboardChartToolbarProps) => {
  const { t } = useLingui();
  const [viewModeOpen, setViewModeOpen] = useState(false);
  const [resetAnimationKey, setResetAnimationKey] = useState(0);

  const activeMode = useMemo(
    () =>
      config.modes.find((mode) => mode.id === state.modeId) ?? config.modes[0]!,
    [config.modes, state.modeId],
  );
  const canSelectMode = config.modes.length > 1;
  const canSelectCurrentValues =
    !activeMode.disableSelectedSelect && activeMode.selectionMode !== 'fixed';
  const showChipArea =
    Boolean(activeMode.legendOptions?.length) ||
    (activeMode.options.length > 0 &&
      !(
        activeMode.options.length === 1 &&
        activeMode.options[0]?.value === 'all'
      ));
  const showModeSelect = canSelectMode;
  const hasPairSelector =
    activeMode.id === 'pairs' && activeMode.selectionMode === 'multiple';
  const hasSingleValueSelector =
    activeMode.selectedDisplay === 'select' &&
    activeMode.selectionMode === 'single';
  const includeOthersLegend =
    hasPairSelector && activeMode.includeOthersLegend === true;
  const legendSelected = useMemo(
    () =>
      state.legendSelected ??
      activeMode.legendOptions?.map((option) => option.value) ?? [
        ...state.selected,
        ...(includeOthersLegend ? [OTHERS_OPTION.value] : []),
      ],
    [
      activeMode.legendOptions,
      includeOthersLegend,
      state.legendSelected,
      state.selected,
    ],
  );

  const orderedOptions = useMemo(
    () =>
      activeMode.id === 'all'
        ? activeMode.options
        : applyChipOrder(activeMode.options, chipOrder),
    [activeMode.id, activeMode.options, chipOrder],
  );
  const legendOptions = useMemo(() => {
    if (activeMode.legendOptions) return activeMode.legendOptions;
    if (!hasPairSelector) return orderedOptions;
    const selectedOptions = orderedOptions.filter((option) =>
      state.selected.includes(option.value),
    );
    return [
      ...applyChipOrder(selectedOptions, state.legendOrder),
      ...(includeOthersLegend ? [OTHERS_OPTION] : []),
    ];
  }, [
    hasPairSelector,
    activeMode.legendOptions,
    includeOthersLegend,
    orderedOptions,
    state.legendOrder,
    state.selected,
  ]);

  const sanitizeSelected = useCallback(
    (mode: DashboardFilterModeDefinition, values: string[]) => {
      if (mode.selectionMode === 'fixed' || mode.disableSelectedSelect) {
        return [...mode.defaultSelected];
      }

      const valueSet = new Set(values);
      const orderedValues = mode.options.flatMap((option) =>
        valueSet.has(option.value) ? [option.value] : [],
      );

      if (mode.selectionMode === 'single') {
        return orderedValues[0]
          ? [orderedValues[0]]
          : ([mode.defaultSelected[0] ?? mode.options[0]?.value].filter(
              Boolean,
            ) as string[]);
      }

      return orderedValues;
    },
    [],
  );

  const applyState = useCallback(
    (
      modeId: string,
      selectedValues: string[],
      period: DashboardChartFilterState['period'] = state.period,
    ) => {
      const mode = config.modes.find((item) => item.id === modeId);
      if (!mode) return;
      const includeOthers =
        mode.includeOthersLegend && mode.defaultOthersChecked !== false;
      onChange({
        modeId: mode.id,
        selected: sanitizeSelected(mode, selectedValues),
        legendSelected:
          mode.legendOptions
            ? mode.legendOptions.map((option) => option.value)
            : mode.selectionMode === 'multiple'
            ? [
                ...sanitizeSelected(mode, selectedValues),
                ...(includeOthers ? [OTHERS_OPTION.value] : []),
              ]
            : undefined,
        legendOrder: undefined,
        period,
      });
    },
    [config.modes, onChange, sanitizeSelected, state.period],
  );

  const handleModeChange = useCallback(
    (nextModeId: string) => {
      const nextMode = config.modes.find((mode) => mode.id === nextModeId);
      if (!nextMode) return;
      applyState(nextMode.id, nextMode.defaultSelected);
    },
    [applyState, config.modes],
  );

  const handleChipToggle = useCallback(
    (value: string) => {
      if (!showChipArea) return;
      if (activeMode.legendOptions) {
        const nextLegendSelected = legendSelected.includes(value)
          ? legendSelected.filter((item) => item !== value)
          : [...legendSelected, value];
        onChange({ ...state, legendSelected: nextLegendSelected });
        return;
      }
      if (activeMode.selectionMode === 'single') {
        applyState(activeMode.id, [value]);
        return;
      }
      const nextLegendSelected = legendSelected.includes(value)
        ? legendSelected.filter((item) => item !== value)
        : [...legendSelected, value];
      onChange({
        ...state,
        legendSelected: nextLegendSelected,
      });
    },
    [
      activeMode,
      applyState,
      legendSelected,
      onChange,
      showChipArea,
      state,
    ],
  );

  const handleSelectAll = useCallback(() => {
    if (!showChipArea) return;
    onChange({
      ...state,
      legendSelected: legendOptions.map((option) => option.value),
    });
  }, [
    legendOptions,
    onChange,
    showChipArea,
    state,
  ]);

  const handleDeselectAll = useCallback(() => {
    if (!showChipArea) return;
    onChange({ ...state, legendSelected: [] });
  }, [onChange, showChipArea, state]);

  const handlePairSelectionToggle = useCallback(
    (value: string) => {
      const isSelected = state.selected.includes(value);
      const nextSelected = isSelected
        ? state.selected.filter((item) => item !== value)
        : [...state.selected, value];
      const nextLegendSelected = isSelected
        ? legendSelected.filter((item) => item !== value)
        : [...legendSelected, value];
      onChange({
        ...state,
        selected: sanitizeSelected(activeMode, nextSelected),
        legendSelected: nextLegendSelected,
        legendOrder: undefined,
      });
    },
    [
      activeMode,
      legendSelected,
      onChange,
      sanitizeSelected,
      state,
    ],
  );

  const handlePeriodChange = useCallback(
    (value: string) => {
      onChange({
        ...state,
        period: value as DashboardChartFilterState['period'],
      });
    },
    [onChange, state],
  );

  const handleResetAll = useCallback(() => {
    setViewModeOpen(false);
    setResetAnimationKey((key) => key + 1);
    onReset();
  }, [onReset]);

  const allowPeriod = config.allowPeriod !== false;
  const hasDropdowns =
    hasPairSelector || hasSingleValueSelector || showModeSelect;

  return (
    <div className="flex h-full flex-col gap-2 p-1">
      <div className="flex flex-wrap items-center gap-3">
        {allowPeriod ? (
          <PeriodTabs
            period={state.period}
            onPeriodChange={handlePeriodChange}
          />
        ) : (
          <span />
        )}
        {hasDropdowns ? (
          <div className="order-last flex basis-full items-center justify-start gap-3 md:order-none md:ml-auto md:basis-auto md:justify-end">
            {hasPairSelector ? (
              <PairSelectionPopover
                options={orderedOptions}
                selected={state.selected}
                onToggle={handlePairSelectionToggle}
              />
            ) : null}
            {hasSingleValueSelector ? (
              <SingleSelectionDropdown
                activeMode={activeMode}
                selected={state.selected[0] ?? ''}
                onChange={(value) => applyState(activeMode.id, [value])}
              />
            ) : null}
            {showModeSelect ? (
              <ViewByDropdown
                activeMode={activeMode}
                modes={config.modes}
                isOpen={viewModeOpen}
                onOpenChange={setViewModeOpen}
                onModeChange={handleModeChange}
              />
            ) : null}
            <Separator
              className="hidden !h-6 md:flex"
              orientation="vertical"
            />
          </div>
        ) : null}
        <button
          type="button"
          className={cn(
            resetButtonClassName,
            hasDropdowns ? 'ml-auto md:ml-0' : 'ml-auto',
          )}
          onClick={handleResetAll}
          aria-label={t`Reset filters`}
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

      {showChipArea ? (
        <div className="flex flex-1 items-center justify-center">
          <SelectedChips
            options={legendOptions}
            selected={legendSelected}
            selectionMode={
              activeMode.allowLegendSelectAll
                ? 'multiple'
                : activeMode.selectionMode
            }
            interactive={
              activeMode.allowLegendSelectAll || canSelectCurrentValues
            }
            onToggle={handleChipToggle}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            colors={legendColors}
          />
        </div>
      ) : null}
    </div>
  );
};
