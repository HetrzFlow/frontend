import { createContext, FC, ReactNode, useContext, useMemo } from 'react';

import { useSuiClientContext } from '@mysten/dapp-kit';
import { Network, SuinsClient } from '@mysten/suins';

export const SuinsClientContext = createContext<SuinsClient | null>(null);

export const SuinsClientProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { client, network } = useSuiClientContext();

  const suinsClient = useMemo(() => {
    return new SuinsClient({
      client,
      network: network as Network,
    });
  }, [client, network]);

  return (
    <SuinsClientContext.Provider value={suinsClient}>
      {children}
    </SuinsClientContext.Provider>
  );
};

export const useSuinsClient = () => {
  return useContext(SuinsClientContext) as SuinsClient;
};
