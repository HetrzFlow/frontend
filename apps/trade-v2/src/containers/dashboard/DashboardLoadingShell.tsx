'use client';

import { Trans } from '@lingui/react/macro';
import BlockBadgeLoadingShell from './DashboardHeader/BlockBadgeLoadingShell';

const OVERVIEW_ITEM_COUNT = 5;
const dashboardOverviewSkeletonClassName = 'bg-bg-3 animate-pulse rounded-md';
const dashboardChartSections = [
  { titleWidth: 'w-20', descriptionWidth: 'w-44', cards: 3 },
  { titleWidth: 'w-32', descriptionWidth: 'w-52', cards: 1 },
  { titleWidth: 'w-56', descriptionWidth: 'w-64', cards: 4 },
  { titleWidth: 'w-24', descriptionWidth: 'w-48', cards: 2 },
  { titleWidth: 'w-16', descriptionWidth: 'w-40', cards: 2 },
] as const;

const DashboardHeaderLoadingShell = () => (
  <div className="flex flex-col items-start gap-2 pt-[18px] pb-5 text-left md:items-center md:gap-3 md:pt-0 md:pb-0 md:text-center">
    <h3 className="text-2xl font-medium md:text-[32px]/tight">
      <Trans>Dashboard</Trans>
    </h3>
    <BlockBadgeLoadingShell />
  </div>
);

export const DashboardOverviewLoadingShell = () => (
  <div className="mb-4 grid grid-cols-2 gap-2 md:mb-6 md:grid-cols-5 md:py-3">
    {Array.from({ length: OVERVIEW_ITEM_COUNT }).map((_, index) => (
      <div key={index} className="contents">
        <div className="border-border bg-card/40 relative flex h-[77px] items-center gap-2 rounded-xl border p-2 text-left">
          <div className="flex w-25 min-w-0 flex-col items-start gap-2 whitespace-nowrap max-md:flex-1">
            <div
              className={`${dashboardOverviewSkeletonClassName} h-[14px] w-[100px]`}
            />
            <div
              className={`${dashboardOverviewSkeletonClassName} h-[24px] w-[90px] md:h-[17px] md:w-[72px]`}
            />
            <div
              className={`${dashboardOverviewSkeletonClassName} h-[17px] w-[70px] md:h-[14px] md:w-[64px]`}
            />
          </div>
          <div className="absolute top-6 right-2 md:!static md:flex md:min-w-0 md:flex-1 md:items-center md:self-stretch">
            <div className={`${dashboardOverviewSkeletonClassName} h-10 w-15 md:h-full md:w-full`} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const DashboardChartCardLoadingShell = () => (
  <div className="flex h-full flex-col">
    <div className="bg-card rounded-2xl p-2 max-md:bg-transparent max-md:p-0">
      <div className="mb-2 flex px-1">
        <div className="bg-bg-3 h-[24px] w-36 animate-pulse rounded-md" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-full flex-col gap-2 p-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-bg-3 h-6 w-36 animate-pulse rounded-lg" />
            <div className="bg-bg-3 ml-auto size-6 animate-pulse rounded-xl" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="bg-bg-3 h-6 w-64 max-w-full animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
      <div className="max-md:mt-2">
        <div className="bg-bg-3 h-[196px] animate-pulse rounded-2xl md:h-[280px]" />
      </div>
    </div>
  </div>
);

export const DashboardChartAreaLoadingShell = () => (
  <div className="flex flex-col gap-6">
    {dashboardChartSections.map((section, sectionIndex) => (
      <section key={sectionIndex}>
        <div className="mb-4 md:mb-3">
          <div
            className={`bg-bg-3 h-[28px] ${section.titleWidth} animate-pulse rounded-md`}
          />
          <div
            className={`bg-bg-3 mt-1 h-[14px] ${section.descriptionWidth} animate-pulse rounded-md`}
          />
        </div>
        <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-2">
          {Array.from({ length: section.cards }).map((_, cardIndex) => (
            <div
              key={cardIndex}
              className={
                section.cards === 1 || (sectionIndex === 0 && cardIndex === 2)
                  ? 'md:col-span-2'
                  : undefined
              }
            >
              <DashboardChartCardLoadingShell />
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
);

export const DashboardContentLoadingShell = () => (
  <>
    <DashboardOverviewLoadingShell />
    <DashboardChartAreaLoadingShell />
  </>
);

const DashboardPageLoadingShell = () => (
  <div className="dashboard-page px-4 pt-14 pb-[calc(120px+env(safe-area-inset-bottom))] md:px-0 md:pt-24 md:pb-20">
    <DashboardHeaderLoadingShell />
    <DashboardContentLoadingShell />
  </div>
);

export default DashboardPageLoadingShell;
