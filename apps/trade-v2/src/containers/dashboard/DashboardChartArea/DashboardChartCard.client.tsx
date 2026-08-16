'use client';

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  cn,
  InfoCircleIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import ModuleCard from '@/components/ModuleCard';
import {
  getDashboardInitialDataKey,
  resolveDashboardCardState,
  resolveDashboardChartDefinition,
  useDashboardChartData,
} from './dashboardChart.data';
import {
  DASHBOARD_CHART_LOADING_CLASS_NAME,
  DASHBOARD_CHART_STRETCH_TO_CARD_HEIGHT,
} from './dashboardChart.layout';
import { resolveDashboardLabel } from './dashboardChart.types';
import { DashboardChartToolbar } from './DashboardChartToolbar.client';
import { DashboardTableToolbar } from './DashboardTableToolbar.client';
import type {
  DashboardCardState,
  DashboardChartDefinition,
  DashboardInitialChartData,
  DashboardOption,
  DashboardPresenterModel,
} from './dashboardChart.types';

const cardClassName = 'bg-card p-2 max-md:bg-card max-md:p-2';

const titleClassName = 'text-t-1100 text-base font-medium';

const tableLoadingBlockClassName =
  'bg-bg-3 h-[370px] animate-pulse rounded-2xl';
const INFO_ICON_SIZE = 14;

const DashboardChartRenderer = dynamic(
  () =>
    import('./DashboardChartPresenters.client').then(
      (module) => module.DashboardChartRenderer,
    ),
  {
    ssr: false,
    loading: () => <div className={DASHBOARD_CHART_LOADING_CLASS_NAME} />,
  },
) as ComponentType<{
  model: DashboardPresenterModel;
  chartClassName?: string;
  tooltipTitle: string;
}>;

const CHART_TITLE_TOOLTIPS: Partial<
  Record<DashboardChartDefinition['id'], ReactNode>
> = {
  annualFundingRate: (
    <>
      <div className="text-t-1100 text-xs font-medium">
        <Trans>How funding works</Trans>
      </div>
      <div className="text-t-270 text-xs">
        <Trans>
          The rate shown is paid by the larger-OI side. The opposite side earns
          at a scaled rate, so total paid equals total received.
        </Trans>
      </div>
      <ul className="text-t-270 list-disc pl-[18px] text-xs">
        <li>
          <span className="text-t-1100 font-medium">
            <Trans>PAYING: </Trans>
          </span>
          <Trans>Larger-OI side. Pays the rate.</Trans>
        </li>
        <li>
          <span className="text-t-1100 font-medium">
            <Trans>RECEIVING: </Trans>
          </span>
          <Trans>Opposite side. Earns at the scaled rate.</Trans>
        </li>
        <li>
          <span className="text-t-1100 font-medium">
            <Trans>ANNUALIZED: </Trans>
          </span>
          <Trans>Per-second contract rate on a 365-day basis.</Trans>
        </li>
        <li>
          <span className="text-t-1100 font-medium">
            <Trans>SIGN: </Trans>
          </span>
          <Trans>
            Positive = longs pay shorts. Negative = shorts pay longs.
          </Trans>
        </li>
      </ul>
    </>
  ),
  lossRebate: (
    <>
      <div className="text-t-1100 text-xs font-medium">
        <Trans>Loss Rebate</Trans>
      </div>
      <div className="text-t-270 text-xs">
        <Trans>
          Loss Rebate compensates traders who open on the smaller open interest
          side and close at a loss, as long as the trade helps rebalance open
          interest. It rewards market balancing and does not apply to ZFP
          positions.
        </Trans>
      </div>
    </>
  ),
  hzlpPrice: (
    <>
      <div className="text-t-1100 text-xs font-medium">
        <Trans>HZLP price</Trans>
      </div>
      <div className="text-t-270 text-xs">
        <Trans>
          HzLP Price is the value of one LP token in an isolated pool, equal to
          the pool&apos;s total value divided by LP supply. A rising price means
          LPs are in profit. A falling price means a loss.
        </Trans>
      </div>
    </>
  ),
};

function getLegendColors(model: DashboardPresenterModel | null) {
  if (!model || model.kind === 'table') return undefined;
  const series =
    model.kind === 'composed'
      ? model.series
      : model.kind === 'multiline'
        ? model.lines
        : [model.area];
  return Object.fromEntries(series.map((item) => [item.key, item.color]));
}

interface DashboardChartCardProps {
  chartClassName?: string;
  definition: DashboardChartDefinition;
  eagerLoad?: boolean;
  initialChartData?: NonNullable<
    DashboardInitialChartData[DashboardChartDefinition['id']]
  >;
  marketOptions?: DashboardOption[];
}

export const DashboardChartCard = memo(
  ({
    chartClassName,
    definition,
    eagerLoad = false,
    initialChartData,
    marketOptions = [],
  }: DashboardChartCardProps) => {
    const { t, i18n } = useLingui();
    const cardRef = useRef<HTMLDivElement>(null);
    const [tooltipBoundary, setTooltipBoundary] =
      useState<HTMLDivElement | null>(null);
    const [isNearViewport, setIsNearViewport] = useState(eagerLoad);
    const setCardRef = useCallback((node: HTMLDivElement | null) => {
      cardRef.current = node;
      setTooltipBoundary(node);
    }, []);
    const resolvedDefinition = useMemo(
      () => resolveDashboardChartDefinition(definition, marketOptions),
      [definition, marketOptions],
    );
    const initialState = useMemo(
      () => resolvedDefinition.getInitialState(),
      [resolvedDefinition],
    );
    const [state, setState] = useState<DashboardCardState>(initialState);
    const deferredState = useDeferredValue(state);
    const legendColorsRef = useRef<Record<string, string> | undefined>(
      undefined,
    );
    const chipOrderRef = useRef<string[] | undefined>(undefined);

    useEffect(() => {
      setState((currentState) =>
        resolveDashboardCardState(resolvedDefinition, currentState),
      );
    }, [resolvedDefinition]);

    useEffect(() => {
      if (isNearViewport) return;

      const target = cardRef.current;
      if (!target || typeof IntersectionObserver === 'undefined') {
        setIsNearViewport(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setIsNearViewport(true);
            observer.disconnect();
          }
        },
        { rootMargin: '160px 0px', threshold: 0 },
      );

      observer.observe(target);
      return () => observer.disconnect();
    }, [isNearViewport]);

    const initialQueryData =
      initialChartData?.stateKey === getDashboardInitialDataKey(deferredState)
        ? initialChartData.data
        : undefined;

    const query = useDashboardChartData(
      resolvedDefinition,
      deferredState,
      isNearViewport,
      initialQueryData as Parameters<typeof useDashboardChartData>[3],
    );
    const legendColors = getLegendColors(query.model);
    if (legendColors) {
      legendColorsRef.current = legendColors;
    }
    if (query.chipOrder) {
      chipOrderRef.current = query.chipOrder;
    }
    const isTable = resolvedDefinition.controls.kind === 'table';
    const showChartSkeleton =
      !isNearViewport ||
      query.isError ||
      query.model === null ||
      query.isPending ||
      query.isPlaceholderData;
    const chartTitle = resolveDashboardLabel(resolvedDefinition.title, i18n);
    const titleTooltip = CHART_TITLE_TOOLTIPS[resolvedDefinition.id];
    const renderTitle = (className: string) => (
      <div className={cn('items-center gap-2', className)}>
        <h3 className={titleClassName}>{chartTitle}</h3>
        {titleTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 items-center"
                aria-label={t`${chartTitle} info`}
              >
                <InfoCircleIcon
                  size={INFO_ICON_SIZE}
                  className="text-t-350 hover:text-t-1100"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="center"
              sideOffset={4}
              collisionBoundary={
                tooltipBoundary ? [tooltipBoundary] : undefined
              }
              collisionPadding={{ top: -500, bottom: -500 }}
              className="bg-bg-4 flex w-[420px] max-w-[calc(100vw-32px)] flex-col gap-2 rounded-xl p-2"
            >
              {titleTooltip}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    );

    return (
      <div
        ref={setCardRef}
        className={cn('flex h-full flex-col', resolvedDefinition.className)}
      >
        <ModuleCard className={cn(cardClassName, 'flex h-full flex-col')}>
          {renderTitle('mb-2 flex p-1')}
          <div
            className={cn(
              !isTable &&
                !DASHBOARD_CHART_STRETCH_TO_CARD_HEIGHT &&
                'flex flex-1 flex-col',
            )}
          >
            {resolvedDefinition.controls.kind === 'chart' ? (
              <DashboardChartToolbar
                config={resolvedDefinition.controls.filter}
                state={state as never}
                onChange={(nextState) => setState(nextState)}
                onReset={() => setState(resolvedDefinition.getInitialState())}
                chipOrder={query.chipOrder ?? chipOrderRef.current}
                legendColors={legendColors ?? legendColorsRef.current}
              />
            ) : (
              <DashboardTableToolbar
                config={resolvedDefinition.controls.sort}
                state={state as never}
                onChange={(nextState) => setState(nextState)}
                onReset={() => setState(resolvedDefinition.getInitialState())}
              />
            )}
          </div>

          <div
            className={cn(
              'flex flex-col',
              (isTable || DASHBOARD_CHART_STRETCH_TO_CARD_HEIGHT) && 'flex-1',
              isTable ? 'max-md:mt-[7px]' : 'max-md:mt-2',
            )}
          >
            {showChartSkeleton ? (
              <div
                className={
                  isTable
                    ? tableLoadingBlockClassName
                    : cn(DASHBOARD_CHART_LOADING_CLASS_NAME, chartClassName)
                }
              />
            ) : (
              <DashboardChartRenderer
                model={query.model!}
                chartClassName={chartClassName}
                tooltipTitle={
                  resolvedDefinition.id === 'volume'
                    ? t`Platform Volume`
                    : chartTitle
                }
              />
            )}
          </div>
        </ModuleCard>
      </div>
    );
  },
);

DashboardChartCard.displayName = 'DashboardChartCard';
