'use client';

import React from 'react';
import { useLingui } from '@lingui/react/macro';
import { dateFormat } from '@repo/lib/format';
import { SkeletonLayout } from '@repo/ui';
import { DashboardDatePickerContainer } from '@/containers/dashboard/datePicker';
import {
  CHECKPOINTS_SUFFIX,
  useDashboardTitleData,
} from '../useDashboardTitleData';

const DashboardTitleMd: React.FC = () => {
  const { t } = useLingui();
  const { checkpoint, checkpointDetail, isLoading, explorerHost } =
    useDashboardTitleData();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="mb-3 text-4xl leading-[32.4px] font-semibold">{t`Dashboard`}</h3>
        <div className="text-t-270 flex items-center gap-1 text-sm">
          {t`Checkpoint `}
          <SkeletonLayout isLoading={isLoading} className="h-[17px] w-18">
            <a
              className={`text-accent font-plex`}
              href={`${explorerHost}${CHECKPOINTS_SUFFIX}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {checkpoint}
            </a>
          </SkeletonLayout>
          (
          <SkeletonLayout isLoading={isLoading} className="h-[17px] w-24">
            {dateFormat(
              Number(checkpointDetail?.timestampMs ?? 0),
              'yyyy-MM-dd HH:mm:ss',
            )}
          </SkeletonLayout>
          )
        </div>
      </div>
      <div id="date-range-pick">
        <DashboardDatePickerContainer />
      </div>
    </div>
  );
};

export default DashboardTitleMd;
