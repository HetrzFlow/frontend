import { notFound } from 'next/navigation';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE } from '@repo/i18n/const';

type OptionalLocaleParams = {
  locale?: string[];
};

export function generateOptionalLocaleStaticParams() {
  return [
    { locale: [] },
    ...linguiConfig.locales.map((locale) => ({
      locale: [locale],
    })),
  ];
}

export function resolveLocaleFromParams(params: OptionalLocaleParams) {
  const segments = params.locale ?? [];

  if (segments.length === 0) {
    return DEFAULT_LOCALE;
  }

  if (segments.length !== 1) {
    notFound();
  }

  const locale = segments[0]!;

  if (!linguiConfig.locales.includes(locale)) {
    notFound();
  }

  return locale;
}

export type { OptionalLocaleParams };
