'use client';

import { FC, memo } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import { useHydrated } from '@/hooks/hzlp/useHydrated';
import { Props } from './types';

const LayoutMd = dynamic(() => import('./md'));
const LayoutSm = dynamic(() => import('./sm'));

const DetailPoolComposition: FC<Props> = ({ poolName, poolDetail }: Props) => {
  const hydrated = useHydrated();
  const mediaSz = useMediaQuery();

  if (!hydrated) return null;

  return (
    <>
      {(mediaSz === MEDIA_SIZES.LG || mediaSz === MEDIA_SIZES.MD) && (
        <LayoutMd poolName={poolName} poolDetail={poolDetail} />
      )}
      {mediaSz === MEDIA_SIZES.SM && (
        <LayoutSm poolName={poolName} poolDetail={poolDetail} />
      )}
    </>
  );
};

DetailPoolComposition.displayName = 'DetailPoolComposition';

export default memo(DetailPoolComposition);
