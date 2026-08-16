import { cookies, headers } from 'next/headers';
import { msg } from '@lingui/core/macro';
import { LinguiClientProvider } from '@repo/i18n/client';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { initLingui } from '@repo/i18n/server';
import { bornaSans, ibmPlexSans } from '@repo/ui';
import { IMAGES_MAP } from '@/common/assets';
import CommonNotFound from '@/common/containers/notFound';
import { getAllI18nInstances } from '@/lib/importLocales';

import '@/styles/globals.css';

const LOCALE_COOKIE = 'Next-Locale';

function getSupportedLocale(locale: string | undefined) {
  if (!locale) return undefined;
  const normalizedLocale = locale.toLowerCase();
  const language = normalizedLocale.split('-')[0];

  return SUPPORTED_LOCALES.find(
    (supportedLocale) =>
      supportedLocale.toLowerCase() === normalizedLocale ||
      supportedLocale.toLowerCase() === language,
  );
}

function getLocaleFromAcceptLanguage(acceptLanguage: string | null) {
  if (!acceptLanguage) return undefined;

  return acceptLanguage
    .split(',')
    .map((entry) => {
      const [locale = '', q = 'q=1'] = entry.trim().split(';');
      const quality = Number(q.replace('q=', ''));
      return {
        locale: getSupportedLocale(locale.trim()),
        quality: Number.isFinite(quality) ? quality : 1,
      };
    })
    .filter(
      (entry): entry is { locale: string; quality: number } => !!entry.locale,
    )
    .sort((a, b) => b.quality - a.quality)[0]?.locale;
}

async function getGlobalNotFoundLocale() {
  const [requestCookies, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);

  return (
    getSupportedLocale(requestCookies.get(LOCALE_COOKIE)?.value) ||
    getLocaleFromAcceptLanguage(requestHeaders.get('accept-language')) ||
    DEFAULT_LOCALE
  );
}

export default async function GlobalNotFound() {
  const locale = await getGlobalNotFoundLocale();
  const allI18nInstances = await getAllI18nInstances();
  const i18nInstance = initLingui(locale, allI18nInstances);
  const title = i18nInstance._(msg`Page Not Found | HertzFlow`);
  const description = i18nInstance._(
    msg`The page you are looking for cannot be found.`,
  );

  return (
    <html
      lang={locale}
      className={`${bornaSans.variable} ${ibmPlexSans.variable}`}
      style={{
        colorScheme: 'dark',
      }}
    >
      <head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href={IMAGES_MAP.favicon.src} />
      </head>
      <body className="bg-bg-1 tabular-nums antialiased">
        <LinguiClientProvider
          initialLocale={locale}
          initialMessages={i18nInstance.messages}
        >
          <CommonNotFound showHeader showFooter />
        </LinguiClientProvider>
      </body>
    </html>
  );
}
