'use client';

import { FC, memo } from 'react';

import dynamic from 'next/dynamic';

import { useMediaQuery, MEDIA_SIZES, Loading } from '@repo/ui';
import { FirstVisit, Swap, useProtocolStoreData, useVaultData } from '@/common';
import { useHydrated } from '@/hooks/useHydrated';

const LayoutLg = dynamic(() => import('@/layouts/trade/lg'));
const LayoutSm = dynamic(() => import('@/layouts/trade/sm'));

const Main: FC = () => {
  const hydrated = useHydrated();
  const mediaSz = useMediaQuery();

  // refresh protocolStore and vault data every 60s
  useProtocolStoreData(60000);
  useVaultData(60000);

  return (
    <>
      {!hydrated ? (
        <Loading className="md:bg-secondary mx-2 mt-0 mb-4 h-[calc(100dvh-108px)] w-auto rounded-[20px] bg-transparent pt-4 opacity-90 max-md:h-[calc(100dvh-56px)]" />
      ) : (
        <main className="md:bg-secondary mt-0 h-[calc(100dvh-108px)] rounded-[20px] opacity-90 max-md:h-[calc(100dvh-56px)] md:mx-2 md:mb-4 md:pt-4">
          {(mediaSz === MEDIA_SIZES.LG || mediaSz === MEDIA_SIZES.MD) && (
            <LayoutLg />
          )}
          {mediaSz === MEDIA_SIZES.SM && <LayoutSm />}
        </main>
      )}
      <FirstVisit />
      <Swap />
    </>
  );
};

export default memo(Main);
