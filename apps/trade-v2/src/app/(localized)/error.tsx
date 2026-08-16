'use client';

import { ErrorPage as CommonErrorPage } from '@repo/common/containers';
import { i18n, LinguiClientProvider } from '@repo/i18n/client';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';

function getErrorPageLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const [pathLocale] = window.location.pathname.split('/').filter(Boolean);
  if (!pathLocale) return DEFAULT_LOCALE;
  return SUPPORTED_LOCALES.includes(pathLocale) ? pathLocale : DEFAULT_LOCALE;
}

function getErrorPageMessages(locale: string) {
  return i18n.locale === locale ? i18n.messages : {};
}

export default function ErrorPage(
  props: React.ComponentProps<typeof CommonErrorPage>,
) {
  const locale = getErrorPageLocale();

  return (
    <LinguiClientProvider
      key={locale}
      initialLocale={locale}
      initialMessages={getErrorPageMessages(locale)}
    >
      <CommonErrorPage {...props} />
    </LinguiClientProvider>
  );
}
