'use client';

import dynamic from 'next/dynamic';
import { DashboardChartAreaLoadingShell } from '../DashboardLoadingShell';
import type {
  DashboardInitialChartData,
  DashboardOption,
} from './dashboardChart.types';

interface DashboardChartAreaProps {
  initialChartData?: DashboardInitialChartData;
  marketOptions?: DashboardOption[];
}

const DashboardChartsGrid = dynamic(
  () =>
    import('./DashboardChartsGrid.client').then(
      (module) => module.DashboardChartsGrid,
    ),
  {
    ssr: false,
    loading: DashboardChartAreaLoadingShell,
  },
);

export const DashboardChartArea = (props: DashboardChartAreaProps) => {
  return <DashboardChartsGrid {...props} />;
};
