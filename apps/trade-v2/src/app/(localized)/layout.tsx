import { type FC } from 'react';

import { DEFAULT_LOCALE } from '@repo/i18n/const';
import ChainClientProvider from '@/common/chainClient/ChainClientProvider';
import { generateViewport, RootDocument } from '../root-shell';
import '@/styles/globals.css';

export { generateViewport };

const LocalizedRootLayout: FC<
  Readonly<{
    children: React.ReactNode;
  }>
> = ({ children }) => {
  return (
    <RootDocument lang={DEFAULT_LOCALE}>
      <ChainClientProvider>{children}</ChainClientProvider>
    </RootDocument>
  );
};

export default LocalizedRootLayout;
