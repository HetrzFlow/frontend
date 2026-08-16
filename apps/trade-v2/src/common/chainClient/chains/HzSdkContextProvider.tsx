'use client';

import { memo, PropsWithChildren } from 'react';
import { GlobalStoreProvider } from '@/common/stores/globalStore';
import { HzSdkProvider } from '../HzSdkProvider';

const HzSdkContextProvider = ({ children }: PropsWithChildren) => {
  return (
    <HzSdkProvider>
      <GlobalStoreProvider>{children}</GlobalStoreProvider>
    </HzSdkProvider>
  );
};

export default memo(HzSdkContextProvider);
