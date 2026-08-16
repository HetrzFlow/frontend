'use client';

import { FC, useEffect } from 'react';
import { Loading } from '@repo/ui';
import { useGlobalStore } from '@/common';
import DashboardChartArea from '@/containers/dashboard/chartArea';
import DashboardOverview from '@/containers/dashboard/overview';
import DashboardTitle from '@/containers/dashboard/title';
import { useHydrated } from '@/hooks/useHydrated';

const Main: FC = () => {
  const hydrated = useHydrated();

  const setGlobalStoreState = useGlobalStore((state) => state.setStoreState);

  useEffect(() => {
    setGlobalStoreState({
      activeNavItem: 'dashboard',
      navInternalLinks: ['dashboard'],
    });
  }, [setGlobalStoreState]);

  return !hydrated ? (
    <Loading className="md:bg-secondary mx-2 mt-0 mb-4 min-h-[calc(100dvh-108px)] w-auto rounded-[20px] p-10 pb-0 opacity-90" />
  ) : (
    <main className="dashboard-page md:bg-secondary min-h-[calc(100dvh-108px)] overflow-y-auto opacity-90 md:mb-4">
      <div className="mb:mb-4 p-4 md:mx-2 md:mt-0 md:rounded-[20px] md:p-10 md:pb-0">
        <DashboardTitle />
        <DashboardOverview />
        <DashboardChartArea />
      </div>
    </main>
  );
};

export default Main;
