'use client';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { DASHBOARD_CHART_DEFINITIONS } from './dashboardChart.data';
import { resolveDashboardLabel } from './dashboardChart.types';
import { DashboardChartCard } from './DashboardChartCard.client';
import type {
  DashboardChartId,
  DashboardInitialChartData,
  DashboardLabel,
  DashboardOption,
} from './dashboardChart.types';

const INITIAL_EAGER_CARD_COUNT = 4;
const EMPTY_MARKET_OPTIONS: DashboardOption[] = [];

interface DashboardChartSection {
  title: DashboardLabel;
  description: DashboardLabel;
  charts: Array<{
    id: DashboardChartId;
    chartClassName?: string;
    fullWidth?: boolean;
  }>;
}

const DASHBOARD_CHART_SECTIONS: DashboardChartSection[] = [
  {
    title: msg`Activity`,
    description: msg`Trading Volume & Open Positions`,
    charts: [
      { id: 'volume' },
      { id: 'totalTradingVolume' },
      { id: 'openInterest', fullWidth: true },
    ],
  },
  {
    title: msg`Funding Rate`,
    description: msg`Annualized rates across listed perpetuals`,
    charts: [{ id: 'annualFundingRate', fullWidth: true }],
  },
  {
    title: msg`Perps Trading`,
    description: msg`Trader outcomes and platform revenues`,
    charts: [
      { id: 'realizedPnl' },
      { id: 'lossRebate' },
      { id: 'liquidations' },
      { id: 'fees' },
    ],
  },
  {
    title: msg`Liquidity`,
    description: msg`Vault deposits & HzLP token prices`,
    charts: [{ id: 'totalValueLocked' }, { id: 'hzlpPrice' }],
  },
  {
    title: msg`Users`,
    description: msg`Activity and leaderboard`,
    charts: [
      { id: 'users', chartClassName: 'md:h-[338px]' },
      { id: 'topUsers' },
    ],
  },
];

const EAGER_CHART_IDS = new Set(
  DASHBOARD_CHART_SECTIONS.flatMap((section) => section.charts)
    .slice(0, INITIAL_EAGER_CARD_COUNT)
    .map((chart) => chart.id),
);

interface DashboardChartsGridProps {
  initialChartData?: DashboardInitialChartData;
  marketOptions?: DashboardOption[];
}

export const DashboardChartsGrid = ({
  initialChartData,
  marketOptions = EMPTY_MARKET_OPTIONS,
}: DashboardChartsGridProps) => {
  const { i18n } = useLingui();
  const definitionsById = new Map(
    DASHBOARD_CHART_DEFINITIONS.map((definition) => [
      definition.id,
      definition,
    ]),
  );

  return (
    <div className="flex flex-col gap-6">
      {DASHBOARD_CHART_SECTIONS.map((section) => {
        const sectionTitle = resolveDashboardLabel(section.title, i18n);
        return (
          <section key={sectionTitle}>
            <div className="mb-4 md:mb-3">
              <h2 className="text-t-1100 text-xl font-medium">
                {sectionTitle}
              </h2>
              <p className="text-t-270 mt-1 text-xs">
                {resolveDashboardLabel(section.description, i18n)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-2">
              {section.charts.map((chart) => {
                const definition = definitionsById.get(chart.id);
                if (!definition) return null;

                return (
                  <div
                    key={chart.id}
                    className={chart.fullWidth ? 'md:col-span-2' : undefined}
                  >
                    <DashboardChartCard
                      chartClassName={chart.chartClassName}
                      definition={definition}
                      eagerLoad={EAGER_CHART_IDS.has(chart.id)}
                      initialChartData={initialChartData?.[chart.id]}
                      marketOptions={marketOptions}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
