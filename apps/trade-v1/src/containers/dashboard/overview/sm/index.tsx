'use client';

import React from 'react';
import { Separator } from '@repo/ui';
import { OverviewCard } from '@/components/OverviewCard';
import { useDashboardOverviewData } from '../useDashboardOverviewData';

const DashboardOverviewSm: React.FC = () => {
  const { staticData, isLoading } = useDashboardOverviewData();

  return (
    <>
      <Separator />
      <div className="grid grid-cols-2 items-center gap-8 px-6 py-4">
        {staticData.map((item, index) => (
          <div key={index} className="flex justify-center">
            <OverviewCard
              isLoading={isLoading}
              title={item.title}
              value={item.value}
              changes={item.changes}
            />
          </div>
        ))}
      </div>
      <Separator />
    </>
  );
};
export default DashboardOverviewSm;
