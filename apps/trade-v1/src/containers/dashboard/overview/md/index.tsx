'use client';

import React from 'react';
import { GradientBorder } from '@repo/ui';
import { OverviewCard } from '@/components/OverviewCard';
import { useDashboardOverviewData } from '../useDashboardOverviewData';

const DashboardOverviewMd: React.FC = () => {
  const { staticData, isLoading } = useDashboardOverviewData();

  return (
    <>
      <GradientBorder outerClassName="p-6 my-6">
        <div className="grid grid-cols-5 items-center gap-8 px-6">
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
      </GradientBorder>
    </>
  );
};

export default DashboardOverviewMd;
