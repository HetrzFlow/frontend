'use client';

import { FC, ReactNode } from 'react';

import { Messages } from '@lingui/core';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { LinguiClientProvider } from '@repo/i18n/client';
import { bornaSans, ibmPlexSans } from '@repo/ui';
import ChainClientProvider from '../chainClient/ChainClientProvider';
import Footer from '../containers/footer';
import Header from '../containers/header';
import { GlobalStoreProvider } from '../stores/globalStore';
import { ThemeProvider } from '../stores/themeStore';

interface LayoutProps {
  children: ReactNode;
  locale: string;
  localeMessages: Messages;
  clientRoutes?: string[];
}

const Layout: FC<LayoutProps> = ({
  locale,
  localeMessages,
  clientRoutes = [],
  children,
}) => {
  return (
    <html
      lang={locale}
      className={`${bornaSans.variable} ${ibmPlexSans.variable}`}
      suppressHydrationWarning
    >
      <body className="tabular-nums antialiased [&:has(.notFound-page)_.hiddenIn404]:hidden">
        <ChainClientProvider>
          <GlobalStoreProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme={'dark'}
              enableSystem
              enableColorScheme
            >
              <LinguiClientProvider
                initialLocale={locale}
                initialMessages={localeMessages}
              >
                <Header clientRoutes={clientRoutes}>{children}</Header>
                <Footer />
              </LinguiClientProvider>
            </ThemeProvider>
          </GlobalStoreProvider>
        </ChainClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
};

export default Layout;
