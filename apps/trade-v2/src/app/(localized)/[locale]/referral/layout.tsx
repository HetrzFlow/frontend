import '@/styles/dashboard.css';
import { FC, ReactNode } from 'react';
import Image from 'next/image';
import TradingRouteShell from '@/common/components/TradingRouteShell';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <>
      <div
        aria-hidden
        className="bg-bg-1 pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[871px]">
          <Image
            src="/trade-static/common/light-rays-effect.png"
            alt=""
            fill
            preload
            fetchPriority="high"
            sizes="100vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 h-[180px] bg-[linear-gradient(180deg,transparent_0%,var(--bg-1)_100%)]" />
        </div>
      </div>
      <TradingRouteShell
        className="bg-transparent! px-4 md:mx-2 md:mb-2 md:rounded-[20px] md:px-2 md:pb-4"
        rpcTopAlertClassName="mt-2 md:max-w-[1080px]"
      >
        {children}
      </TradingRouteShell>
    </>
  );
};

export default Layout;
