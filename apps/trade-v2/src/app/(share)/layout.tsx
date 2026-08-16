import { FC } from 'react';

import { DEFAULT_LOCALE } from '@repo/i18n/const';
import {
  generateRootMetadata,
  generateViewport,
  RootDocument,
} from '../root-shell';
import '@/styles/globals.css';

export { generateViewport };

export async function generateMetadata() {
  return generateRootMetadata(DEFAULT_LOCALE);
}

const ShareRootLayout: FC<
  Readonly<{
    children: React.ReactNode;
  }>
> = ({ children }) => {
  return <RootDocument lang={DEFAULT_LOCALE}>{children}</RootDocument>;
};

export default ShareRootLayout;
