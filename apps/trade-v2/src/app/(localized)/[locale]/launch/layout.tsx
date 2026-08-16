import { FC, ReactNode } from 'react';
import { AppLayout } from '@/common';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <>
      <AppLayout
        className="px-0 md:pt-10 md:mx-2 md:mb-2 md:rounded-[20px]"
        innerClassName="scrollbar-none max-w-[initial] w-full max-h-full overflow-y-auto"
      >
        {children}
      </AppLayout>
    </>
  );
};

export default Layout;
