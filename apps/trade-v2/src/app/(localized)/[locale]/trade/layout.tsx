import { FC, ReactNode } from 'react';

import { GlobalStoreProvider } from '@/stores/trade/global';
import Main from './Main';

const RootLayout: FC<
  Readonly<{
    children: ReactNode;
    params: Promise<{ locale: string }>;
  }>
> = async ({ children }) => {
  return (
    <GlobalStoreProvider>
      <Main />
      <>{children}</>
    </GlobalStoreProvider>
  );
};

export default RootLayout;
