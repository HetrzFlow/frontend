'use client';

import { FC, ReactNode, useEffect, useRef } from 'react';
import { ScrollBox, useMediaQuery, MEDIA_SIZES, Loading } from '@repo/ui';
import { FirstVisit, Swap, useProtocolStoreData, useVaultData } from '@/common';
import HzlpTrader from '@/containers/hzlp/trade';
import { useHydrated } from '@/hooks/hzlp/useHydrated';
import { useLayoutStore } from '@/stores/hzlp/layout';

const REFETCH_INTERVAL = 60000;

interface HzlpLayoutProps {
  children: ReactNode;
}

const HzlpLayout: FC<HzlpLayoutProps> = ({ children }) => {
  const hydrated = useHydrated();
  const mediaSz = useMediaQuery();
  const setRightBoxRef = useLayoutStore((state) => state.setRightBoxRef);
  const rightBoxRef = useRef<HTMLDivElement | null>(null);
  const isSmallScreen = mediaSz === MEDIA_SIZES.SM;

  useProtocolStoreData(REFETCH_INTERVAL);
  useVaultData(REFETCH_INTERVAL);

  useEffect(() => {
    if (!isSmallScreen) {
      setRightBoxRef(rightBoxRef);
    }
    return () => {
      setRightBoxRef(null);
    };
  }, [setRightBoxRef, isSmallScreen]);

  if (!hydrated) {
    return (
      <Loading className="md:bg-secondary mx-2 mt-0 mb-4 h-[calc(100dvh-108px)] w-auto rounded-[20px] p-10 pb-0 opacity-90 max-md:mx-0 max-md:p-4" />
    );
  }

  if (isSmallScreen) {
    return (
      <>
        <main className="md:bg-secondary h-[calc(100dvh-108px)] rounded-[20px] py-4 opacity-90 max-md:w-full">
          <div className="border-border h-full border-t">
            <ScrollBox className="h-[calc(100dvh-205px)]">{children}</ScrollBox>
            <HzlpTrader />
          </div>
        </main>
        <FirstVisit />
        <Swap />
      </>
    );
  }

  return (
    <>
      <main className="md:bg-secondary mx-2 mt-0 mb-4 h-[calc(100dvh-108px)] rounded-[20px] p-10 pb-0 opacity-90">
        <div className="mx-auto grid h-full max-w-[1400px] grid-cols-[minmax(0,1fr)_412px] grid-rows-1">
          <ScrollBox scrollClassName="flex h-full flex-col gap-6 pb-10">
            {children}
          </ScrollBox>
          <ScrollBox
            ref={rightBoxRef}
            scrollClassName="h-full w-[412px] pl-6 pb-10"
            shadowClassName="ml-6"
          >
            <HzlpTrader />
          </ScrollBox>
        </div>
      </main>
      <FirstVisit />
      <Swap />
    </>
  );
};

export default HzlpLayout;
