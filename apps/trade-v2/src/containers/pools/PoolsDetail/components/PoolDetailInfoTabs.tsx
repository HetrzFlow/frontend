'use client';

import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  ChevronDownIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  cn,
} from '@repo/ui';
import { TradeTabs } from '@/common';
import { useHydrated } from '@/common/hooks/useHydrated';
import ModuleCard from '@/components/ModuleCard';
import { usePoolApyData, usePoolChartData } from '@/queries/bsc/pools';
import type { PoolDetailQueryData } from '@/queries/bsc/pools';
import { APY_PERIOD, CHART_TYPE } from '@/services/rest/pools';
import type { fetchPoolChartData } from '@/services/rest/pools';
import { usePoolTvlUsd } from '@/stores/synthetics/marketsData/selectors';
import PoolDetailInfoTabsSkeleton from './PoolDetailInfoTabsSkeleton';
import TvlTabsContent from './TvlTabsContent';

const FeeAprTabsContent = dynamic(() => import('./FeeAprTabsContent'), {
  loading: () => (
    <div className="flex flex-col">
      <div className="shrink-0">
        <div className="mb-3 flex justify-between">
          <div className="bg-bg-3 h-[28.8px] w-28 rounded-xl" />
        </div>
      </div>
      <div className="bg-bg-3 h-40 w-full rounded-xl" />
    </div>
  ),
});

let hasPrefetchedPoolFeeAprTab = false;

const preloadPoolFeeAprTab = () => {
  if (hasPrefetchedPoolFeeAprTab) return;
  hasPrefetchedPoolFeeAprTab = true;
  void import('./FeeAprTabsContent');
};

export enum PoolDetailInfoTabType {
  TVL = 'TVL',
  FEE_APR = 'FEE_APR',
}

function PeriodActiveBar({ activeEle }: { activeEle: HTMLDivElement | null }) {
  const barRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const barEle = barRef.current;
    if (barEle && activeEle) {
      const updateStyle = () => {
        const { offsetLeft, offsetWidth } = activeEle;
        Object.assign(barEle.style, {
          transform: `translateX(${offsetLeft}px)`,
          width: `${offsetWidth}px`,
        });
        if (!mountedRef.current) {
          mountedRef.current = true;
          requestAnimationFrame(() => {
            barEle.style.transitionDuration = '300ms';
          });
        }
      };

      updateStyle();
      const rafId = requestAnimationFrame(updateStyle);
      const observer = new ResizeObserver(() => updateStyle());
      observer.observe(activeEle);
      return () => {
        cancelAnimationFrame(rafId);
        observer.disconnect();
      };
    }
  }, [activeEle]);

  return (
    <div
      ref={barRef}
      className={`bg-bg-3 pointer-events-none absolute top-0 left-0 h-full rounded-lg transition-[width,transform] ${
        activeEle ? 'visible' : 'invisible'
      }`}
    />
  );
}

type PeriodLabels = Record<APY_PERIOD, string>;

const getPeriodLabel = (period: APY_PERIOD, periodLabels: PeriodLabels) =>
  periodLabels[period] ?? period;

type PoolChartQuery = ReturnType<typeof usePoolChartData>;
type PoolApyQuery = ReturnType<typeof usePoolApyData>;
type PoolTvlUsd = ReturnType<typeof usePoolTvlUsd>;

type PeriodSelectDialogProps = {
  period: APY_PERIOD;
  periodOpen: boolean;
  onPeriodOpenChange: (open: boolean) => void;
  onPeriodChange: (period: APY_PERIOD) => void;
  titleLabel: string;
  periodLabels: PeriodLabels;
};

const PeriodSelectDialog = memo(function PeriodSelectDialog({
  period,
  periodOpen,
  onPeriodOpenChange,
  onPeriodChange,
  titleLabel,
  periodLabels,
}: PeriodSelectDialogProps) {
  return (
    <Dialog open={periodOpen} onOpenChange={onPeriodOpenChange} modal>
      <DialogTrigger className="bg-bg-2 flex h-8 items-center gap-2 rounded-xl px-3 py-2 text-[13px] leading-normal font-medium tracking-[-0.52px] text-white">
        <span>{getPeriodLabel(period, periodLabels)}</span>
        <ChevronDownIcon
          className={cn(
            'text-white transition-transform duration-300',
            periodOpen ? '-rotate-180' : '',
          )}
          size={16}
        />
      </DialogTrigger>
      <DialogContent position="bottom">
        <DialogTitle>{titleLabel}</DialogTitle>
        <DialogDescription className="sr-only">{titleLabel}</DialogDescription>
        <div className="space-y-2">
          {Object.values(APY_PERIOD).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium',
                  isActive ? 'bg-bg-4' : 'bg-transparent',
                )}
                onClick={() => {
                  onPeriodChange(p);
                  onPeriodOpenChange(false);
                }}
              >
                <span>{getPeriodLabel(p, periodLabels)}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
});

type DesktopPeriodPickerProps = {
  period: APY_PERIOD;
  periodRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  activePeriodEle: HTMLDivElement | null;
  onPeriodChange: (period: APY_PERIOD) => void;
  periodLabels: PeriodLabels;
};

const DesktopPeriodPicker = memo(function DesktopPeriodPicker({
  period,
  periodRefs,
  activePeriodEle,
  onPeriodChange,
  periodLabels,
}: DesktopPeriodPickerProps) {
  return (
    <div className="relative flex items-center gap-1">
      {Object.values(APY_PERIOD).map((p) => (
        <div
          key={p}
          ref={(el) => {
            periodRefs.current[p] = el;
          }}
          role="button"
          tabIndex={0}
          aria-pressed={period === p}
          onClick={() => onPeriodChange(p)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onPeriodChange(p);
            }
          }}
          className={`z-[1] cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            period === p ? 'text-t-1100' : 'text-t-270 hover:text-t-1100'
          }`}
        >
          {getPeriodLabel(p, periodLabels)}
        </div>
      ))}
      <PeriodActiveBar activeEle={activePeriodEle} />
    </div>
  );
});

type PoolDetailTabsViewProps = {
  tabValue: PoolDetailInfoTabType;
  onTabValueChange: (value: string) => void;
  tvlUsd: PoolTvlUsd;
  tvlChartQuery: PoolChartQuery;
  apyChartQuery: PoolChartQuery;
  apyQuery: PoolApyQuery;
  period: APY_PERIOD;
};

type PoolDetailDesktopTabsProps = PoolDetailTabsViewProps & {
  constrained: boolean;
  cardClassName: string;
  innerClassName?: string;
  tabsWrapRef: RefObject<HTMLDivElement | null>;
  periodRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  activePeriodEle: HTMLDivElement | null;
  showBottomShadow: boolean;
  periodLabels: PeriodLabels;
  onPeriodChange: (period: APY_PERIOD) => void;
  onScrollShadowUpdate: () => void;
};

const PoolDetailDesktopTabs = memo(function PoolDetailDesktopTabs({
  tabValue,
  onTabValueChange,
  tvlUsd,
  tvlChartQuery,
  apyChartQuery,
  apyQuery,
  period,
  constrained,
  cardClassName,
  innerClassName,
  tabsWrapRef,
  periodRefs,
  activePeriodEle,
  showBottomShadow,
  periodLabels,
  onPeriodChange,
  onScrollShadowUpdate,
}: PoolDetailDesktopTabsProps) {
  return (
    <div className="hidden md:block">
      <ModuleCard className={cardClassName}>
        <div
          ref={tabsWrapRef}
          className={innerClassName}
          onScroll={constrained ? onScrollShadowUpdate : undefined}
        >
          <TradeTabs
            value={tabValue}
            onValueChange={onTabValueChange}
            disableAnimation
            listLayoutClassName="flex"
            listClassName="gap-1 justify-start"
            activeBarClassName="bg-bg-3 rounded-lg"
            labelClassName="h-auto flex-none grow-0 rounded-lg px-3 py-1.5 text-xs data-[state=active]:text-t-1100"
            contentWrapClassName={'mt-1 min-h-0 flex-1 flex flex-col gap-3'}
            options={[
              {
                value: PoolDetailInfoTabType.TVL,
                label: <Trans>TVL</Trans>,
                content:
                  tabValue === PoolDetailInfoTabType.TVL ? (
                    <TvlTabsContent
                      tvlUsd={tvlUsd}
                      chartData={tvlChartQuery.data}
                      isChartLoading={tvlChartQuery.isLoading}
                      isChartError={tvlChartQuery.isError}
                      period={period}
                    />
                  ) : null,
              },
              {
                value: PoolDetailInfoTabType.FEE_APR,
                label: <Trans>Fee APR</Trans>,
                onTriggerHover: preloadPoolFeeAprTab,
                onTriggerFocus: preloadPoolFeeAprTab,
                content:
                  tabValue === PoolDetailInfoTabType.FEE_APR ? (
                    <FeeAprTabsContent
                      apyData={apyQuery.data}
                      chartData={apyChartQuery.data}
                      status={{
                        apyLoading: apyQuery.isLoading,
                        chartLoading: apyChartQuery.isLoading,
                        apyError: apyQuery.isError,
                        chartError: apyChartQuery.isError,
                      }}
                      period={period}
                    />
                  ) : null,
              },
            ]}
            sideContent={
              <DesktopPeriodPicker
                period={period}
                periodRefs={periodRefs}
                activePeriodEle={activePeriodEle}
                onPeriodChange={onPeriodChange}
                periodLabels={periodLabels}
              />
            }
          />
        </div>
        {constrained && showBottomShadow ? (
          <div className="to-bg-card-mix pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-b from-transparent" />
        ) : null}
      </ModuleCard>
    </div>
  );
});

type PoolDetailMobileTabsProps = PoolDetailTabsViewProps & {
  periodSelect: ReactNode;
};

const PoolDetailMobileTabs = memo(function PoolDetailMobileTabs({
  tabValue,
  onTabValueChange,
  tvlUsd,
  tvlChartQuery,
  apyChartQuery,
  apyQuery,
  period,
  periodSelect,
}: PoolDetailMobileTabsProps) {
  return (
    <div className="block md:hidden">
      <TradeTabs
        value={tabValue}
        onValueChange={onTabValueChange}
        disableAnimation
        listLayoutClassName="flex"
        listClassName="gap-1 justify-start"
        activeBarClassName="bg-bg-3 rounded-lg"
        labelClassName="h-auto flex-none grow-0 rounded-lg px-3 py-1.5 text-xs data-[state=active]:text-t-1100"
        contentWrapClassName={cn(
          'mt-2 flex-1 flex flex-col gap-3 overflow-hidden',
        )}
        options={[
          {
            value: PoolDetailInfoTabType.TVL,
            label: <Trans>TVL</Trans>,
            content:
              tabValue === PoolDetailInfoTabType.TVL ? (
                <TvlTabsContent
                  tvlUsd={tvlUsd}
                  chartData={tvlChartQuery.data}
                  isChartLoading={tvlChartQuery.isLoading}
                  isChartError={tvlChartQuery.isError}
                  headerRight={periodSelect}
                  period={period}
                />
              ) : null,
          },
          {
            value: PoolDetailInfoTabType.FEE_APR,
            label: <Trans>Fee APR</Trans>,
            onTriggerHover: preloadPoolFeeAprTab,
            onTriggerFocus: preloadPoolFeeAprTab,
            content:
              tabValue === PoolDetailInfoTabType.FEE_APR ? (
                <FeeAprTabsContent
                  apyData={apyQuery.data}
                  chartData={apyChartQuery.data}
                  status={{
                    apyLoading: apyQuery.isLoading,
                    chartLoading: apyChartQuery.isLoading,
                    apyError: apyQuery.isError,
                    chartError: apyChartQuery.isError,
                  }}
                  headerRight={periodSelect}
                  period={period}
                />
              ) : null,
          },
        ]}
      />
    </div>
  );
});

export function PoolDetailInfoTabs({
  marketAddress,
  constrained = false,
  initialPoolDetailData,
  initialTvlChartData,
}: {
  marketAddress: string;
  constrained?: boolean;
  initialPoolDetailData?: PoolDetailQueryData;
  initialTvlChartData?: Awaited<ReturnType<typeof fetchPoolChartData>>;
}) {
  const isHydrated = useHydrated();
  const pathname = usePathname();
  const isActive = /\/pools(\/|$)/.test(pathname ?? '');
  const [tabValue, setTabValue] = useState<PoolDetailInfoTabType>(
    PoolDetailInfoTabType.TVL,
  );
  const [periodOpen, setPeriodOpen] = useState(false);

  const [period, setPeriod] = useState<APY_PERIOD>(APY_PERIOD['30D']);
  const tabsWrapRef = useRef<HTMLDivElement | null>(null);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const periodRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activePeriodEle, setActivePeriodEle] = useState<HTMLDivElement | null>(
    null,
  );
  const tvlUsd = usePoolTvlUsd(marketAddress, initialPoolDetailData);
  const tvlChartQuery = usePoolChartData({
    marketAddress,
    chartType: CHART_TYPE.tvl,
    period,
    enabled: isActive && tabValue === PoolDetailInfoTabType.TVL,
    initialData: period === APY_PERIOD['7D'] ? initialTvlChartData : undefined,
  });
  const apyChartQuery = usePoolChartData({
    marketAddress,
    chartType: CHART_TYPE.fee_apr,
    period,
    enabled: isActive && tabValue === PoolDetailInfoTabType.FEE_APR,
  });
  const apyQuery = usePoolApyData({
    marketAddress,
    period,
    enabled: isActive && tabValue === PoolDetailInfoTabType.FEE_APR,
  });
  const { t } = useLingui();
  const periodLabels = useMemo<PeriodLabels>(
    () => ({
      [APY_PERIOD['7D']]: t`7D`,
      [APY_PERIOD['30D']]: t`30D`,
      [APY_PERIOD['90D']]: t`90D`,
      [APY_PERIOD['180D']]: t`180D`,
      [APY_PERIOD['ALL TIME']]: t`All`,
    }),
    [t],
  );

  useEffect(() => {
    if (tabValue === PoolDetailInfoTabType.TVL) {
      preloadPoolFeeAprTab();
    }
  }, [tabValue]);

  useEffect(() => {
    if (!isHydrated) return;
    const updateActivePeriodEle = () => {
      setActivePeriodEle(periodRefs.current[period] || null);
    };
    updateActivePeriodEle();
    const rafId = requestAnimationFrame(updateActivePeriodEle);
    return () => cancelAnimationFrame(rafId);
  }, [period, tabValue, isHydrated]);

  const updateScrollShadow = useCallback(() => {
    const el = tabsWrapRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setShowBottomShadow(scrollTop < scrollHeight - clientHeight - 1);
  }, []);

  const handleTabValueChange = useCallback((value: string) => {
    setTabValue(value as PoolDetailInfoTabType);
  }, []);

  const handlePeriodChange = useCallback((value: APY_PERIOD) => {
    setPeriod(value);
  }, []);

  useEffect(() => {
    if (!constrained) {
      setShowBottomShadow(false);
      return;
    }
    updateScrollShadow();
    const el = tabsWrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => updateScrollShadow());
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    constrained,
    tabValue,
    period,
    tvlUsd,
    tvlChartQuery.data,
    apyQuery.data,
    apyChartQuery.data,
    updateScrollShadow,
  ]);

  const periodSelect = (
    <PeriodSelectDialog
      period={period}
      periodOpen={periodOpen}
      onPeriodOpenChange={setPeriodOpen}
      onPeriodChange={handlePeriodChange}
      titleLabel={t`Select Period`}
      periodLabels={periodLabels}
    />
  );

  const cardClassName = constrained
    ? 'relative p-3 min-h-0 flex flex-col overflow-hidden'
    : 'relative min-h-[264px] overflow-hidden p-3';
  const innerClassName = constrained ? 'min-h-0 flex-1' : undefined;

  if (!isHydrated) {
    return <PoolDetailInfoTabsSkeleton constrained={constrained} />;
  }

  return (
    <>
      <PoolDetailDesktopTabs
        tabValue={tabValue}
        onTabValueChange={handleTabValueChange}
        tvlUsd={tvlUsd}
        tvlChartQuery={tvlChartQuery}
        apyChartQuery={apyChartQuery}
        apyQuery={apyQuery}
        period={period}
        constrained={constrained}
        cardClassName={cardClassName}
        innerClassName={innerClassName}
        tabsWrapRef={tabsWrapRef}
        periodRefs={periodRefs}
        activePeriodEle={activePeriodEle}
        showBottomShadow={showBottomShadow}
        periodLabels={periodLabels}
        onPeriodChange={handlePeriodChange}
        onScrollShadowUpdate={updateScrollShadow}
      />

      {/* For Mobile */}
      <PoolDetailMobileTabs
        tabValue={tabValue}
        onTabValueChange={handleTabValueChange}
        tvlUsd={tvlUsd}
        tvlChartQuery={tvlChartQuery}
        apyChartQuery={apyChartQuery}
        apyQuery={apyQuery}
        period={period}
        periodSelect={periodSelect}
      />
    </>
  );
}
