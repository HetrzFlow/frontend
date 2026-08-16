'use client';

import { FC, memo } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import { PoolDetailResData } from '@/common';
import { useHydrated } from '@/hooks/hzlp/useHydrated';
import { Props } from './types';

const LayoutMd = dynamic(() => import('./md'));
const LayoutSm = dynamic(() => import('./sm'));

const Allocation: FC<{
  poolDetail?: PoolDetailResData | undefined;
}> = ({ poolDetail }: Props) => {
  const hydrated = useHydrated();
  const mediaSz = useMediaQuery();

  if (!hydrated) return null;

  return (
    <>
      {(mediaSz === MEDIA_SIZES.LG || mediaSz === MEDIA_SIZES.MD) && (
        <LayoutMd poolDetail={poolDetail} />
      )}
      {mediaSz === MEDIA_SIZES.SM && <LayoutSm poolDetail={poolDetail} />}
    </>
  );
};

Allocation.displayName = 'Allocation';

export default memo(Allocation);
