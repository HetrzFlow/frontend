import { FC, PropsWithChildren } from 'react';
import { TradingRouteShell } from '@/common';
import PoolsDataFeeds from '@/containers/pools/PoolsDataFeeds';

const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <PoolsDataFeeds />
      <TradingRouteShell
        className="mx-auto max-w-[1080px] overflow-x-hidden [&:has([data-detail-page-shell])]:max-w-none md:mb-2 md:h-[calc(100dvh-96px)]"
        scrollMode="none"
        rounded
        animateInner
        rpcTopAlertClassName="mx-auto mt-2 mb-0 max-w-[1080px] px-2 max-md:px-0 md:px-1"
      >
        {children}
      </TradingRouteShell>
    </>
  );
};

export default Layout;
