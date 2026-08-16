import React, { memo } from 'react';
import { SkeletonLayout } from '@repo/ui';

type Props = {
  title: string;
  value: string;
  changes: string;
  isLoading: boolean;
};

export const OverviewCard = memo(
  ({ title, value, changes, isLoading }: Props) => {
    const isPositive = changes.includes('+');
    return (
      <div className={`font-plex flex flex-col gap-3 text-center md:gap-2`}>
        <h3 className="text-t-270 text-xs/tight md:text-sm/tight">{title}</h3>
        <SkeletonLayout isLoading={isLoading} className="h-8 w-30">
          <div className="text-t-1100 text-2xl font-medium">{value}</div>
        </SkeletonLayout>
        <SkeletonLayout isLoading={isLoading} className="mx-auto h-4 w-20">
          <p
            className={`${isPositive ? 'text-changes-positive' : 'text-t-430'} text-sm md:text-base`}
          >
            {changes}
          </p>
        </SkeletonLayout>
      </div>
    );
  },
);
OverviewCard.displayName = 'OverviewCard';
