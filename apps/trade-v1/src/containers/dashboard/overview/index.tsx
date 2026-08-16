'use client';

import { FC } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';

const LayoutMd = dynamic(() => import('./md'));

const LayoutSm = dynamic(() => import('./sm'));

const DashboardOverview: FC = () => {
  const mediaSz = useMediaQuery();

  return (
    <>
      {(mediaSz === MEDIA_SIZES.LG || mediaSz === MEDIA_SIZES.MD) && (
        <LayoutMd />
      )}
      {mediaSz === MEDIA_SIZES.SM && <LayoutSm />}
    </>
  );
};
DashboardOverview.displayName = 'DashboardOverview';

export default DashboardOverview;
