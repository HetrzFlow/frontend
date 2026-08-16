import type { ReactNode } from 'react';
import { AppLayout } from '@/common';

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => (
  <AppLayout
    className="relative z-10 px-0 pb-0 md:mb-2"
    innerClassName="scrollbar-none max-w-[initial] w-full overflow-visible"
  >
    {children}
  </AppLayout>
);

export default Layout;
