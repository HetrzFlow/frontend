'use client';

import { FC, ReactNode } from 'react';

import { Messages } from '@lingui/core';

import { LinguiClientProvider } from '@repo/i18n/client';
import { SwapWidget } from '@/components/Swap';
import { ENABLE_SWAP } from '@/constants/common';
import Footer from '../containers/footer';
import Header from '../containers/header';
import DocumentLocaleSync from './DocumentLocaleSync.client';

interface LayoutProps {
  children: ReactNode;
  locale: string;
  localeMessages: Messages;
  genesisStandalone?: boolean;
}

const Layout: FC<LayoutProps> = ({
  locale,
  localeMessages,
  genesisStandalone = false,
  children,
}) => {
  return (
    <LinguiClientProvider
      initialLocale={locale}
      initialMessages={localeMessages}
    >
      <DocumentLocaleSync locale={locale} />
      <Header genesisStandalone={genesisStandalone}>{children}</Header>
      {ENABLE_SWAP ? <SwapWidget /> : null}
      <Footer />
    </LinguiClientProvider>
  );
};

export default Layout;
