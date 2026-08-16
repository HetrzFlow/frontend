import { msg } from '@lingui/core/macro';
import { IMAGES_MAP } from '@repo/common';
import { LinguiClientProvider } from '@repo/i18n/client';
import { DEFAULT_LOCALE } from '@repo/i18n/const';
import { getI18nInstance, initLingui } from '@repo/i18n/server';
import { getAllI18nInstances } from '@/lib/importLocales';

const allI18nInstances = await getAllI18nInstances();

export async function generateLocaleMetadata(locale = DEFAULT_LOCALE) {
  const i18n = getI18nInstance(locale, allI18nInstances);

  return {
    title: i18n._(
      msg`HertzFlow | World Leverage Engine. Built For You to Win.`,
    ),
    description: i18n._(
      msg`Trade & Earn on any asset with leverage - 100% self-custodial.`,
    ),
    icons: {
      icon: IMAGES_MAP.favicon.src,
    },
  };
}

export async function LocalizedProviders({
  children,
  locale = DEFAULT_LOCALE,
}: Readonly<{
  children: React.ReactNode;
  locale?: string;
}>) {
  const i18nInstance = initLingui(locale, allI18nInstances);

  return (
    <LinguiClientProvider
      initialLocale={locale}
      initialMessages={i18nInstance.messages}
    >
      {children}
    </LinguiClientProvider>
  );
}
