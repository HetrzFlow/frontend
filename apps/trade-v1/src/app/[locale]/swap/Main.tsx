'use client';

import { FC } from 'react';

import { Separator } from '@repo/ui';
import {
  SwapContent,
  useProtocolStoreData,
  useVaultData,
  FirstVisit,
} from '@/common';

const Main: FC = () => {
  // refresh protocolStore and vault data every 60s
  useProtocolStoreData(60000);
  useVaultData(60000);

  return (
    <>
      <main className="md:bg-secondary mt-0 h-[calc(100dvh-108px)] rounded-[20px] opacity-90 max-md:h-[calc(100dvh-56px)] md:mx-2 md:mb-4 md:pt-4">
        <Separator className="md:hidden" />
        <div className="mx-auto px-4 pt-4 md:max-w-[440px]">
          <SwapContent />
        </div>
      </main>
      <FirstVisit />
    </>
  );
};

export default Main;
