import { FC, ReactNode } from 'react';
import { TradingRouteShell } from '@/common';
import VaultsMarketTokensFeed from '@/containers/vaults/VaultsMarketTokensFeed';
import VaultsNoiseBackground from '@/containers/vaults/VaultsNoiseBackground';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <>
      <VaultsNoiseBackground />
      <VaultsMarketTokensFeed />
      <TradingRouteShell
        className="relative z-10 mx-auto max-w-[1080px] overflow-x-hidden bg-transparent! md:mb-2 md:pb-4 [&:has([data-detail-page-shell])]:max-w-none"
        animateInner
        rpcTopAlertClassName="mx-auto mt-2 max-w-[1080px] px-2 max-md:px-0"
      >
        {children}
      </TradingRouteShell>
    </>
  );
};

export default Layout;
