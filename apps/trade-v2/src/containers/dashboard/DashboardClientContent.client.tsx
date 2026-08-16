'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { CREDIT_MARKET_CATEGORY } from '@/common/constants';
import { useRafReady } from '@/common/hooks/useRafReady';
import { useInstStore } from '@/common/stores';
import {
  DashboardChartAreaLoadingShell,
  DashboardContentLoadingShell,
  DashboardOverviewLoadingShell,
} from './DashboardLoadingShell';
import type {
  DashboardInitialChartData,
  DashboardOption,
} from './DashboardChartArea/dashboardChart.types';

interface DashboardClientContentProps {
  initialChartData?: DashboardInitialChartData;
}

const DashboardOverview = dynamic(
  () =>
    import('./DashboardHeader/DashboardOverview.client').then(
      (module) => module.DashboardOverview,
    ),
  {
    loading: DashboardOverviewLoadingShell,
  },
);

const DashboardChartArea = dynamic(
  () =>
    import('./DashboardChartArea').then((module) => module.DashboardChartArea),
  {
    loading: DashboardChartAreaLoadingShell,
  },
);

const DashboardClientContent = ({
  initialChartData,
}: DashboardClientContentProps) => {
  const canMountDashboard = useRafReady();
  const insts = useInstStore((state) => state.getViewInstsArr());
  const marketOptions = useMemo<DashboardOption[]>(() => {
    const seen = new Set<string>();

    return insts
      .filter(
        (inst) =>
          inst.category !== CREDIT_MARKET_CATEGORY &&
          Boolean(inst.symbol) &&
          !seen.has(inst.symbol),
      )
      .map((inst) => {
        seen.add(inst.symbol);
        return {
          value: inst.symbol,
          label: inst.name || inst.symbol,
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [insts]);

  if (!canMountDashboard) {
    return <DashboardContentLoadingShell />;
  }

  return (
    <>
      <DashboardOverview />
      <DashboardChartArea
        initialChartData={initialChartData}
        marketOptions={marketOptions}
      />
    </>
  );
};

export default DashboardClientContent;
