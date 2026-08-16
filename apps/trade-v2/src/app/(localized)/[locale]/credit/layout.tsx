import '@/styles/dashboard.css';

import { FC, ReactNode } from 'react';

import TradingRouteShell from '@/common/components/TradingRouteShell';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <TradingRouteShell
      className="w-full md:mb-2 md:pb-4"
      contentClassName="mx-auto w-full max-w-[1080px]"
      animateInner
      rpcTopAlertClassName="mt-2"
    >
      {children}
    </TradingRouteShell>
  );
};

export default Layout;
