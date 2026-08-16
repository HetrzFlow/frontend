'use client';

import { createContext, FC, ReactNode, useMemo } from 'react';

import { HertzFlowSDK, initHertzFlowSDK } from '@hertzflow/sdk';
import { useCurrentAccount, useSuiClientContext } from '@mysten/dapp-kit';

export const HzSdkContext = createContext<HertzFlowSDK | null>(null);

export const HzSdkProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { client, network } = useSuiClientContext();

  const currentAccount = useCurrentAccount();

  const hzSdk = useMemo(() => {
    return initHertzFlowSDK({
      network: network as 'testnet' | 'mainnet',
      suiClient: client,
    });
  }, [network, client]);

  hzSdk.senderAddress = currentAccount?.address || '';

  return (
    <HzSdkContext.Provider value={hzSdk}>{children}</HzSdkContext.Provider>
  );
};
