import { FC, ReactNode } from 'react';
import { AppLayout } from '@/common';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <AppLayout
      className="relative z-0 -mt-[58px] h-[100dvh] px-0 pb-0 max-md:-mt-[56px] max-md:h-[100dvh] md:mb-2"
      innerClassName="scrollbar-none max-w-[initial] w-full overflow-visible"
    >
      {children}
    </AppLayout>
  );
};

export default Layout;
