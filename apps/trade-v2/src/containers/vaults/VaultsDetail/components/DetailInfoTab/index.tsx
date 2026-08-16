'use client';

import {
  useState,
  useRef,
  useEffect,
  useDeferredValue,
  useCallback,
  useMemo,
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
  useResizeObserver,
} from '@repo/ui';
import { TradeTabs } from '@/common';
import { useHydrated } from '@/common/hooks/useHydrated';
import ModuleCard from '@/components/ModuleCard';
import { useVaultFeesChart, useVaultTvlChart } from '@/queries/bsc/vaults';
import type { VaultDetailQueryData } from '@/queries/bsc/vaults';
import { APY_PERIOD } from '@/services/rest/pools';
import type { fetchVaultTvlChartData } from '@/services/rest/vaults';
import { useVaultTvlUsd } from '@/stores/synthetics/marketsData/selectors';
import VaultDetailInfoTabSkeleton from './Skeleton';
import TvlTabsContent from './TvlTabsContent';

const FeeAprTabsContent = dynamic(() => import('./FeeAprTabsContent'), {
  loading: () => (
    <div className="space-y-3">
      <div className="bg-bg-3 h-[28.8px] w-28 rounded-xl" />
      <div className="bg-bg-3 h-[159px] w-full rounded-xl" />
    </div>
  ),
});

let hasPrefetchedVaultFeeAprTab = false;

const preloadVaultFeeAprTab = () => {
  if (hasPrefetchedVaultFeeAprTab) return;
  hasPrefetchedVaultFeeAprTab = true;
  void Promise.all([import('./FeeAprTabsContent')]);
};

enum TabType {
  TVL = 'TVL',
  FEE_APR = 'Fee APR',
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

type VaultInfoCardProps = {
  vaultAddress: string;
};

type VaultDetailInfoLeftProps = {
  tabValue: TabType;
  onTabChange: (value: TabType) => void;
  period: APY_PERIOD;
  onPeriodChange: (value: APY_PERIOD) => void;
  tvlUsd: ReturnType<typeof useVaultTvlUsd>;
  tvlChartData: ReturnType<typeof useVaultTvlChart>['data'];
  tvlChartLoading: boolean;
  tvlChartError: boolean;
  feesChartData: ReturnType<typeof useVaultFeesChart>['data'];
  feesChartLoading: boolean;
  feesChartError: boolean;
};

function VaultDetailInfoLeft({
  tabValue,
  onTabChange,
  period,
  onPeriodChange,
  tvlUsd,
  tvlChartData,
  tvlChartLoading,
  tvlChartError,
  feesChartData,
  feesChartLoading,
  feesChartError,
}: VaultDetailInfoLeftProps) {
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
  const isHydrated = useHydrated();
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activePeriodEle, setActivePeriodEle] = useState<HTMLDivElement | null>(
    null,
  );
  const [showXShadow, setShowXShadow] = useState<[boolean, boolean]>([
    false,
    false,
  ]);
  const deferredShowXShadow = useDeferredValue(showXShadow);
  const scrollDivRef = useResizeObserver<HTMLDivElement>((entry) => {
    const { scrollLeft, scrollWidth, clientWidth } = entry.target;
    setShowXShadow([
      scrollLeft > 1,
      scrollLeft < scrollWidth - clientWidth - 1,
    ]);
  });
  const handleScroll = useCallback(() => {
    if (!scrollDivRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollDivRef.current;
    setShowXShadow([
      scrollLeft > 1,
      scrollLeft < scrollWidth - clientWidth - 1,
    ]);
  }, [scrollDivRef]);

  useEffect(() => {
    if (!isHydrated) return;
    const updateActivePeriodEle = () => {
      setActivePeriodEle(periodRefs.current[period] || null);
    };
    updateActivePeriodEle();
    const rafId = requestAnimationFrame(updateActivePeriodEle);
    return () => cancelAnimationFrame(rafId);
  }, [period, tabValue, isHydrated]);

  const periodSelect = (
    <Dialog open={periodOpen} onOpenChange={setPeriodOpen} modal>
      <DialogTrigger className="bg-bg-2 text-t-1100 flex h-8 items-center gap-2 rounded-xl px-3 py-2 text-xs leading-normal font-medium">
        <span>{getPeriodLabel(period, periodLabels)}</span>
        <ChevronDownIcon
          className={cn(
            'text-t-1100 transition-transform duration-300',
            periodOpen ? '-rotate-180' : '',
          )}
          size={16}
        />
      </DialogTrigger>
      <DialogContent position="bottom">
        <DialogTitle>
          <Trans>Select Period</Trans>
        </DialogTitle>
        <DialogDescription className="sr-only">
          <Trans>Select Period</Trans>
        </DialogDescription>
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
                  setPeriodOpen(false);
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
  if (!isHydrated) {
    return <VaultDetailInfoTabSkeleton />;
  }

  return (
    <>
      <div className="hidden min-w-0 flex-1 md:block">
        <ModuleCard
          className={cn(
            'relative overflow-hidden p-3',
            'flex min-h-[264px] flex-1 flex-col',
          )}
        >
          <div
            ref={scrollDivRef}
            onScroll={handleScroll}
            className="scrollbar-none overflow-x-auto"
          >
            <div className="w-full">
              <TradeTabs
                value={tabValue}
                onValueChange={(value) => onTabChange(value as TabType)}
                disableAnimation
                listLayoutClassName="flex"
                listClassName="gap-1 justify-start"
                activeBarClassName="bg-bg-3 rounded-lg"
                labelClassName="h-auto flex-none grow-0 rounded-lg px-3 py-1.5 text-xs data-[state=active]:text-t-1100"
                contentWrapClassName={'mt-1 min-h-0 flex-1 flex flex-col gap-3'}
                options={[
                  {
                    value: TabType.TVL,
                    label: <Trans>TVL</Trans>,
                    content:
                      tabValue === TabType.TVL ? (
                        <TvlTabsContent
                          tvlUsd={tvlUsd}
                          chartData={tvlChartData}
                          isChartLoading={tvlChartLoading}
                          isChartError={tvlChartError}
                          period={period}
                        />
                      ) : null,
                  },
                  {
                    value: TabType.FEE_APR,
                    label: <Trans>Fee APR</Trans>,
                    onTriggerHover: preloadVaultFeeAprTab,
                    onTriggerFocus: preloadVaultFeeAprTab,
                    content:
                      tabValue === TabType.FEE_APR ? (
                        <FeeAprTabsContent
                          data={feesChartData}
                          isLoading={feesChartLoading}
                          isError={feesChartError}
                          period={period}
                        />
                      ) : null,
                  },
                ]}
                sideContent={
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
                          period === p
                            ? 'text-t-1100'
                            : 'text-t-270 hover:text-t-1100'
                        }`}
                      >
                        {getPeriodLabel(p, periodLabels)}
                      </div>
                    ))}
                    <PeriodActiveBar activeEle={activePeriodEle} />
                  </div>
                }
              />
            </div>
          </div>
          {deferredShowXShadow[0] && (
            <div className="from-bg-card-mix pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r to-transparent" />
          )}
          {deferredShowXShadow[1] && (
            <div className="to-bg-card-mix pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-r from-transparent" />
          )}
        </ModuleCard>
      </div>
      {isHydrated ? (
        <ModuleCard className="block rounded-2xl p-3 md:hidden">
          <TradeTabs
            value={tabValue}
            onValueChange={(value) => onTabChange(value as TabType)}
            disableAnimation
            listLayoutClassName="flex"
            listClassName="gap-1 justify-start"
            activeBarClassName="bg-bg-3 rounded-lg"
            labelClassName="h-auto flex-none grow-0 rounded-lg px-3 py-1.5 text-xs data-[state=active]:text-t-1100"
            contentWrapClassName={cn(
              'mt-3 flex-1 flex flex-col gap-3 overflow-hidden',
            )}
            options={[
              {
                value: TabType.TVL,
                label: <Trans>TVL</Trans>,
                content:
                  tabValue === TabType.TVL ? (
                    <TvlTabsContent
                      tvlUsd={tvlUsd}
                      chartData={tvlChartData}
                      isChartLoading={tvlChartLoading}
                      isChartError={tvlChartError}
                      headerRight={periodSelect}
                      period={period}
                    />
                  ) : null,
              },
              {
                value: TabType.FEE_APR,
                label: <Trans>Fee APR</Trans>,
                onTriggerHover: preloadVaultFeeAprTab,
                onTriggerFocus: preloadVaultFeeAprTab,
                content:
                  tabValue === TabType.FEE_APR ? (
                    <FeeAprTabsContent
                      data={feesChartData}
                      isLoading={feesChartLoading}
                      isError={feesChartError}
                      headerRight={periodSelect}
                      period={period}
                    />
                  ) : null,
              },
            ]}
          />
        </ModuleCard>
      ) : null}
    </>
  );
}

function useVaultDetailInfoState(
  vaultAddress: string,
  initialVaultDetailData?: VaultDetailQueryData,
  initialTvlChartData?: Awaited<
    ReturnType<typeof fetchVaultTvlChartData>
  >['data'],
) {
  const pathname = usePathname();
  const isActive = /\/vaults(\/|$)/.test(pathname ?? '');
  const [tabValue, setTabValue] = useState(TabType.TVL);
  const [period, setPeriod] = useState<APY_PERIOD>(APY_PERIOD['30D']);
  const tvlUsd = useVaultTvlUsd(vaultAddress, {
    initialData: initialVaultDetailData,
  });
  const tvlChartQuery = useVaultTvlChart({
    vaultAddress,
    period,
    enabled: isActive && tabValue === TabType.TVL,
    initialData: period === APY_PERIOD['7D'] ? initialTvlChartData : undefined,
  });
  const feesChartQuery = useVaultFeesChart({
    vaultAddress,
    period,
    enabled: isActive && tabValue === TabType.FEE_APR,
  });

  useEffect(() => {
    if (tabValue === TabType.TVL) {
      preloadVaultFeeAprTab();
      return;
    }

    if (tabValue === TabType.FEE_APR) {
      return;
    }
  }, [tabValue]);

  return {
    tabValue,
    setTabValue,
    period,
    setPeriod,
    tvlUsd,
    tvlChartQuery,
    feesChartQuery,
  };
}

type VaultDetailInfoTabProps = VaultInfoCardProps & {
  initialVaultDetailData?: VaultDetailQueryData;
  initialTvlChartData?: Awaited<
    ReturnType<typeof fetchVaultTvlChartData>
  >['data'];
};

export function VaultDetailInfoTab({
  vaultAddress,
  initialVaultDetailData,
  initialTvlChartData,
}: VaultDetailInfoTabProps) {
  const {
    tabValue,
    setTabValue,
    period,
    setPeriod,
    tvlUsd,
    tvlChartQuery,
    feesChartQuery,
  } = useVaultDetailInfoState(
    vaultAddress,
    initialVaultDetailData,
    initialTvlChartData,
  );

  return (
    <div>
      <VaultDetailInfoLeft
        tabValue={tabValue}
        onTabChange={setTabValue}
        period={period}
        onPeriodChange={setPeriod}
        tvlUsd={tvlUsd}
        tvlChartData={tvlChartQuery.data}
        tvlChartLoading={tvlChartQuery.isLoading}
        tvlChartError={tvlChartQuery.isError}
        feesChartData={feesChartQuery.data}
        feesChartLoading={feesChartQuery.isLoading}
        feesChartError={feesChartQuery.isError}
      />
    </div>
  );
}
