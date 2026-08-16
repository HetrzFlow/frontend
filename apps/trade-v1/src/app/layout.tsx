import { FC } from 'react';

import { cookies } from 'next/headers';
import { msg } from '@lingui/core/macro';

import { DEFAULT_LOCALE } from '@repo/i18n/const';
import { getI18nInstance, initLingui } from '@repo/i18n/server';
import { IMAGES_MAP } from '@/common/assets';
import Layout from '@/common/layout';
import { getAllI18nInstances } from '@/lib/importLocales';

import '@/styles/globals.css';

const LOCALE_COOKIE = 'Next-Locale';

const allI18nInstances = await getAllI18nInstances();

export async function generateMetadata() {
  const [requestCookies] = await Promise.all([cookies()]);

  const locale = requestCookies.get(LOCALE_COOKIE)?.value || DEFAULT_LOCALE;
  const i18n = getI18nInstance(locale, allI18nInstances);

  return {
    title: `${i18n._(msg`HertzFlow | The world leverage engine`)}`,
    description: `${i18n._(msg`Trade anything you want with a leverage from your wallet with confidence.`)}`,
    icons: {
      icon: IMAGES_MAP.favicon.src,
    },
  };
}

const RootLayout: FC<
  Readonly<{
    children: React.ReactNode;
  }>
> = async ({ children }) => {
  const [requestCookies] = await Promise.all([cookies()]);

  const locale = requestCookies.get(LOCALE_COOKIE)?.value || DEFAULT_LOCALE;

  const i18nInstance = initLingui(locale, allI18nInstances); // get a ready-made i18n instance for the given locale
  return (
    <Layout
      locale={locale}
      localeMessages={i18nInstance.messages}
      clientRoutes={['trade', 'swap', 'dashboard', 'hzlp']}
    >
      {children}
    </Layout>
  );
};

export default RootLayout;
