import { FC, ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { LinguiClientProvider } from '@repo/i18n/client';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { initLingui } from '@repo/i18n/server';
import { getAllI18nInstances } from '@/lib/importLocales';
import type { Messages } from '@lingui/core';

export const dynamicParams = false;

const RootLayout: FC<
  Readonly<{
    params: Promise<{ locale: string }>;
    children: ReactNode;
  }>
> = async ({ children, params }) => {
  const { locale } = await params;

  if (!linguiConfig.locales.includes(locale)) {
    notFound();
  }

  const allI18nInstances = await getAllI18nInstances();
  const i18nInstance = initLingui(locale, allI18nInstances);

  return (
    <LinguiClientProvider
      initialLocale={locale}
      initialMessages={i18nInstance.messages as Messages}
    >
      {children}
    </LinguiClientProvider>
  );
};

export default RootLayout;
