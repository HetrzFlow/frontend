import type { NextRequest } from 'next/server';
import Negotiator from 'negotiator';
import { createI18nMiddleware } from 'next-international/middleware';

import linguiConfig from '../config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../const';

const { locales } = linguiConfig;
const LOCALE_COOKIE = 'Next-Locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getPathnameLocale(pathname: string) {
  const locale = pathname.split('/')[1];
  return locale && SUPPORTED_LOCALES.includes(locale) ? locale : undefined;
}

const nextInternationalMiddleware = createI18nMiddleware({
  locales,
  defaultLocale: DEFAULT_LOCALE,
  urlMappingStrategy: 'rewriteDefault',
  resolveLocaleFromRequest: (request: NextRequest) => {
    // get locale from http header
    const langHeader = request.headers.get('accept-language') || undefined;
    const languages = new Negotiator({
      headers: { 'accept-language': langHeader },
    }).languages(locales.slice());

    return languages[0] || DEFAULT_LOCALE;
  },
});

export const i18nMiddleware = (request: NextRequest) => {
  const response = nextInternationalMiddleware(request);
  const localeCookie = response.cookies.get(LOCALE_COOKIE);
  const pathnameLocale = getPathnameLocale(request.nextUrl.pathname);
  const nextLocale = pathnameLocale || localeCookie?.value;

  if (nextLocale) {
    response.cookies.set(LOCALE_COOKIE, nextLocale, {
      maxAge: LOCALE_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'strict',
    });
  }

  return response;
};
